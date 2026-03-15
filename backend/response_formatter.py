"""
response_formatter.py — formats the pipeline result into a clean API response.
"""
from __future__ import annotations


def format_response(
    query_struct: dict,
    exec_result: dict,
    chart_type: str,
) -> dict:
    """
    Build the final JSON response sent to the frontend.
    """
    metric = exec_result["metric"]
    group_by = exec_result["group_by"]
    labels = exec_result["labels"]
    values = exec_result["values"]

    # Build chart-library-ready datasets
    chart_data = [
        {"label": str(lbl), "value": val}
        for lbl, val in zip(labels, values)
    ]

    # Human-readable summary sentence
    agg_label = {
        "sum": "Total",
        "mean": "Average",
        "count": "Count",
        "min": "Minimum",
        "max": "Maximum",
    }.get(query_struct.get("aggregation", "sum"), "Total")

    metric_label = metric.replace("_", " ").title()
    group_label = (group_by or "").replace("_", " ").title()

    summary = f"{agg_label} {metric_label}"
    if group_label:
        summary += f" by {group_label}"

    filters = query_struct.get("filters", {}) or {}
    if filters:
        filter_parts = [f"{k.replace('_', ' ').title()} = {v}" for k, v in filters.items()]
        summary += " (" + ", ".join(filter_parts) + ")"

    return {
        "title": query_struct.get("title", summary),
        "summary": summary,
        "chart_type": chart_type,
        "chart_data": chart_data,
        "metric": metric,
        "group_by": group_by,
        "aggregation": query_struct.get("aggregation", "sum"),
        "filters_applied": filters,
        "total_rows_queried": exec_result["total_rows"],
        "data_points": len(chart_data),
    }
