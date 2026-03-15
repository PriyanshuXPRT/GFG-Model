"""
chart_selector.py — selects / overrides the most appropriate chart type.
"""


def select_chart(query_struct: dict, exec_result: dict) -> str:
    """
    Decide on the best chart type given the query structure and the result shape.
    The LLM suggestion is used as a starting point but may be overridden.
    """
    suggested = query_struct.get("chart_type", "bar")
    is_time = query_struct.get("time_series", False)
    labels = exec_result.get("labels", [])
    n_labels = len(labels)

    # Time series → always line
    if is_time:
        return "line"

    # Very few categories → pie looks great
    if n_labels <= 6 and suggested == "pie":
        return "pie"

    # Pie with too many slices → downgrade to bar
    if suggested == "pie" and n_labels > 8:
        return "bar"

    # Histogram — keep if user asked for it
    if suggested == "histogram":
        return "histogram"

    # Default: honour the LLM suggestion
    return suggested if suggested in {"bar", "line", "pie", "histogram", "scatter"} else "bar"
