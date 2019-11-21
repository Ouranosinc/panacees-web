import { GeoLayerSpec, GeoJsonMap } from "./GeoJsonMap"
import React, { useState, useEffect, useCallback } from "react"
import bbox from '@turf/bbox'
import L from "leaflet"
import { Feature } from "geojson"

export const CellMap = (props: {
  /** ID of cell */
  cell: string

  /** Erosion level "vlow", etc */
  erosion: string

  /** Adaptation measure ("statuquo", "sansadap") */
  adaptation: string

  /** Submersion level 0, 1, ... */
  submersion: number

  /** Year e.g. 2040 */
  year: number

  /** Height of the map */
  height: number
}) => {
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression>()

  // Load initial bounds
  useEffect(() => {
    fetch(`/statiques/${props.cell}/cellule_${props.cell}.geojson`).then(r => r.json()).then((geojson: any) => {
      // bbox gives minx, miny, maxx, maxy
      const [minx, miny, maxx, maxy] = bbox(geojson)
      setBounds([[miny, minx], [maxy, maxx]])
    })
    // TODO errors?
  }, [props.cell])  

  const buildingFilter = useCallback((feature: Feature) => {
    // Look up key
    const key = props.erosion.replace("ery", "") + "_" + props.adaptation
    const value = feature.properties![key]
    return (value != "NA" && parseInt(value) <= props.year)
  }, [props.cell, props.adaptation, props.year, props.erosion])

  const layers: GeoLayerSpec[] = [
    {
      url: `statiques/${props.cell}/cellule_${props.cell}.geojson`,
      styleFunction: (feature) => {
        return {
          fill: false,
          weight: 1,
          color: "#38F",
          opacity: 0.8
        }
      }
    },
    {
      url: props.submersion > 0 ? `submersion/${props.cell}/submersion_${props.adaptation}_${props.cell}_0a${props.submersion}m.geojson` : undefined,
      styleFunction: (feature) => {
        return {
          stroke: false,
          fillColor: "#38F",
          fillOpacity: 0.5
        }
      }
    },
    {
      url: `erosion/${props.cell}/${props.erosion}_erosion_${props.adaptation}_${props.cell}_${props.year}.geojson`,
      styleFunction: (feature) => {
        return {
          stroke: false,
          fillColor: "red",
          fillOpacity: 0.5
        }
      }
    },
    {
      url: `statiques/${props.cell}/batiments_${props.cell}.geojson`,
      styleFunction: () => ({}),
      pointToLayer: (p: any) => { 
        const coords = [p.geometry.coordinates[1], p.geometry.coordinates[0]]
        return L.marker(coords as any, {
          icon: L.icon({ iconUrl: "house_red.png", iconAnchor: [14, 41] })
        })
        // return L.circleMarker(coords as any, { radius: 1, color: "yellow", opacity: 0.7 })
      },
      filter: buildingFilter
    },
  ]

  // if (batiments) {
  //   layers.push({ 
  //     url: "static/batiments_deMetissurMer-4326.geojson", 
  //     styleFunction: () => ({}),
  //     pointToLayer: (p: any) => { 
  //       const coords = [p.geometry.coordinates[0][1], p.geometry.coordinates[0][0]]
  //       return L.circleMarker(coords as any, { radius: 1, color: "yellow", opacity: 0.7 })
  //     }
  //   })
  // }

  if (!bounds) {
    return <div>
      <i className="fa fa-spinner fa-spin"/>
    </div>
  }

  return <GeoJsonMap 
    layers={layers} 
    bounds={bounds} 
    baseLayer="bing_satellite" 
    height={props.height}/>

}