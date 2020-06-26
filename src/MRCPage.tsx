import React, { useState, useMemo } from "react"
import 'rc-slider/assets/index.css'
import { CellControls } from "./CellControls"
import { History } from "history"
import { FillHeight } from "./FillHeight"
import { DisplayParams } from "./DisplayParams"
import { GeoJsonMap, GeoLayerSpec } from "./GeoJsonMap"
import _ from 'lodash'

/** Page that displays all data about a cell, including maps and indicators. */
export const MRCPage = (props: {
  history: History
  mrcId: string
}) => {
  const [params, setParams] = useState<DisplayParams>({
    year: 2050,
    adaptation: "sansadapt",
    erosion: "med",
    submersion2Y: "moy",
    submersion20Y: "moy",
    submersion100Y: "moy"
  })

  // Currently hovered cell
  const [hover, setHover] = useState<string>()

  const bounds = useMemo<[number,number][]>(() => [[47.5, -70.5], [49, -67]], [])

  const layers: GeoLayerSpec[] = useMemo(() => [
    {
      url: `data/trait_de_cote_${props.mrcId}.geojson`,
      styleFunction: (feature) => {
        return {
          fill: false,
          weight: 2,
          color: "#38F"
          //opacity: hover == feature!.properties.ID_field ? 0.8 : 0.5
        }
      }, 
      onEachFeature: (feature, layer: L.GeoJSON) => {
        const id = feature.properties!.ID_field

        layer.on("click", () => {
          props.history.push(`/outil/${id}`)
        })
        layer.on("mouseover", (e) => {
          setHover(id)
          e.target.setStyle({ color: "red" })
        })
        layer.on("mouseout", (e) => {
          setHover(undefined)
          e.target.setStyle({ color: "#38F" })
        })
      }
    } as GeoLayerSpec,
    {
      url: `data/sub_cellules_${props.mrcId}.geojson`,
      styleFunction: (feature) => {
        return {
          weight: 1,
          fillColor: "#38F",
          fillOpacity: 0.1,
          opacity: 0.1
        }
      }, 
      onEachFeature: (feature, layer: L.GeoJSON) => {
        const id = feature.properties!.ID_field

        layer.on("click", () => {
          props.history.push(`/outil/${id}`)
        })
        layer.on("mouseover", (e) => {
          setHover(id)
          e.target.setStyle({ fillColor: "red", fillOpacity: 0.3 })
        })
        layer.on("mouseout", (e) => {
          setHover(undefined)
          e.target.setStyle({ fillColor: "#38F", fillOpacity: 0.1 })
        })
      }
    } as GeoLayerSpec

  ], [])

  const handleBack = () => {
    props.history.push("/outil")
  }

  const renderMap = (height: number) => {
    return <GeoJsonMap 
      layers={layers} 
      bounds={bounds} 
      baseLayer={"positron"}
      height={height}/>
  }

  const renderContents = () => {
    return <FillHeight>
      {(height) => renderMap(height)}
    </FillHeight>
  }

  return <div>
    <div className="cell-sidebar">
      <div className="cell-sidebar-title">
        <a style={{cursor: "pointer", color: "#38F" }} onClick={handleBack}>
          <i className="fa fa-fw fa-arrow-left"/>
        </a> {"TODO"}
      </div>
      <CellControls 
        params={params}
        onChange={setParams}
        disabled={["adaptation"]}
        />
    </div>
    <div className="cell-contents">
      { renderContents() }
    </div>
  </div>
}
