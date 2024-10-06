import pandas as pd

# Load the provided CSV file
file_path = 'data.csv'
data = pd.read_csv(file_path)

# Clean the data
data = data.dropna(subset=['From', 'To', 'Walking time'])
data['Walking time'] = data['Walking time'].astype(float)

# Aggregate the data
aggregated_data = data.groupby(['From', 'To']).agg({'Walking time': 'sum'}).reset_index()

# Save the cleaned and aggregated data to a new CSV file
cleaned_file_path = '/mnt/data/cleaned_aggregated_data.csv'
aggregated_data.to_csv(cleaned_file_path, index=False)

import ace_tools as tools; tools.display_dataframe_to_user(name="Cleaned and Aggregated Data", dataframe=aggregated_data)
cleaned_file_path
