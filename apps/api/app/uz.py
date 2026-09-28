from io import BytesIO
from pathlib import Path
from zipfile import BadZipFile, ZipFile

import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile

router = APIRouter(prefix="/api/uz", tags=["UZs não recebidas"])
MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_EXPANDED_BYTES = 100 * 1024 * 1024
REQUIRED_COLUMNS = {"UZ", "Loja", "Remessa", "Rota"}


def _read_records(filename: str, content: bytes) -> list[dict[str, str]]:
    extension = Path(filename).suffix.lower()
    if extension not in {".csv", ".xlsx"}:
        raise HTTPException(415, "Envie uma planilha CSV ou XLSX.")
    if not content:
        raise HTTPException(422, "O arquivo está vazio.")
    try:
        if extension == ".xlsx":
            with ZipFile(BytesIO(content)) as archive:
                if sum(item.file_size for item in archive.infolist()) > MAX_EXPANDED_BYTES:
                    raise HTTPException(413, "A planilha descompactada excede 100 MB.")
            frame = pd.read_excel(BytesIO(content), dtype=str, engine="openpyxl")
        else:
            frame = pd.read_csv(BytesIO(content), dtype=str, sep=None, engine="python", encoding="utf-8-sig")
    except (ValueError, UnicodeError, pd.errors.ParserError, pd.errors.EmptyDataError, BadZipFile, KeyError, OSError) as exc:
        raise HTTPException(422, "Não foi possível ler a planilha.") from exc
    frame.columns = [str(column).strip() for column in frame.columns]
    missing = REQUIRED_COLUMNS.difference(frame.columns)
    if missing:
        raise HTTPException(422, f"Colunas obrigatórias ausentes: {', '.join(sorted(missing))}.")
    frame = frame.dropna(subset=["UZ"])
    records = []
    for row in frame.loc[:, ["UZ", "Loja", "Remessa", "Rota"]].fillna("").to_dict("records"):
        records.append({key: str(value).strip() for key, value in row.items()})
    if not records:
        raise HTTPException(422, "A planilha não possui UZs válidas.")
    return records


@router.post("/dashboard")
def create_dashboard(file: UploadFile):
    try:
        content = file.file.read(MAX_FILE_BYTES + 1)
        if len(content) > MAX_FILE_BYTES:
            raise HTTPException(413, "O arquivo deve ter no máximo 10 MB.")
        records = _read_records(file.filename or "", content)
        return {"filename": file.filename or "planilha", "records": records}
    finally:
        file.file.close()