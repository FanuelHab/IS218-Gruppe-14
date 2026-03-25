### Sixth Code Cell Explanation

```python
# Project to a metric CRS for area computations (approximate in meters)
nodhavn_metric = nodhavn.to_crs(epsg=3857)

# Convex hull of all points: a simple way to describe the spatial spread
hull = nodhavn_metric.geometry.unary_union.convex_hull
area_km2 = hull.area / 1e6

centroid_metric = hull.centroid
centroid_lonlat = gpd.GeoSeries([centroid_metric], crs=nodhavn_metric.crs).to_crs(nodhavn.crs).iloc[0]

print(f"Approx. convex hull area: {area_km2:.1f} km^2")
print(f"Approx. centroid (lon, lat): ({centroid_lonlat.x:.4f}, {centroid_lonlat.y:.4f})")

# Plot: points + convex hull outline + centroid
fig, ax = plt.subplots(figsize=(8, 8))

nodhavn_metric.plot(ax=ax, color="steelblue", markersize=10, alpha=0.6)

gpd.GeoSeries([hull], crs=nodhavn_metric.crs).boundary.plot(ax=ax, color="crimson", linewidth=2)
gpd.GeoSeries([centroid_metric], crs=nodhavn_metric.crs).plot(ax=ax, color="black", markersize=30)

ax.set_title("Geografisk utstrekning (convex hull) for nødhavnspunktene")
ax.set_axis_off()
plt.show()
```

#### Why the code runs

- `nodhavn` is in a geographic CRS (typically lon/lat). For distance/area you generally want a metric CRS.
- We transform the points to `EPSG:3857` so `hull.area` becomes an area in square meters (approximate).
- The convex hull (`convex_hull`) wraps all points with the smallest convex polygon that contains them all.
- We compute the hull area (converted to km²) and the centroid of that hull.
- Finally, we plot the points, the hull outline, and the centroid for visual validation.

#### What the result tells us

- The computed convex-hull area gives a quick, quantitative description of how spread out the points are geographically.
- The centroid gives a “center of spread” location, which can be useful for interpreting where coverage is densest or where the distribution is centered.
