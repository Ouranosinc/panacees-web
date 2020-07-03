import L, { StyleFunction } from 'leaflet'
import { useCallback, useRef, useEffect, useState } from 'react'
import React from 'react'
import 'leaflet/dist/leaflet.css'
import BingLayer from './BingLayer'
import { GeoJsonObject, Feature, Point } from 'geojson'

/** Specification for a layer to display */
export interface GeoLayerSpec {
  url?: string
  data?: GeoJsonObject
  styleFunction: StyleFunction
  pointToLayer?: (geoJsonPoint: Feature<Point, any>, latlng: L.LatLng) => L.Layer
  filter?: (feature: Feature) => boolean
  /** Optionally style each feature */
  onEachFeature?: (feature: Feature, layer: L.Layer) => void
}

/** Single layer of map */
interface GeoLayer {
  spec: GeoLayerSpec
  data?: GeoJsonObject

  /** True if has been cancelled and data should not be added */
  cancelled?: boolean

  /** Allow cancelling an existing load */
  abortController?: AbortController
}

export const GeoJsonMap = (props: { 
  layers: GeoLayerSpec[] 

  /** Initial bounds of map */
  bounds: L.LatLngBoundsExpression

  /** Height of the map */
  height: number

  baseLayer: "bing_satellite" | "positron"

  /** True to display loading */
  loading?: boolean
}) => {
  const [map, setMap] = useState<L.Map>()
  const mapRef = useRef<L.Map>()
  const baseLayerRef = useRef<L.TileLayer>()
  const [loading, setLoading] = useState(false)
  const geoLayersRef = useRef<GeoLayer[]>()
  const mapLayersRef = useRef<L.GeoJSON[]>([])

  const mapNode = useCallback(node => {
    if (!node) {
      if (mapRef.current) {
        mapRef.current.remove()
      }
      return
    }
    // This function creates the Leaflet map object and is called after the Map component mounts
    let mapObj = L.map(node, {
      // attributionControl: false, // TODO
      zoomSnap: 0.05,
      zoomControl: true,
      // scrollWheelZoom: false
    })
    
    mapRef.current = mapObj
    setMap(mapObj)
  }, [])

  useEffect(() => {
    if (!map) {
      return
    }

    if (baseLayerRef.current) {
      baseLayerRef.current.remove()
    }

    if (props.baseLayer === "positron") {
      baseLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
      })
    }
    else if (props.baseLayer === "bing_satellite") {
      baseLayerRef.current = new BingLayer("Al2zNGh4W-oD93D-Gfz3AQcOz8jNgnrn1mHALMpCzcVS0odDc_d0g68A7lLOSzq6", {type: "AerialWithLabels"})
    }
    else {
      throw new Error("Unknown layer type")
    }

    baseLayerRef.current.addTo(map)
    baseLayerRef.current.bringToBack()
  }, [map, props.baseLayer])

  // Keep bounds up to date
  useEffect(() => {
    if (map) {
      map.fitBounds(props.bounds)
    }
  }, [map, props.bounds])

  useEffect(() => {
    if (!map) {
      return
    }

    // Remove extra layers to keep needed layers and actual layers equal length
    for (var i = props.layers.length ; i < mapLayersRef.current.length ; i++) {
      mapLayersRef.current[i].remove()
    }

    /** Update the loading status */
    const onUpdate = () => {
      // Set loading state
      if (!geoLayersRef.current) {
        setLoading(true)
        return
      }
      setLoading(geoLayersRef.current.some(l => l.abortController))
    }

    /** Set the map layer, replacing the existing layer if present */
    const setMapLayer = (index: number, mapLayer: L.GeoJSON) => {
      // Remove old layer
      if (mapLayersRef.current[index]) {
        mapLayersRef.current[index].remove()
        delete mapLayersRef.current[index]
      }

      map.addLayer(mapLayer)
      mapLayersRef.current[index] = mapLayer

      // Re-order layers
      for (const mapLayer of mapLayersRef.current) {
        if (mapLayer) {
          mapLayer.bringToFront()
        }
      }
    }

    // Create new layers
    geoLayersRef.current = props.layers.map((layer, index) => loadLayer({
      spec: layer, 
      existingLayer: geoLayersRef.current ? geoLayersRef.current[index] : undefined, 
      onUpdate: onUpdate, 
      setMapLayer: setMapLayer.bind(null, index)
    }))

    onUpdate()
  }, [props.layers, map])

  // Update if height changes
  useEffect(() => {
    if (map) {
      map.invalidateSize()
    }
  }, [props.height])

  return (
    <div style={{position: "relative" }}>
      <div ref={mapNode} style={{height: props.height}} />
      { loading || props.loading ? 
        <div style={{ position: "absolute", left: 50, top: 12, backgroundColor: "white", zIndex: 10000, borderRadius: 4, padding: 5, fontSize: 30 }}>
          <i className="fa fa-spinner fa-spin fa-fw"/>
        </div>
      : null }
    </div>
  )
}

