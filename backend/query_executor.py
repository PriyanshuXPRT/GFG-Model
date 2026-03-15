"""
query_executor.py — executes validated query structs against the Pandas DataFrame.
"""
from __future__ import annotations

import pandas as pd

from dataset_loader import get_df


class ExecutionError(Exception):
    pass


def execute_query(query_struct: dict) -> dict:
    """
    Apply filters, groupby, and aggregation to the DataFrame.
    Returns a dict with keys: labels, values, total_rows.
    """
    df = get_df().copy()

    # ── 1. Apply filters ──────────────────────────────────────────────────────
    filters = query_struct.get("filters", {}) or {}
    for col, val in filters.items():
        if col == "order_date":
            continue  # handled via time_series
        if col not in df.columns:
            continue
        if df[col].dtype == object:
            # case-insensitive string match
            mask = df[col].str.lower() == str(val).lower()
            df = df[mask]
        else:
            try:
                df = df[df[col] == type(df[col].iloc[0])(val)]
            except Exception:
                pass

    if len(df) == 0:
        raise ExecutionError(
            "No data found after applying the specified filters. "
            "Try different filter values."
        )

    # ── 2. Time-series grouping ───────────────────────────────────────────────
    is_time = query_struct.get("time_series", False)
    group_by = query_struct.get("group_by")
    metric = query_struct.get("metric", "total_revenue")
    agg = query_struct.get("aggregation", "sum")

    if is_time and group_by == "order_date":
        df["_period"] = df["order_date"].dt.to_period("M").astype(str)
        group_col = "_period"
    else:
        group_col = group_by

    # ── 3. Apply aggregation ──────────────────────────────────────────────────
    if group_col and group_col in df.columns:
        if agg == "count":
            grouped = df.groupby(group_col).size().reset_index(name=metric)
        else:
            agg_func = getattr(df.groupby(group_col)[metric], agg)
            grouped = agg_func().reset_index()

        if is_time:
            grouped = grouped.sort_values(group_col)

        # top-N
        top_n = query_struct.get("top_n")
        sort_order = query_struct.get("sort_order", "desc")
        if top_n and not is_time:
            ascending = sort_order == "asc"
            grouped = grouped.sort_values(metric, ascending=ascending).tail(top_n) if ascending else \
                      grouped.sort_values(metric, ascending=False).head(top_n)

        labels = grouped[group_col].astype(str).tolist()
        values = grouped[metric].round(2).tolist()
    else:
        # Scalar aggregation (e.g. histogram of a single numeric column)
        if agg == "count":
            scalar_val = len(df)
        else:
            scalar_val = round(getattr(df[metric], agg)(), 2)
        labels = [metric]
        values = [scalar_val]

    return {
        "labels": labels,
        "values": values,
        "metric": metric,
        "group_by": group_col,
        "total_rows": len(df),
    }
