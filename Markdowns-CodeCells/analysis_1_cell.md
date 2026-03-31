### First Code Cell Explanation

```python
import geopandas as gpd
import matplotlib.pyplot as plt

data_path = "data/nodhavn.geojson"
nodhavn = gpd.read_file(data_path)
print(nodhavn.head())
```

#### Why the code runs

- Both `geopandas` and `matplotlib` have been installed into the project's virtual environment (`.venv`). Importing them succeeds without any `ModuleNotFoundError`.
- `data_path` points to a valid GeoJSON file (`data/nodhavn.geojson`) in the workspace, so `gpd.read_file` is able to open and parse it.

#### What the result tells us

- The `print(nodhavn.head())` call outputs the first few rows of the GeoDataFrame loaded from the file. This confirms the data was successfully read and is structured as a GeoDataFrame, typically with columns like `geometry` and any attributes present in the GeoJSON.
- Seeing the head of the dataset allows you to inspect the column names, data types, and a sample of the features, which is useful before proceeding with further spatial analysis or plotting.