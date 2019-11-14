import { GeoLayerSpec, GeoJsonMap } from "./GeoJsonMap"
import React, { useState, useEffect } from "react"
import bbox from '@turf/bbox'

export const CellMap = (props: {
  /** ID of cell */
  cell: string

  /** Erosion level "vlow", etc */
  erosion: string

  /** Adaptation measure ("statuquo", "sansadap") */
  adaptation: string

  /** Submersion level "0", "1", ... */
  submersion: string

  /** Year e.g. 2040 */
  year: string

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

  const layers: GeoLayerSpec[] = [
    // {
    //   url: `submersion/submersion_sa_deMetissurMer_0a${props.submersion}m-4326.geojson`,
    //   styleFunction: (feature) => {
    //     return {
    //       stroke: false,
    //       fillColor: "#38F",
    //       fillOpacity: 0.5
    //     }
    //   }
    // },
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

  return <GeoJsonMap layers={layers} bounds={bounds}/>

}