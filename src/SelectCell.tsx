import { GeoJsonMap, GeoLayerSpec } from "./GeoJsonMap"
import React from "react"
import { History } from "history"
import { bounds, cells } from "./config"

/** Selects a particular cell */
export const SelectCell = (props: {
  history: History
}) => {


  const layers: GeoLayerSpec[] = cells.map(cell => ({
    url: `statiques/${cell.id}/cellule_${cell.id}.geojson`,
    styleFunction: (feature) => {
      return {
        weight: 1,
        fillColor: "#38F",
        fillOpacity: 0.5
      }
    },
    onEachFeature: (feature, layer) => {
      layer.on("click", () => {
        props.history.push(`/panacees/${cell.id}`)
      })
    }
  } as GeoLayerSpec))

  return <div>
    <h2>Sélectionner la cellule</h2>
    <GeoJsonMap 
      layers={layers} 
      bounds={bounds}
      baseLayer="positron"
      />
  </div>
}