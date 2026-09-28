from datetime import datetime
from io import BytesIO
from zipfile import BadZipFile

import pandas as pd
from fastapi import APIRouter, Form, HTTPException, UploadFile

router = APIRouter(prefix="/api/capacity", tags=["Capacidade por rota"])
MAX_FILE_BYTES = 10 * 1024 * 1024


def normalize(value):
    if pd.isna(value):
        return ""
    text = str(value).strip().upper()
    return text[:-2] if text.endswith(".0") and text[:-2].isdigit() else text


def read_excel(file: UploadFile) -> pd.DataFrame:
    content = file.file.read(MAX_FILE_BYTES + 1)
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(413, f"{file.filename} excede o limite de 10 MB.")
    if not content:
        raise HTTPException(422, f"{file.filename} está vazio.")
    try:
        return pd.read_excel(BytesIO(content))
    except (BadZipFile, ValueError, OSError) as exc:
        raise HTTPException(422, f"Não foi possível ler {file.filename}. Envie um XLSX válido.") from exc


def require_columns(frame: pd.DataFrame, columns: set[str], label: str):
    missing = columns.difference(frame.columns)
    if missing:
        raise HTTPException(422, f"{label}: colunas ausentes: {', '.join(sorted(missing))}.")


@router.post("/validate")
def validate_capacity(
    availability: UploadFile,
    schedule: UploadFile,
    stores: UploadFile,
    date: str = Form(...),
):
    try:
        try:
            selected_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError as exc:
            raise HTTPException(422, "Informe a data no formato AAAA-MM-DD.") from exc

        available = read_excel(availability)
        planned = read_excel(schedule)
        store_map = read_excel(stores)
        require_columns(available, {"Rota", "Peças"}, "Disponibilidade")
        require_columns(planned, {"Loja", "Rota", "Carregamento", "Capacidade do veículo"}, "Programação")
        require_columns(store_map, {"Loja", "Rota", "Max Peças"}, "Lojas e rotas")

        available = available[available["Rota"].notna()].copy()
        available["route"] = available["Rota"].map(normalize)
        available["pieces"] = pd.to_numeric(available["Peças"], errors="coerce").fillna(0)
        stock = available.groupby("route", as_index=False)["pieces"].sum().set_index("route")["pieces"].to_dict()

        planned = planned.copy()
        planned["route"] = planned["Rota"].map(normalize)
        planned["store"] = planned["Loja"].map(normalize)
        planned["date"] = pd.to_datetime(planned["Carregamento"], errors="coerce", dayfirst=True).dt.date
        planned["capacity"] = pd.to_numeric(planned["Capacidade do veículo"], errors="coerce").fillna(0)
        planned["hour"] = planned.get("Hora", pd.Series("", index=planned.index)).map(
            lambda value: value.strftime("%H:%M") if hasattr(value, "strftime") else str(value or "").strip()
        )

        valid_dates = sorted({item for item in planned["date"].dropna()})
        day = planned[planned["date"].eq(selected_date)].copy()
        if day.empty:
            raise HTTPException(422, {
                "message": "Não há carregamentos programados para a data selecionada.",
                "available_dates": [item.isoformat() for item in valid_dates],
            })

        store_map = store_map.copy()
        store_map["store"] = store_map["Loja"].map(normalize)
        store_map["stock_route"] = store_map["Rota"].map(normalize)
        store_map["max_pieces"] = pd.to_numeric(store_map["Max Peças"], errors="coerce")
        day = day.merge(
            store_map[["store", "stock_route", "max_pieces"]].drop_duplicates("store"),
            on="store",
            how="left",
        )
        missing_routes = sorted(
            day.loc[day["stock_route"].isna() | day["stock_route"].eq(""), "store"].unique()
        )
        if missing_routes:
            raise HTTPException(
                422,
                "Lojas sem rota correspondente em Lojas e rotas: " + ", ".join(missing_routes) + ".",
            )

        truck_column = "Ocupação Plano / Planejamento de Carretas TP"
        if truck_column not in day:
            day[truck_column] = ""
        if "RESTRIÇÃO" not in day:
            day["RESTRIÇÃO"] = pd.NA
        day["RESTRIÇÃO"] = pd.to_numeric(day["RESTRIÇÃO"], errors="coerce")
        loads = (
            day.groupby(["route", "stock_route", truck_column, "hour"], dropna=False, as_index=False)
            .agg(
                stores=("store", lambda items: ", ".join(sorted(set(item for item in items if item)))),
                required=("capacity", "max"),
                max_pieces=("max_pieces", lambda items: items.sum(min_count=1)),
                restrictions=("RESTRIÇÃO", lambda items: items.sum(min_count=1)),
            )
            .sort_values(["hour", "route"])
            .reset_index(drop=True)
        )

        rows = []
        for _, load in loads.iterrows():
            route = load["route"] or "SEM ROTA"
            stock_route = load["stock_route"]
            before = int(round(stock.get(stock_route, 0)))
            required = int(round(load["required"]))
            served = min(before, required)
            shortage = max(required - before, 0)
            remaining = max(before - required, 0)
            stock[stock_route] = remaining
            rows.append({
                "date": selected_date.isoformat(),
                "hour": load["hour"],
                "route": route,
                "stock_route": stock_route,
                "truck": str(load[truck_column] or ""),
                "stores": load["stores"],
                "required": required,
                "available_before": before,
                "served": served,
                "shortage": shortage,
                "remaining": remaining,
                "status": "OK - SUFICIENTE" if shortage == 0 else "FALTA PEÇAS",
                "max_pieces": None if pd.isna(load["max_pieces"]) else int(round(load["max_pieces"])),
                "restrictions": None if pd.isna(load["restrictions"]) else int(round(load["restrictions"])),
            })

        result = pd.DataFrame(rows)
        summary = (
            result.groupby("route", as_index=False)
            .agg(required=("required", "sum"), initial_available=("available_before", "first"),
                 served=("served", "sum"), total_shortage=("shortage", "sum"), final_balance=("remaining", "last"))
        )
        summary["status"] = summary["total_shortage"].map(lambda value: "OK - SUFICIENTE" if value == 0 else "FALTA PEÇAS")
        return {
            "date": selected_date.isoformat(),
            "available_dates": [item.isoformat() for item in valid_dates],
            "loads": rows,
            "summary": summary.to_dict("records"),
            "totals": {
                "loads": len(rows),
                "required": int(result["required"].sum()),
                "served": int(result["served"].sum()),
                "shortage": int(result["shortage"].sum()),
            },
        }
    finally:
        availability.file.close()
        schedule.file.close()
        stores.file.close()
