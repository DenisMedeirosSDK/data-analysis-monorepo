from io import BytesIO
import json
from pathlib import Path
from zipfile import BadZipFile, ZipFile
from xml.etree.ElementTree import ParseError

import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile
from pydantic import BaseModel
from openpyxl.utils.exceptions import InvalidFileException
from app.uz import router as uz_router
from app.capacity import router as capacity_router

app = FastAPI(title="Data Analysis API", version="0.1.0")
app.include_router(uz_router)
app.include_router(capacity_router)
MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_EXPANDED_BYTES = 100 * 1024 * 1024


class Analysis(BaseModel):
    filename: str
    rows: int
    columns: int
    missing: int
    fields: list[dict]
    preview: list[dict]
    statistics: dict


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze", response_model=Analysis)
def analyze(file: UploadFile):
    try:
        extension = Path(file.filename or "").suffix.lower()
        if extension not in {".csv", ".xlsx"}:
            raise HTTPException(415, "Envie um arquivo CSV ou XLSX.")
        content = file.file.read(MAX_FILE_BYTES + 1)
        if len(content) > MAX_FILE_BYTES:
            raise HTTPException(413, "O arquivo deve ter no máximo 10 MB.")
        if not content:
            raise HTTPException(422, "O arquivo está vazio.")
        try:
            if extension == ".xlsx":
                with ZipFile(BytesIO(content)) as archive:
                    if sum(item.file_size for item in archive.infolist()) > MAX_EXPANDED_BYTES:
                        raise HTTPException(413, "A planilha descompactada excede 100 MB.")
                frame = pd.read_excel(BytesIO(content), engine="openpyxl")
            else:
                frame = pd.read_csv(BytesIO(content), sep=None, engine="python", encoding="utf-8-sig")
        except (ValueError, UnicodeError, pd.errors.ParserError, pd.errors.EmptyDataError,
                BadZipFile, InvalidFileException, ParseError, KeyError, OSError) as exc:
            raise HTTPException(422, "Não foi possível ler o arquivo. Verifique o formato e use CSV em UTF-8.") from exc
        if frame.empty:
            raise HTTPException(422, "O arquivo não contém linhas de dados.")
        # Normalize labels for JSON and disambiguate duplicate names.
        used = set()
        labels = []
        for column in frame.columns:
            base = str(column)
            label = base
            index = 2
            while label in used:
                label = f"{base}_{index}"
                index += 1
            used.add(label)
            labels.append(label)
        frame.columns = labels
        numeric = frame.select_dtypes(include="number")
        return Analysis(
            filename=file.filename or "arquivo",
            rows=len(frame),
            columns=len(frame.columns),
            missing=int(frame.isna().sum().sum()),
            fields=[{"name": name, "dtype": str(dtype), "missing": int(frame[name].isna().sum())}
                    for name, dtype in frame.dtypes.items()],
            preview=json.loads(frame.head(20).to_json(orient="records", date_format="iso")),
            statistics=json.loads(numeric.describe().to_json()) if len(numeric.columns) else {},
        )
    finally:
        file.file.close()