/** Load a single layer into the map, deleting the existing layer if present and if not identical */
const loadLayer = (options: {
  spec: GeoLayerSpec, 
  existingLayer: GeoLayer | undefined, 
  onUpdate: () => void,
  setMapLayer: (mapLayer: L.GeoJSON) => void
}): GeoLayer => {
  const { spec, existingLayer, onUpdate, setMapLayer } = options

  // Reuse if possible
  if (existingLayer 
    && existingLayer.spec.data === spec.data
    && existingLayer.spec.url === spec.url
    && existingLayer.spec.pointToLayer === spec.pointToLayer
    && existingLayer.spec.styleFunction === spec.styleFunction
    && existingLayer.spec.onEachFeature === spec.onEachFeature
    && existingLayer.spec.filter === spec.filter) {
      return existingLayer
  }

  if (existingLayer) {
    existingLayer.cancelled = true

    // Cancel existing request
    if (existingLayer.abortController) {
      existingLayer.abortController.abort()
      delete existingLayer.abortController
    }
  }

  const geoLayer: GeoLayer = { spec: spec }

  const replaceLayer = (data: GeoJsonObject | undefined) => {
    const mapLayer = L.geoJSON(data, { 
      pointToLayer: spec.pointToLayer,
      style: spec.styleFunction,
      filter: spec.filter,
      onEachFeature: spec.onEachFeature
    })

    geoLayer.data = data
    delete geoLayer.abortController

    setMapLayer(mapLayer)
  }

  // Handle case of same url and existing data (data can be reused)
  if (existingLayer && existingLayer.data && spec.url && existingLayer.spec.url === spec.url) {
    replaceLayer(existingLayer.data)
    return geoLayer
  }

  // Handle URL case
  if (spec.url) {
    // Add abort controller
    geoLayer.abortController = new AbortController()

    fetch(spec.url, { signal: geoLayer.abortController.signal }).then(r => r.json()).then((geojson: any) => {
      // If cancelled, ignore
      if (geoLayer.cancelled) {
        return
      }

      replaceLayer(geojson)

      // Trigger onUpdate to indicate that something has changed
      onUpdate()
    }).catch((err) => {
      // Ignore errors
      delete geoLayer.abortController 

      // Trigger onUpdate to indicate that something has changed
      onUpdate()
    })
  }
  else {
    replaceLayer(spec.data)
  }

  return geoLayer
}

// Hack fix for https://github.com/Leaflet/Leaflet/issues/3575#issuecomment-543138318
(function () {
  if (!L || !L.GridLayer || !L.GridLayer.prototype) return;

  var originalInitTile = (L.GridLayer.prototype as any)._initTile;

  L.GridLayer.include({
    _initTile: function (tile: any) {
      originalInitTile.call(this, tile);

      var tileSize = this.getTileSize();

      tile.style.width = tileSize.x + 1 + 'px';
      tile.style.height = tileSize.y + 1 + 'px';
    }
  });
})();
