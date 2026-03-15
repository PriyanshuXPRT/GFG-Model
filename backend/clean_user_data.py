import re
import pandas as pd
from io import StringIO
from pathlib import Path

def clean_amazon_data():
    raw_path = Path(r"C:\Users\preda\Desktop\Model\Amazon Sales.csv")
    dest_path = Path(__file__).parent / "sales_data.csv"
    
    print(f"Reading raw data from {raw_path}...")
    with open(raw_path, "rb") as f:
        content = f.read().decode("latin1", errors="ignore")
    
    # Extract the CSV part starting from the header
    match = re.search(r"order_id,order_date,product_id.*", content)
    if not match:
        raise ValueError("Could not find the CSV header 'order_id,order_date...' in the file.")
    
    csv_data = content[match.start():]
    
    # Strip trailing bplist/html junk if any (usually starts with < or \0)
    # We find the last newline and hope it's the end of the last row
    # Actually, pandas is usually good at ignoring trailing junk if we use it correctly
    
    df = pd.read_csv(StringIO(csv_data))
    
    # Basic validation
    expected_cols = ["order_id", "order_date", "product_category", "total_revenue"]
    for col in expected_cols:
        if col not in df.columns:
            # Try to see if it's there but with weird chars
            found = False
            for real_col in df.columns:
                if col in real_col:
                    df.rename(columns={real_col: col}, inplace=True)
                    found = True
                    break
            if not found:
                print(f"Warning: Expected column '{col}' not found exactly. Columns are: {df.columns.tolist()}")

    df.to_csv(dest_path, index=False)
    print(f"✅ Cleaned dataset saved to {dest_path}")
    print(f"Row count: {len(df)}")

if __name__ == "__main__":
    clean_amazon_data()
