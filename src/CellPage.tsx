import React, { useState, ReactNode } from "react"
import { CellMap } from "./CellMap"
import 'rc-slider/assets/index.css'
import { NetCostsByTypeChart } from "./indicator/netCostsByType"
import { cells } from "./config"
import { CellControls } from "./CellControls"
import { History } from "history"
import { FillHeight } from "./FillHeight"
import { NetCostsByYearChart } from "./indicator/netCostsByYear"
import { DisplayParams } from "./DisplayParams"
import { NavSelector } from "./navSelector"

/** Page that displays all data about a cell, including maps and indicators. */
export const CellPage = (props: {
  history: History
  cellId: string
}) => {
  const [params, setParams] = useState<DisplayParams>({
    year: 2050,
    adaptation: "sansadapt",
    erosion: "med",
    submersion2Y: "moy",
    submersion20Y: "moy",
    submersion100Y: "moy"
  })
  const [mode, setMode] = useState("map")

  const { year, adaptation, erosion } = params

  const submersionLevel = 3 // TODO

  // Get cell
  const cell = cells.find(c => c.id == props.cellId)
  if (!cell) {
    return <div className="alert alert-danger">Cellule non trouvée</div>
  }

  const handleBack = () => {
    props.history.push("/outil")
  }

  const renderContents = () => {
    if (mode == "map") {
      return <FillHeight>
        {(height) => (
          <CellMap
            adaptation={adaptation}
            cell={props.cellId}
            erosion={erosion}
            submersion={submersionLevel}
            year={year}
            height={height}
            />
        )}
      </FillHeight>
    }
    if (mode == "netCostsByType") {
      return <div>
        <NetCostsByTypeChart
          adaptations={[
            { id: "sansadapt", name: "Sans Adaptation" },
            { id: "statuquo", name: "Statu Quo" }
          ]}
          cell={props.cellId}
          erosion={erosion}
          year={year + ""}
        />
      </div>
    }
    if (mode == "netCostsByYear") {
      return <div>
        <NetCostsByYearChart
          adaptations={[
            { id: "sansadapt", name: "Sans Adaptation" },
            { id: "statuquo", name: "Statu Quo" }
          ]}
          cell={props.cellId}
          erosion={erosion}
        />
      </div>
    }
    return null
  }

  // Which controls are disabled
  let disabled: ("year" | "submersion" | "erosion" | "adaptation")[] = []
  switch (mode) {
    case "map":
      disabled = []
      break
    case "netCostsByType":
      disabled = ["adaptation", "submersion"]
      break
    case "netCostsByYear":
      disabled = ["year", "submersion", "adaptation"]
      break
  }

  return <div>
    <div className="cell-sidebar">
      <div className="cell-sidebar-title">
        <a style={{cursor: "pointer", color: "#38F" }} onClick={handleBack}>
          <i className="fa fa-fw fa-arrow-left"/>
        </a> {cell.name}
      </div>
      <NavSelector options={[
        { value: "map", label: [<i className="fa fa-map fa-fw faded-icon"/>," Carte"]},
        { value: "netCostsByType", label: [<i className="fa fa-bar-chart fa-fw faded-icon"/>," Coûts Nets Actualisés par Type"]},
        { value: "netCostsByYear", label: [<i className="fa fa-line-chart fa-fw faded-icon"/>," Coûts Nets Actualisés par Année"]} 
      ]} value={mode} onChange={setMode}/>
      <CellControls 
        params={params}
        onChange={setParams}
        disabled={disabled}
        />
    </div>
    <div className="cell-contents">
      { renderContents() }
    </div>
  </div>
}


