import React, { useState, ReactNode } from "react"
import { CellMap } from "./CellMap"
import 'rc-slider/assets/index.css'
import { NetCostsByTypeChart } from "./indicator/netCostsByType"
import { cells } from "./config"
import { CellControls } from "./CellControls"
import { History } from "history"
import { FillHeight } from "./FillHeight"
import { NetCostsByYearChart } from "./indicator/netCostsByYear"
import { CellDisplayParams } from "./CellDisplayParams"

/** Page that displays all data about a cell, including maps and indicators. */
export const CellPage = (props: {
  history: History
  cellId: string
}) => {
  const [params, setParams] = useState<CellDisplayParams>({
    year: 2050,
    adaptation: "sansadapt",
    erosion: "med",
    submersionMode: "frequency",
    submersionEventLevel: 0,
    submersion2YLevel: 3,
    submersion20YLevel: 4,
    submersion100YLevel: 5
  })
  const [mode, setMode] = useState("map")

  const { year, adaptation, erosion, submersionEventLevel } = params

  // Get cell
  const cell = cells.find(c => c.id == props.cellId)
  if (!cell) {
    return <div className="alert alert-danger">Cellule non trouvée</div>
  }

  const handleBack = () => {
    props.history.push("/panacees")
  }

  const renderContents = () => {
    if (mode == "map") {
      return <FillHeight>
        {(height) => (
          <CellMap
            adaptation={adaptation}
            cell={props.cellId}
            erosion={erosion}
            submersion={submersionEventLevel}
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
      <NavSelector2 options={[
        { value: "map", label: [<i className="fa fa-map fa-fw faded-icon"/>," Carte"]},
        { value: "netCostsByType", label: [<i className="fa fa-bar-chart fa-fw faded-icon"/>," Coûts Nets Actualisés par Type"]},
        { value: "netCostsByYear", label: [<i className="fa fa-line-chart fa-fw faded-icon"/>," Coûts Nets Actualisés par Année"]} 
      ]} value={mode} onChange={setMode}/>
      <CellControls 
        params={params}
        onChange={setParams}
        submersion2YLevels={[2, 3, 4]}
        submersion20YLevels={[3, 4, 5]}
        submersion100YLevels={[4, 5, 6, 7]}
        disabled={disabled}
        />
    </div>
    <div className="cell-contents">
      { renderContents() }
    </div>
  </div>
}


const NavSelector = (props: { 
  options: { value: string, label: ReactNode }[],
  value: string,
  onChange: (value: string) => void
}) => {
  return <div className="nav flex-column nav-pills">
    { props.options.map(option => {
      return <a 
        className={option.value == props.value ? "nav-link active" : "nav-link"}
        onClick={() => props.onChange(option.value)}
        style={{ cursor: "pointer" }}>{option.label}</a>
    })}
  </div>      
}

const NavSelector2 = (props: { 
  options: { value: string, label: ReactNode }[],
  value: string,
  onChange: (value: string) => void
}) => {
  // Find active option
  const active = props.options.find(o => o.value == props.value)!

  return <div className="dropdown" style={{ marginTop: 5, marginBottom: 10 }}>
    <button className="btn btn-primary btn-block dropdown-toggle" type="button" data-toggle="dropdown" style={{ textAlign: "left" }}>
      { active.label }
    </button>
    <div className="dropdown-menu">
      { props.options.map(option => (
        <a className="dropdown-item" onClick={() => props.onChange(option.value)}>{option.label}</a>
      ))}
    </div>
  </div>
}
