import React, { useState } from "react"
import { CellMap } from "./CellMap"
import 'rc-slider/assets/index.css'
import { NetCostsChart } from "./indicator/netCosts"
import { cells } from "./config"
import { CellControls } from "./CellControls"
import { History } from "history"

/** Page that displays all data about a cell, including maps and indicators. */
export const CellPage = (props: {
  history: History
  cellId: string
}) => {
  const [year, setYear] = useState(2030)
  const [erosion, setErosion] = useState("med")
  const [submersion, setSubmersion] = useState(0)

  // Get cell
  const cell = cells.find(c => c.id == props.cellId)
  if (!cell) {
    return <div className="alert alert-danger">Cellule non trouvée</div>
  }

  const handleBack = () => {
    props.history.push("/panacees")
  }

  return <div>
    <div className="pb-2 mt-4 mb-2 border-bottom">
      <h4>
        <a className="text-muted" style={{cursor: "pointer"}} onClick={handleBack}>
          <i className="fa fa-fw fa-arrow-left"/>
        </a> {cell.name}
      </h4>
    </div>
    <CellControls 
      year={year}
      setYear={setYear}
      erosion={erosion}
      setErosion={setErosion}
      submersion={submersion}
      setSubmersion={setSubmersion} />

    <NetCostsChart
      adaptations={[
        { id: "sansadapt", name: "Sans Adaptation" },
        { id: "statuquo", name: "Statu Quo" }
      ]}
      cell={props.cellId}
      erosion={erosion}
      year={year + ""}
    />
    <CellMap
      adaptation="sansadapt"  
      cell={props.cellId}
      erosion={erosion}
      submersion={submersion}
      year={year}
      />
  </div>
}

