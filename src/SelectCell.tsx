import { GeoJsonMap, GeoLayerSpec } from "./GeoJsonMap"
import React, { useState } from "react"
import { History } from "history"
import { bounds, cells, municipalities } from "./config"
import { SearchControl } from "./SearchControl"
import { FillHeight } from "./FillHeight"

/** Selects a particular cell */
export const SelectCell = (props: {
  history: History
}) => {
  const [search, setSearch] = useState("")

  // Currently hovered cell
  const [hover, setHover] = useState<string>()

  // Check if matches search string
  const matches = (str: string) => {
    return !search || str.toLowerCase().includes(search.toLowerCase())
  }

  const layers: GeoLayerSpec[] = cells.map(cell => ({
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

  const renderList = () => {
    // Municipality is visible if it or any cell matches
    const visibleMunicipalities = municipalities.filter(municipality => {
      return matches(municipality.name) || municipality.cells.some(cellId => {
        const cell = cells.find(c => c.id == cellId)!
        return matches(cell.name)
      })
    })

    return <div className="list-municipalities">
      { visibleMunicipalities.map(municipality => {
        return <div key={municipality.name} className="list-municipality">
          <div className="list-municipality-header">{municipality.name}</div>
          <div className="list-cells">
            { municipality.cells.map(cellId => {
              const cell = cells.find(c => c.id == cellId)!

              // Only display if cell or municipality matches
              if (!matches(municipality.name) && !matches(cell.name)) {
                return null
              }

              return <div key={cell.id}
                className="list-cell"
                onMouseEnter={() => { setHover(cell.id) }}
                onMouseLeave={() => { setHover(undefined) }}
                onClick={() => { props.history.push(`/panacees/${cell.id}`) }}>{cell.name}</div>
            })}
          </div>
        </div>
      })}
    </div>
  }

  return <div className="container-fluid">
    <div className="row">
      <div className="col">
        <div style={{ textAlign: "left", color: "#666", fontSize: 18, padding: 5 }}>Sélectionner une cellule</div>
        <SearchControl 
          value={search} 
          onChange={setSearch} 
          placeholder="Chercher..."
          ref={node => { if (node) { node.focus() }}}
          />
        <FillHeight>
          {(height) => (
            <div style={{height: height, overflowY: "auto"}}>
              {renderList()}
            </div>
          )}
        </FillHeight>
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

