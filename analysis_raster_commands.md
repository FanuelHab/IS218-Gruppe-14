### Hvorfor kommandoene kjores og hva resultatet forteller

Kommandoene under dokumenterer en komplett rasterpipeline i GDAL:

- `gdal_translate` henter DEM-data lokalt, og brukes deretter til a klippe ut studieomradet.
- `gdaldem slope` beregner terrenghelning i grader fra DEM.
- `gdal_calc.py` lager en binar maske (1/0) der vi beholder celler med helning over terskelen.
- `gdal_polygonize.py` gjor den binare masken om til polygoner.
- `ogr2ogr -where "class = 1"` beholder kun de polygonene som faktisk oppfyller kravet.
- `gdal_hillshade` (eller `gdaldem hillshade`) lager skyggerelieff med to ulike lysretninger/hoyder.

Ved a sammenligne de to hillshade-filene ser vi hvordan `azimuth` (solretning) og `altitude`
(solhoyde) endrer terrengopplevelsen visuelt.
