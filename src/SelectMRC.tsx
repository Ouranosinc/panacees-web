import { GeoJsonMap, GeoLayerSpec } from "./GeoJsonMap"
import React, { useState, useEffect } from "react"
import { History } from "history"
import { SearchControl } from "./SearchControl"
import { FillHeight } from "./FillHeight"
import { GeoJsonObject, Feature, Point, FeatureCollection } from 'geojson'
import { bounds } from "./config"
import LoadingComponent from "./LoadingComponent"
import { useLoadJson } from "./utils"

/** Selects a particular mrc */
export const SelectMRC = (props: {
  history: History
}) => {
  // Search text
  const [search, setSearch] = useState("")

  // Currently hovered cell
  const [hover, setHover] = useState<string>()

  // Check if matches search string
  const matches = (str: string) => {
    return !search || str.toLowerCase().includes(search.toLowerCase())
  }

  // Load mrcs
  const [mrcs] = useLoadJson<FeatureCollection>("data/mrcs.geojson")

  if (!mrcs) {
    return <LoadingComponent/>
  }

  const layer: GeoLayerSpec = {
    data: mrcs as GeoJsonObject,
    styleFunction: (feature) => {
      return {
        weight: 1,
        fillColor: "#d9230f",
        fillOpacity: hover == feature!.properties.id ? 0.7 : 0.5
      }
    },
    onEachFeature: (feature, layer: L.GeoJSON) => {
      const id = feature.properties!.id
      const name = feature.properties!.name

      layer.bindTooltip(name)
      // Open tooltip if only one
      if (hover == id) {
        setTimeout(() => layer.openTooltip(), 100)
      }
      layer.on("click", () => {
        props.history.push(`/outil/${id}`)
      })
      layer.on("mouseover", () => {
        setHover(id)
      })
      layer.on("mouseout", () => {
        setHover(undefined)
      })
    }
  } as GeoLayerSpec

  const renderList = () => {
    // MRC is visible if it or any cell matches
    const visibleMRCs = mrcs.features.filter(mrc => {
      return matches(mrc.properties!.name)
    })

    return <div className="list-mrcs">
      { visibleMRCs.map(mrc => {
        const id = mrc.properties!.id
        const name = mrc.properties!.name

        return <div 
          key={id} 
          className="list-mrc"
          onMouseEnter={() => { setHover(id) }}
          onMouseLeave={() => { setHover(undefined) }}
          onClick={() => { props.history.push(`/outil/${id}`) }}>{name}</div>
      })}
    </div>
  }

  return <div className="container-fluid">
    <div className="row">
      <div className="col">
        <div className="card" style={{ marginTop: 20, marginBottom: 20 }}>
          <div className="card-body">
            PANACÉES est un outil d’aide à la décision réalisé par Ouranos conjointement avec les municipalités
            de la MRC de Rivière-du-Loup et de La Mitis. PANACÉES permet aux décideurs de réaliser une analyse 
            économique sur l’adaptation aux changements climatiques en milieu côtier en comparant différentes options
            d’adaptation à la non intervention en tenant compte de l’ensemble des coûts et avantages sociaux, économiques 
            et environnementaux. Pour débuter l’analyse, sélectionner une MRC. 
            Pour plus de détails sur son utilisation, consultez le <a href="#/guide" target="_blank">guide de l’usager</a>.
          </div>
        </div>
        <div style={{ textAlign: "left", color: "#666", fontSize: 18, padding: 5 }}>Sélectionner une MRC</div>
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
                layers={[layer]} 
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

