"""
query_interpreter.py — sends NL query to Gemini and returns structured JSON.
"""
import json
import os
import re
import textwrap

import google.generativeai as genai
from dotenv import load_dotenv

from dataset_loader import get_schema

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

MODEL_NAME = "gemini-2.5-flash"

SYSTEM_INSTRUCTION = textwrap.dedent("""
You are a business intelligence query interpreter.
Your job is to convert a natural language question into a structured JSON instruction
that will be used to query a sales dataset using Python Pandas.

You must ONLY use the exact column names listed below. Do NOT invent columns.
You must return ONLY valid JSON — no markdown, no explanation, no code fences.

### Dataset columns you may use:
{columns}

### Sample values per column:
{sample_values}

### Output format (return exactly this JSON shape):
{{
  "filters": {{
    "<column_name>": "<value>"
  }},
  "group_by": "<column_name or null>",
  "metric": "<numeric_column>",
  "aggregation": "<sum | mean | count | min | max>",
  "chart_type": "<bar | line | pie | histogram | scatter>",
  "time_series": <true | false>,
  "top_n": <integer or null>,
  "sort_order": "<desc | asc | null>",
  "title": "<short dashboard title>"
}}

Rules:
- "filters" can be empty {{}} if no filtering is needed.
- "group_by" must be one of the categorical or date columns.
- "metric" must be one of the numeric columns.
- "aggregation" must be one of: sum, mean, count, min, max.
- "chart_type" must be one of: bar, line, pie, histogram, scatter.
- If the query involves time or monthly/yearly trends, set "time_series": true and "group_by": "order_date".
- If the query asks for top N items, set "top_n" to that number.
- Keep "title" short (≤ 10 words).
""")


def interpret_query(user_query: str, conversation_history: list[dict] | None = None) -> dict:
    """
    Call Gemini to convert a natural language query into structured JSON.
    Returns a dict with keys: filters, group_by, metric, aggregation, chart_type, etc.
    Raises ValueError if parsing fails.
    """
    schema = get_schema()

    sample_str = "\n".join(
        f"  {col}: {vals}" for col, vals in schema["sample_values"].items()
    )

    system_prompt = SYSTEM_INSTRUCTION.format(
        columns=", ".join(schema["columns"]),
        sample_values=sample_str,
    )

    # Build context from conversation history (last 3 turns for brevity)
    context_block = ""
    if conversation_history:
        recent = conversation_history[-3:]
        context_parts = []
        for turn in recent:
            context_parts.append(f"User: {turn.get('query', '')}")
            if turn.get("title"):
                context_parts.append(f"Dashboard: {turn.get('title', '')}")
        context_block = "\nPrevious conversation context:\n" + "\n".join(context_parts) + "\n"

    full_prompt = system_prompt + context_block + f"\nUser query: {user_query}"

    model = genai.GenerativeModel(MODEL_NAME)
    response = model.generate_content(full_prompt)
    raw = response.text.strip()

    # Strip markdown code fences if present
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("```").strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Gemini returned invalid JSON: {raw}") from exc

    return result
