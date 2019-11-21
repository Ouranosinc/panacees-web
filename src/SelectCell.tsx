import { GeoJsonMap, GeoLayerSpec } from "./GeoJsonMap"
import React, { useState } from "react"
import { History } from "history"
import { bounds, cells } from "./config"
import { SearchControl } from "./SearchControl"
import { FillHeight } from "./FillHeight"

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
      // Open tooltip if only one
      if (matchingCells.length == 1) {
        setTimeout(() => layer.openTooltip(), 0)
      }
      console.log(feature.properties!.Cellule)
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
    <h4>Sélectionner la cellule</h4>
    <SearchControl value={search} onChange={setSearch} ref={node => { if (node) { node.focus() }}}/>
    <FillHeight>
      {(height) => (
        <GeoJsonMap 
          layers={layers} 
          bounds={bounds}
          baseLayer="positron"
          height={height}
        />)
      }
    </FillHeight>
  </div>
}

