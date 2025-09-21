import pandas as pd

# Load the Excel file
df = pd.read_excel("seniors_data_2020-2023.xlsx", skiprows=6)

# Drop completely empty rows
df = df.dropna(how="all")


df = df.drop(columns=['S. No.'])
print(df.head())

df = df.dropna(subset=['Roll No.'])

df = df[df.count(axis=1) > 1]

# Convert roll_no to string and remove scientific notation
df['Roll No.'] = df['Roll No.'].apply(lambda x: str(int(x)) if pd.notnull(x) and isinstance(x, float) else str(x))

# Save the cleaned file
df.to_excel("seniors_data_cleaned.xlsx", index=False)
print("Cleaned file saved as seniors_data_cleaned.xlsx")



