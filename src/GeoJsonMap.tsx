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
}

/** Single layer of map */
interface GeoLayer {
  spec: GeoLayerSpec
  data?: GeoJsonObject
  layer: L.GeoJSON

  /** Allow cancelling an existing load */
  abortController?: AbortController
}

export const GeoJsonMap = (props: { 
  layers: GeoLayerSpec[] 
  /** Initial bounds of map */
  bounds: L.LatLngBoundsExpression
}) => {
  const [map, setMap] = useState<L.Map>()
  const mapRef = useRef<L.Map>()
  const [loading, setLoading] = useState(false)
  const layersRef = useRef<GeoLayer[]>()

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
    
    // L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
    //   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
    // }).addTo(map)

    const baseLayer = new BingLayer("Al2zNGh4W-oD93D-Gfz3AQcOz8jNgnrn1mHALMpCzcVS0odDc_d0g68A7lLOSzq6", {type: "AerialWithLabels"})
    baseLayer.addTo(mapObj)
    mapRef.current = mapObj
    setMap(mapObj)
  }, [])

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
    if (layersRef.current) {
      for (var i = props.layers.length ; i < layersRef.current.length ; i++) {
        layersRef.current[i].layer.remove()
      }
    }

    const onUpdate = () => {
      // Set loading state
      if (!layersRef.current) {
        setLoading(true)
        return
      }
      setLoading(layersRef.current.some(l => l.abortController))

      // Re-order layers
      for (const layer of layersRef.current) {
        layer.layer.bringToFront()
      }
    }

    // Create new layers
    const layers = props.layers.map((layer, index) => loadLayer(map, layer, layersRef.current ? layersRef.current[index] : undefined, onUpdate))
    layersRef.current = layers
    onUpdate()
  }, [props.layers, map])

  return (
    <div style={{position: "relative" }}>
      <div ref={mapNode} style={{height: 800}} />
      { loading ? 
        <div style={{ position: "absolute", right: 10, top: 10, backgroundColor: "white", zIndex: 10000, opacity: 0.8, borderRadius: 4, padding: 5 }}>
          <i className="fa fa-spinner fa-spin fa-fw"/>
        </div>
      : null }
    </div>
  )
}

/** Load a single layer into the map, deleting the existing layer if present and if not identical */
const loadLayer = (map: L.Map, spec: GeoLayerSpec, existingLayer: GeoLayer | undefined, onUpdate: () => void): GeoLayer => {
  // Reuse if possible
  if (existingLayer 
    && existingLayer.spec.data === spec.data
    && existingLayer.spec.url === spec.url
    && existingLayer.spec.pointToLayer === spec.pointToLayer
    && existingLayer.spec.styleFunction === spec.styleFunction
    && existingLayer.spec.filter === spec.filter) {
      return existingLayer
  }

  if (existingLayer) {
    // Cancel existing request
    if (existingLayer.abortController) {
      existingLayer.abortController.abort()
      delete existingLayer.abortController
    }
  }

  const geoLayer: GeoLayer = { spec: spec, layer: L.geoJSON(undefined, { 
    pointToLayer: spec.pointToLayer,
    style: spec.styleFunction
  })}

  const replaceLayer = (data: GeoJsonObject) => {
    geoLayer.layer.addData(data)
    geoLayer.data = data
    delete geoLayer.abortController

    if (existingLayer) { 
      existingLayer.layer.remove()
    }
    map.addLayer(geoLayer.layer)
  }

  // Handle case of same url and existing data (data can be reused)
  if (existingLayer && existingLayer.data && spec.url && existingLayer.spec.url === spec.url) {
    replaceLayer(existingLayer.data)
  }

  // Handle URL case
  if (spec.url) {
    // Add abort controller
    geoLayer.abortController = new AbortController()

    fetch(spec.url, { signal: geoLayer.abortController.signal }).then(r => r.json()).then((geojson: any) => {
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
  else if (spec.data) {
    replaceLayer(spec.data)
  }

  return geoLayer
}

