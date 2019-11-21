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

  // Currently hovered cell
  const [hover, setHover] = useState<string>()

  const matchingCells = cells.filter(cell => {
    return !search || cell.name.toLowerCase().includes(search.toLowerCase())
  })

  const layers: GeoLayerSpec[] = matchingCells.map(cell => ({
    url: `statiques/${cell.id}/cellule_${cell.id}.geojson`,
    styleFunction: (feature) => {
      return {
        weight: 1,
        fillColor: "#38F",
        fillOpacity: hover == cell.id ? 0.8 : 0.5
      }
    },
    onEachFeature: (feature, layer: L.GeoJSON) => {
      layer.bindTooltip(cell.name)
      // Open tooltip if only one
      if (hover == cell.id) {
        setTimeout(() => layer.openTooltip(), 100)
      }
      layer.on("click", () => {
        props.history.push(`/panacees/${cell.id}`)
      })
      layer.on("mouseover", () => {
        setHover(cell.id)
      })
      layer.on("mouseout", () => {
        setHover(undefined)
      })
    }
  } as GeoLayerSpec))

  const renderCells = () => {
    return <FillHeight>
      {(height) => (
        <div className="list-group" style={{height: height, overflowY: "auto"}}>
          { matchingCells.map(cell => {
            return <a 
              style={{ cursor: "pointer" }}
              className="list-group-item list-group-item-action"
              onMouseEnter={() => { setHover(cell.id) }}
              onMouseLeave={() => { setHover(undefined) }}
              onClick={() => { props.history.push(`/panacees/${cell.id}`) }}>{cell.name}</a>
          })}
        </div>
      )}
    </FillHeight>
  }

  return <div className="container-fluid">
    <div className="row">
      <div className="col">
        <div style={{ textAlign: "left", color: "#666", fontSize: 18, padding: 5 }}>Sélectionner une cellule:</div>
        <SearchControl 
          value={search} 
          onChange={setSearch} 
          placeholder="Chercher..."
          ref={node => { if (node) { node.focus() }}}
          />
        { renderCells() }
      </div>
      <div className="col-8">
        <FillHeight>
          {(height) => (
            <div style={{ margin: 10, border: "solid 1px #DDD" }}>
              <GeoJsonMap 
                layers={layers} 
                bounds={bounds}
                baseLayer="positron"
                height={height - 20}
              />
            </div>
            )
          }
        </FillHeight>
      </div>
    </div>
  </div>
}

