from pathlib import Path
import subprocess
import venv
import os

root = Path(__file__).resolve().parents[1]
environment = root / ".venv"
venv.create(environment, with_pip=True)
python = environment / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
requirements = root / "apps/api/requirements.lock.txt"
if requirements.exists():
    subprocess.run([str(python), "-m", "pip", "install", "-r", str(requirements)], check=True)
subprocess.run([str(python), "-m", "pip", "install", "-e", str(root / "apps/api") + "[dev]"], check=True)
