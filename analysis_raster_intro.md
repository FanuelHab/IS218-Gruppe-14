### Rasteranalyse: DEM, helning, polygonize og hillshade

Denne delen dokumenterer rasterarbeidsflyten med GDAL-kommandoer (CLI), slik oppgaven tillater.
Vi bruker et valgfritt studieomrade (eksempel: rundt Oslo) og viser hele kjeden fra hoydedata
til avledede produkter:

1. Last ned DEM (Digital Elevation Model) fra ekstern kilde.
2. Generer helningskart (slope i grader).
3. Filtrer ut bratte omrader (helning > 30 grader).
4. Konverter filtrert raster til vektorpolygoner (polygonize).
5. Lag to hillshade-raster med ulike lysparametere for sammenligning.

Resultatet er sporbare filer som kan brukes videre i analyse eller visualisering:
- `dem_oslo.tif`
- `slope_deg.tif`
- `slope_gt30.tif`
- `slope_gt30_only.geojson`
- `hillshade_az315_alt45.tif`
- `hillshade_az135_alt30.tif`
