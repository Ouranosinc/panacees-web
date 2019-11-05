import L, { StyleFunction } from 'leaflet'
import { useCallback, useRef, useEffect, useState } from 'react'
import React from 'react'
import 'leaflet/dist/leaflet.css'
import BingLayer from './BingLayer'
import { GeoJsonObject } from 'geojson'

/** Specification for a layer to display */
export interface GeoLayerSpec {
  url: string
  styleFunction: StyleFunction
}

/** Single layer of map */
interface GeoLayer {
  url: string
  data?: GeoJsonObject
  layer: L.GeoJSON

  /** Allow cancelling an existing load */
  abortController?: AbortController
}

const loadLayer = (map: L.Map, spec: GeoLayerSpec, existingLayer: GeoLayer | undefined, onUpdate: () => void): GeoLayer => {
  // Reuse if possible
  if (existingLayer && existingLayer.url == spec.url) {
    return existingLayer
  }

  let geoLayer: GeoLayer
  if (existingLayer) {
    // Cancel existing request
    if (existingLayer.abortController) {
      existingLayer.abortController.abort()
      delete existingLayer.abortController
    }

    geoLayer = { url: spec.url, layer: existingLayer.layer }
  }
  else {
    geoLayer = { url: spec.url, layer: L.geoJSON(undefined, { 
      pointToLayer: (p: any) => { 
        const coords = [p.geometry.coordinates[0][1], p.geometry.coordinates[0][0]]
        return L.circleMarker(coords as any, { radius: 2, color: "yellow", opacity: 0.7 })
      }
    }) }
    map.addLayer(geoLayer.layer)
  }

  // Add abort controller
  geoLayer.abortController = new AbortController()

  fetch(spec.url, { signal: geoLayer.abortController.signal }).then(r => r.json()).then((geojson: any) => {
    geoLayer.layer.clearLayers()
    geoLayer.layer.addData(geojson)
    geoLayer.layer.setStyle(spec.styleFunction)
    geoLayer.data = geojson
    delete geoLayer.abortController

    // Trigger onUpdate to indicate that something has changed
    onUpdate()
  }).catch((err) => {
    // Ignore errors
    delete geoLayer.abortController 

    // Trigger onUpdate to indicate that something has changed
    onUpdate()
  })
  return geoLayer
}

export const GeoJsonMap = (props: { layers: GeoLayerSpec[] }) => {
  const [map, setMap] = useState<L.Map>()
  const [loading, setLoading] = useState(false)
  const layersRef = useRef<GeoLayer[]>()

  const mapNode = useCallback(node => {
    if (!node) {
      if (map) {
        map.remove()
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

    const baseLayer = new BingLayer("Ao26dWY2IC8PjorsJKFaoR85EPXCnCohrJdisCWXIULAXFo0JAXquGauppTMQbyU", {type: "AerialWithLabels"})
    baseLayer.addTo(mapObj)

    mapObj.setView([48.6754118321, -68.0089967189], 13)
    setMap(mapObj)
  }, [])

  useEffect(() => {
    if (!map) {
      return
    }

    // Remove extra layers
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

