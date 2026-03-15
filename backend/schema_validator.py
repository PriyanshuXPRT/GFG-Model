"""
schema_validator.py — validates the structured query from Gemini before execution.
Prevents hallucinated column names or aggregations from reaching Pandas.
"""
from dataset_loader import get_schema

VALID_AGGREGATIONS = {"sum", "mean", "count", "min", "max"}
VALID_CHART_TYPES = {"bar", "line", "pie", "histogram", "scatter"}


class ValidationError(Exception):
    """Raised when the LLM output fails schema validation."""


def validate_query(query_struct: dict) -> dict:
    """
    Validate and normalise the query structure returned by Gemini.
    Returns the (possibly corrected) structure or raises ValidationError.
    """
    schema = get_schema()
    valid_columns = set(schema["columns"])
    numeric_columns = set(schema["numeric_columns"])

    errors = []

    # --- filters ---
    filters = query_struct.get("filters", {}) or {}
    sanitized_filters = {}
    for col, val in filters.items():
        if col not in valid_columns:
            errors.append(f"Filter column '{col}' does not exist in the dataset.")
        else:
            sanitized_filters[col] = val
    query_struct["filters"] = sanitized_filters

    # --- group_by ---
    group_by = query_struct.get("group_by")
    if group_by and group_by not in valid_columns:
        errors.append(f"group_by column '{group_by}' does not exist in the dataset.")

    # --- metric ---
    metric = query_struct.get("metric")
    if not metric:
        # Default to total_revenue
        query_struct["metric"] = "total_revenue"
        metric = "total_revenue"
    elif metric not in valid_columns:
        errors.append(
            f"Metric column '{metric}' does not exist. "
            f"Numeric columns are: {', '.join(sorted(numeric_columns))}."
        )
    elif metric not in numeric_columns and query_struct.get("aggregation") != "count":
        errors.append(f"'{metric}' is not a numeric column and cannot be aggregated.")

    # --- aggregation ---
    agg = query_struct.get("aggregation", "sum")
    if agg not in VALID_AGGREGATIONS:
        errors.append(
            f"Aggregation '{agg}' is not valid. "
            f"Choose from: {', '.join(VALID_AGGREGATIONS)}."
        )

    # --- chart_type ---
    chart = query_struct.get("chart_type", "bar")
    if chart not in VALID_CHART_TYPES:
        query_struct["chart_type"] = "bar"  # safe fallback

    if errors:
        raise ValidationError(
            "Query validation failed:\n" + "\n".join(f"• {e}" for e in errors)
        )

    return query_struct
