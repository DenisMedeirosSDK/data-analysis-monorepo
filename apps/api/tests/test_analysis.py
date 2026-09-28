from io import BytesIO

import pandas as pd
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_csv_analysis():
    response = client.post("/api/analyze", files={"file": ("dados.csv", b"produto;valor\na;10\nb;20\nc;\n")})
    assert response.status_code == 200
    data = response.json()
    assert (data["rows"], data["columns"], data["missing"]) == (3, 2, 1)
    assert data["statistics"]["valor"]["mean"] == 15
    assert data["preview"][2]["valor"] is None


def test_excel_analysis():
    buffer = BytesIO()
    pd.DataFrame({"valor": [5, 15], "data": pd.to_datetime(["2026-01-01", "2026-01-02"])}).to_excel(buffer, index=False, engine="openpyxl")
    response = client.post("/api/analyze", files={"file": ("dados.xlsx", buffer.getvalue())})
    assert response.status_code == 200
    assert response.json()["statistics"]["valor"]["mean"] == 10
    assert response.json()["preview"][0]["data"].startswith("2026-01-01")


def test_invalid_files():
    for name, content, expected in [
        ("file.txt", b"test", 415), ("empty.csv", b"", 422),
        ("broken.xlsx", b"not excel", 422), ("header.csv", b"a,b\n", 422),
        ("big.csv", b"x" * (10 * 1024 * 1024 + 1), 413),
    ]:
        assert client.post("/api/analyze", files={"file": (name, content)}).status_code == expected


def _excel_bytes(frame):
    buffer = BytesIO()
    frame.to_excel(buffer, index=False, engine="openpyxl")
    return buffer.getvalue()


def test_capacity_validation_consumes_route_balance_in_sequence():
    availability = _excel_bytes(pd.DataFrame({"Rota": ["R1"], "Peças": [100]}))
    schedule = _excel_bytes(pd.DataFrame({
        "Loja": ["10", "20"], "Rota": ["R1", "R1"],
        "Carregamento": ["21/09/2026", "21/09/2026"],
        "Hora": ["08:00", "09:00"],
        "Capacidade do veículo": [70, 70],
        "Ocupação Plano / Planejamento de Carretas TP": ["A", "B"],
    }))
    stores = _excel_bytes(pd.DataFrame({"Loja": ["10", "20"], "Rota": ["R1", "R1"], "Max Peças": [70, 70]}))
    response = client.post(
        "/api/capacity/validate",
        data={"date": "2026-09-21"},
        files={
            "availability": ("availability.xlsx", availability),
            "schedule": ("schedule.xlsx", schedule),
            "stores": ("stores.xlsx", stores),
        },
    )

    assert response.status_code == 200
    report = response.json()
    assert report["totals"] == {"loads": 2, "required": 140, "served": 100, "shortage": 40}
    assert report["loads"][0]["remaining"] == 30
    assert report["loads"][1]["shortage"] == 40
    assert report["summary"][0]["final_balance"] == 0


def test_capacity_matches_schedule_to_floor_route_using_store_mapping():
    availability = _excel_bytes(pd.DataFrame({"Rota": ["504-5R"], "Peças": [4420]}))
    schedule = _excel_bytes(pd.DataFrame({
        "Loja": ["430"], "Rota": ["TP PF 5R"],
        "Carregamento": ["24/09/2026"], "Hora": ["14:40"],
        "Capacidade do veículo": [16000],
    }))
    stores = _excel_bytes(pd.DataFrame({"Loja": ["430"], "Rota": ["504-5R"], "Max Peças": [8000]}))
    response = client.post(
        "/api/capacity/validate",
        data={"date": "2026-09-24"},
        files={
            "availability": ("availability.xlsx", availability),
            "schedule": ("schedule.xlsx", schedule),
            "stores": ("stores.xlsx", stores),
        },
    )

    assert response.status_code == 200
    load = response.json()["loads"][0]
    assert load["route"] == "TP PF 5R"
    assert load["stock_route"] == "504-5R"
    assert load["available_before"] == 4420
    assert load["shortage"] == 11580
