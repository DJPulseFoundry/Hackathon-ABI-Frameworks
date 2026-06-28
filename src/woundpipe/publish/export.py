"""S6 — publish. Build the static export.json the frontend reads (no live backend)."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from woundpipe import repository


def publish(con: sqlite3.Connection, out_path: str, frontend_public: str | None = None) -> dict:
    data = repository.export_json(con)
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(out_path).write_text(json.dumps(data, indent=2, default=str))
    # also drop into the frontend public dir if present (wires REQ-frontend-3)
    if frontend_public and Path(frontend_public).parent.exists():
        Path(frontend_public).write_text(json.dumps(data, default=str))
    n = len(data.get("patients", []))
    return {"export_path": out_path, "patients": n}
