### Fifth Code Cell Explanation

```python
fig, ax = plt.subplots(figsize=(8, 8))

if category_col is None:
    print("No category column available; plotting points in a default color.")
    nodhavn.plot(ax=ax, color="steelblue", markersize=20)
else:
    # Convert to string so geopandas treats it as categorical/discrete values.
    nodhavn_to_plot = nodhavn.copy()
    nodhavn_to_plot[category_col] = nodhavn_to_plot[category_col].astype(str)

    nodhavn_to_plot.plot(
        ax=ax,
        column=category_col,
        categorical=True,
        legend=True,
        cmap="viridis",
        markersize=20,
        legend_kwds={"title": "Kategori"}
    )

ax.set_title("Nødhavn fordelt etter kategori (GeoJSON data)")
ax.set_axis_off()
plt.show()
```

#### Why the code runs

- This cell reuses `nodhavn`, which was loaded in earlier cells.
- It also reuses `category_col` created in the previous code cell (cell 4). If that variable was not set, it falls back to printing a message and plots everything in one color.
- For categorical coloring, it converts the category values to strings (e.g. `1`, `2`, `3` become `"1"`, `"2"`, `"3"`) so the legend and coloring become discrete.

#### What the result tells us

- The map visually shows whether `kategori` is distributed uniformly or concentrated in certain areas.
- The legend makes it easier to interpret categories in the spatial context (which points are K1/K2/K3-like depending on how the dataset encodes `kategori`).
