"""
main.py — FastAPI application entry point.

Routes:
  POST /api/query   - natural language → dashboard data
  GET  /api/schema  - returns dataset column info
  POST /api/upload  - upload a custom CSV (overwrites the dataset)
"""
from __future__ import annotations

import io
import traceback
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import dataset_loader
from chart_selector import select_chart
from query_executor import ExecutionError, execute_query
from query_interpreter import interpret_query
from response_formatter import format_response
from schema_validator import ValidationError, validate_query

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Conversational BI Dashboard API",
    version="1.0.0",
    description="Natural language → interactive business dashboard",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ─────────────────────────────────────────────────
class QueryRequest(BaseModel):
    query: str
    conversation_history: list[dict[str, Any]] | None = None


class QueryResponse(BaseModel):
    success: bool
    data: dict[str, Any] | None = None
    query_struct: dict[str, Any] | None = None
    error: str | None = None


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Conversational BI Dashboard API is running ✅"}


@app.get("/api/schema")
async def get_schema():
    """Return dataset schema info (columns, types, sample values)."""
    try:
        schema = dataset_loader.get_schema()
        return {"success": True, "schema": schema}
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Main pipeline: NL query → Gemini → validate → execute → format → return.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        # Step 1: LLM interpretation
        query_struct = interpret_query(
            request.query,
            conversation_history=request.conversation_history,
        )

        # Step 2: Schema validation (guardrails)
        query_struct = validate_query(query_struct)

        # Step 3: Pandas execution
        exec_result = execute_query(query_struct)

        # Step 4: Chart selection
        chart_type = select_chart(query_struct, exec_result)

        # Step 5: Format response
        dashboard_data = format_response(query_struct, exec_result, chart_type)

        return QueryResponse(
            success=True,
            data=dashboard_data,
            query_struct=query_struct,
        )

    except ValidationError as exc:
        return QueryResponse(success=False, error=str(exc))
    except ExecutionError as exc:
        return QueryResponse(success=False, error=str(exc))
    except ValueError as exc:
        return QueryResponse(success=False, error=f"LLM parsing error: {exc}")
    except Exception as exc:
        traceback.print_exc()
        return QueryResponse(success=False, error=f"Internal error: {exc}")


@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload a custom CSV dataset and replace the current one.
    The system will auto-detect schema.
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {exc}")

    dest = Path(__file__).parent / "sales_data.csv"
    df.to_csv(dest, index=False)

    # Clear the cache so the new CSV is loaded on next request
    dataset_loader._df = None
    dataset_loader._schema = None

    return {
        "success": True,
        "message": f"Dataset uploaded: {len(df):,} rows, {list(df.columns)} columns.",
        "rows": len(df),
        "columns": list(df.columns),
    }


# ── Dev runner ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
