"""
FastAPI microservice wrapping searoute for maritime routes (not for real navigation).
"""

from __future__ import annotations

import math
from typing import Any

import searoute as sr
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Searoute service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance (km). Sea routes are at least this long."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(min(1.0, math.sqrt(a)))


def linestring_geometry_to_dict(geom: Any) -> dict[str, Any]:
    coords = geom["coordinates"]
    return {
        "type": "LineString",
        "coordinates": [[float(x), float(y)] for x, y in coords],
    }


def linestring_with_exact_endpoints(
    origin_lon: float,
    origin_lat: float,
    dest_lon: float,
    dest_lat: float,
    route_geometry: Any,
) -> dict[str, Any]:
    """
    Searoute snaps endpoints to its maritime graph; for display we keep the middle of the path
    but force the first/last vertex to the real click and port coordinates (land/harbor points).
    """
    coords = route_geometry["coordinates"]
    if not coords or len(coords) < 2:
        return {
            "type": "LineString",
            "coordinates": [[float(origin_lon), float(origin_lat)], [float(dest_lon), float(dest_lat)]],
        }
    mid = coords[1:-1] if len(coords) > 2 else []
    new_coords = (
        [[float(origin_lon), float(origin_lat)]]
        + [[float(x), float(y)] for x, y in mid]
        + [[float(dest_lon), float(dest_lat)]]
    )
    return {"type": "LineString", "coordinates": new_coords}


def searoute_safe(origin_lon: float, origin_lat: float, dest_lon: float, dest_lat: float):
    try:
        return sr.searoute(
            [origin_lon, origin_lat],
            [dest_lon, dest_lat],
            units="km",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


class Origin(BaseModel):
    lat: float
    lng: float


class RouteRequest(BaseModel):
    from_lat: float = Field(..., description="Origin latitude")
    from_lng: float = Field(..., description="Origin longitude")
    to_lat: float = Field(..., description="Destination latitude")
    to_lng: float = Field(..., description="Destination longitude")


class PortIn(BaseModel):
    lat: float
    lng: float
    index: int | None = None
    properties: dict[str, Any] | None = None


class ClosestPortRequest(BaseModel):
    origin: Origin
    ports: list[PortIn] = Field(..., min_length=1)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/route")
def route_endpoint(body: RouteRequest):
    """
    Shortest sea route between two points. Returns distance (km) and GeoJSON LineString.
    """
    feat = searoute_safe(body.from_lng, body.from_lat, body.to_lng, body.to_lat)
    length = float(feat.properties["length"])
    geom = linestring_with_exact_endpoints(
        body.from_lng,
        body.from_lat,
        body.to_lng,
        body.to_lat,
        feat.geometry,
    )
    return {
        "distance_km": length,
        "units": feat.properties.get("units", "km"),
        "geometry": geom,
    }


@app.post("/closest-port")
def closest_port_endpoint(body: ClosestPortRequest):
    """
    Nearest port by navigable sea distance. Uses haversine ordering with pruning:
    sea distance is always >= great-circle distance, so ports sorted by haversine
    can be skipped once haversine >= current best sea distance.
    """
    o_lat, o_lng = body.origin.lat, body.origin.lng

    indexed: list[tuple[float, int, PortIn]] = []
    for i, p in enumerate(body.ports):
        h = haversine_km(o_lat, o_lng, p.lat, p.lng)
        idx = p.index if p.index is not None else i
        indexed.append((h, idx, p))

    indexed.sort(key=lambda x: x[0])

    best_sea = math.inf
    best_idx: int | None = None
    best_props: dict[str, Any] | None = None
    best_route = None
    best_port: PortIn | None = None

    for h, idx, p in indexed:
        if h >= best_sea:
            break
        feat = searoute_safe(o_lng, o_lat, p.lng, p.lat)
        dist = float(feat.properties["length"])
        if dist < best_sea:
            best_sea = dist
            best_idx = idx
            best_props = p.properties
            best_route = feat
            best_port = p

    if best_route is None or best_idx is None or best_port is None:
        raise HTTPException(status_code=500, detail="Could not compute a sea route to any port.")

    display_geom = linestring_with_exact_endpoints(
        o_lng,
        o_lat,
        best_port.lng,
        best_port.lat,
        best_route.geometry,
    )

    return {
        "distance_km": best_sea,
        "port_index": best_idx,
        "port_properties": best_props or {},
        "port_lng": float(best_port.lng),
        "port_lat": float(best_port.lat),
        "geometry": display_geom,
    }
