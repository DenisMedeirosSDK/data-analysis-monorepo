from pathlib import Path
import os
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
python = root / ".venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
if not python.exists():
    sys.exit("Execute npm run setup:api primeiro.")
commands = {
    "dev": ["-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"],
    "test": ["-m", "pytest", "-q"],
}
raise SystemExit(subprocess.call([str(python), *commands[sys.argv[1]]], cwd=root / "apps/api"))
