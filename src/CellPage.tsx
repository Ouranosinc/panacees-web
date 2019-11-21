import React, { useState, ReactNode } from "react"
import { CellMap } from "./CellMap"
import 'rc-slider/assets/index.css'
import { NetCostsChart } from "./indicator/netCosts"
import { cells } from "./config"
import { CellControls } from "./CellControls"
import { History } from "history"
import { FillHeight } from "./FillHeight"

/** Page that displays all data about a cell, including maps and indicators. */
export const CellPage = (props: {
  history: History
  cellId: string
}) => {
  const [year, setYear] = useState(2030)
  const [erosion, setErosion] = useState("med")
  const [submersion, setSubmersion] = useState(0)
  const [adaptation, setAdaptation] = useState("sansadapt")

  const [mode, setMode] = useState("map")

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
            submersion={submersion}
            year={year}
            height={height}
            />
        )}
      </FillHeight>
    }
    if (mode == "netcosts") {
      return <NetCostsChart
        adaptations={[
          { id: "sansadapt", name: "Sans Adaptation" },
          { id: "statuquo", name: "Statu Quo" }
        ]}
        cell={props.cellId}
        erosion={erosion}
        year={year + ""}
      />
    }
    return null
  }

  // Which controls are disabled
  let disabled: ("year" | "submersion" | "erosion" | "adaptation")[] = []
  switch (mode) {
    case "map":
      disabled = []
      break
    case "netcosts":
      disabled = ["adaptation", "submersion"]
      break
  }

  return <div>
    <div className="cell-sidebar">
      <div className="cell-sidebar-title">
        <a style={{cursor: "pointer", color: "#38F" }} onClick={handleBack}>
          <i className="fa fa-fw fa-arrow-left"/>
        </a> {cell.name}
      </div>
      <CellControls 
        year={year}
        setYear={setYear}
        erosion={erosion}
        setErosion={setErosion}
        submersion={submersion}
        setSubmersion={setSubmersion} 
        adaptation={adaptation}
        setAdaptation={setAdaptation}
        disabled={disabled}
        />
      <hr/>
      <NavSelector options={[
        { id: "map", name: [<i className="fa fa-map fa-fw"/>," Carte"]},
        { id: "netcosts", name: [<i className="fa fa-bar-chart fa-fw"/>," Coûts Nets Actualisés"]} 
      ]} value={mode} onChange={setMode}/>
    </div>
    <div className="cell-contents">
      { renderContents() }
    </div>
  </div>
}


const NavSelector = (props: { 
  options: { id: string, name: ReactNode }[],
  value: string,
  onChange: (value: string) => void
}) => {
  return <div className="nav flex-column nav-pills">
    { props.options.map(option => {
      return <a 
        className={option.id == props.value ? "nav-link active" : "nav-link"}
        onClick={() => props.onChange(option.id)}
        style={{ cursor: "pointer" }}>{option.name}</a>
    })}
  </div>      
}

/* <div className="cell-contents">
<div className="cell-section">Carte</div>
<FillHeight>
  {(height) => (
    <CellMap
      adaptation="sansadapt"  
      cell={props.cellId}
      erosion={erosion}
      submersion={submersion}
      year={year}
      height={height - 100}
      />
  )}
</FillHeight>
<div className="cell-section">Coûts Nets Actualisés</div>
<NetCostsChart
  adaptations={[
    { id: "sansadapt", name: "Sans Adaptation" },
    { id: "statuquo", name: "Statu Quo" }
  ]}
  cell={props.cellId}
  erosion={erosion}
  year={year + ""}
/>
</div> */
