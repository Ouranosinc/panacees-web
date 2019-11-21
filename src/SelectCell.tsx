import { GeoJsonMap, GeoLayerSpec } from "./GeoJsonMap"
import React, { useState } from "react"
import { History } from "history"
import { bounds, cells } from "./config"
import { SearchControl } from "./SearchControl"

/** Selects a particular cell */
export const SelectCell = (props: {
  history: History
}) => {
  const [search, setSearch] = useState("")

  const matchingCells = cells.filter(cell => {
    return !search || cell.name.toLowerCase().includes(search.toLowerCase())
  })

  const layers: GeoLayerSpec[] = matchingCells.map(cell => ({
    url: `statiques/${cell.id}/cellule_${cell.id}.geojson`,
    styleFunction: (feature) => {
      return {
        weight: 1,
        fillColor: "#38F",
        fillOpacity: 0.5
      }
    },
    onEachFeature: (feature, layer: L.GeoJSON) => {
      layer.bindTooltip(cell.name)
      // Open if only one
      if (matchingCells.length == 1) {
        setTimeout(() => layer.openTooltip(), 0)
      }
      layer.on("click", () => {
        props.history.push(`/panacees/${cell.id}`)
      })
      layer.on("mouseover", () => {
        layer.openTooltip()
        layer.setStyle({
          fillOpacity: 0.8
        })
      })
      layer.on("mouseout", () => {
        layer.closeTooltip()
        layer.setStyle({
          fillOpacity: 0.5
        })
      })
    }
  } as GeoLayerSpec))

  return <div>
    <h2>Sélectionner la cellule</h2>
    <SearchControl value={search} onChange={setSearch} ref={node => { if (node) { node.focus() }}}/>
    <GeoJsonMap 
      layers={layers} 
      bounds={bounds}
      baseLayer="positron"
      />
  </div>
}

