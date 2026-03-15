"""
Generate a synthetic sales dataset with ~50,000 rows.
Run once: python generate_dataset.py
"""
import numpy as np
import pandas as pd
from pathlib import Path

np.random.seed(42)

N = 50_002

CATEGORIES = ["Electronics", "Clothing", "Home & Garden", "Sports", "Books", "Food & Beverage", "Automotive", "Beauty"]
REGIONS = ["North America", "Europe", "Asia", "South America", "Africa", "Middle East", "Australia"]
PAYMENT_METHODS = ["Credit Card", "Debit Card", "PayPal", "Bank Transfer", "Crypto"]

start_date = pd.Timestamp("2022-01-01")
end_date = pd.Timestamp("2024-12-31")
date_range_days = (end_date - start_date).days

order_dates = start_date + pd.to_timedelta(np.random.randint(0, date_range_days, N), unit="D")

product_ids = ["P" + str(np.random.randint(1000, 9999)) for _ in range(N)]

categories = np.random.choice(CATEGORIES, N, p=[0.20, 0.18, 0.13, 0.12, 0.10, 0.11, 0.08, 0.08])
regions = np.random.choice(REGIONS, N, p=[0.28, 0.22, 0.20, 0.10, 0.08, 0.07, 0.05])
payment_methods = np.random.choice(PAYMENT_METHODS, N, p=[0.35, 0.25, 0.22, 0.12, 0.06])

prices = np.round(np.random.lognormal(mean=4.0, sigma=1.0, size=N), 2)
prices = np.clip(prices, 5, 5000)

discount_pct = np.random.choice([0, 5, 10, 15, 20, 25, 30, 40, 50], N,
                                 p=[0.30, 0.15, 0.15, 0.10, 0.10, 0.08, 0.06, 0.04, 0.02])

quantity_sold = np.random.randint(1, 51, N)

ratings = np.round(np.clip(np.random.normal(3.8, 0.8, N), 1.0, 5.0), 1)
review_count = np.random.randint(0, 2001, N)

discounted_price = np.round(prices * (1 - discount_pct / 100), 2)
total_revenue = np.round(discounted_price * quantity_sold, 2)

df = pd.DataFrame({
    "order_id": range(1, N + 1),
    "order_date": order_dates.strftime("%Y-%m-%d"),
    "product_id": product_ids,
    "product_category": categories,
    "price": prices,
    "discount_percent": discount_pct,
    "quantity_sold": quantity_sold,
    "customer_region": regions,
    "payment_method": payment_methods,
    "rating": ratings,
    "review_count": review_count,
    "discounted_price": discounted_price,
    "total_revenue": total_revenue,
})

out_path = Path(__file__).parent / "sales_data.csv"
df.to_csv(out_path, index=False)
print(f"✅ Dataset generated: {out_path}  ({len(df):,} rows)")
