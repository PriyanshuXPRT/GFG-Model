"""
dataset_loader.py — loads and caches the sales CSV dataset.
"""
from pathlib import Path
import pandas as pd

_df: pd.DataFrame | None = None
_schema: dict | None = None

DATASET_PATH = Path(__file__).parent / "sales_data.csv"

COLUMN_DESCRIPTIONS = {
    "order_id": "Unique order identifier (integer)",
    "order_date": "Date of purchase (YYYY-MM-DD string)",
    "product_id": "Product identifier (string)",
    "product_category": "Category of the product (string)",
    "price": "Original product price (float)",
    "discount_percent": "Discount applied in % (integer)",
    "quantity_sold": "Units sold (integer)",
    "customer_region": "Customer location / region (string)",
    "payment_method": "Payment type (string)",
    "rating": "Customer rating 1-5 (float)",
    "review_count": "Number of reviews (integer)",
    "discounted_price": "Final price after discount (float)",
    "total_revenue": "Total order revenue (float)",
}


def get_df() -> pd.DataFrame:
    global _df
    if _df is None:
        if not DATASET_PATH.exists():
            raise FileNotFoundError(
                f"Dataset not found at {DATASET_PATH}. "
                "Run `python generate_dataset.py` first."
            )
        _df = pd.read_csv(DATASET_PATH, parse_dates=["order_date"])
    return _df


def get_schema() -> dict:
    global _schema
    if _schema is None:
        df = get_df()
        _schema = {
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "descriptions": COLUMN_DESCRIPTIONS,
            "numeric_columns": df.select_dtypes(include="number").columns.tolist(),
            "categorical_columns": df.select_dtypes(include="object").columns.tolist(),
            "sample_values": {
                col: df[col].dropna().unique()[:8].tolist()
                for col in df.columns
            },
            "row_count": len(df),
        }
    return _schema
