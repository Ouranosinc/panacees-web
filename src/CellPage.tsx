import _ from 'lodash'
import React, { useState, ReactNode, useMemo } from "react"
import { CellMap } from "./CellMap"
import 'rc-slider/assets/index.css'
import { NetCostsByTypeChart } from "./indicator/netCostsByType"
import { CellControls } from "./CellControls"
import { History } from "history"
import { FillHeight } from "./FillHeight"
import { NetCostsByYearChart } from "./indicator/netCostsByYear"
import { DisplayParams } from "./DisplayParams"
import { NavSelector } from "./navSelector"
import { useLoadCsv } from "./utils"
import { Adaptation } from './params'

/** Page that displays all data about a cell, including maps and indicators. */
export const CellPage = (props: {
  history: History

  /** Id of MRC e.g. MITIS */
  mrcId: string

  /** Id of cell e.g. MITIS_123 */
  cellId: string
}) => {
  const [params, setParams] = useState<DisplayParams>({
    year: 2050,
    adaptation: "statuquo",
    erosion: "med",
    submersion2Y: "moy",
    submersion20Y: "moy",
    submersion100Y: "moy"
  })
  const [mode, setMode] = useState("map")

  const { year, adaptation, erosion } = params

  // Load adaptations
  const [adaptations] = useLoadCsv<Adaptation>(`data/adaptations.csv`)

  // Load adaptations available
  const [adaptationsAvailable] = useLoadCsv<{ adaptation: string }>(`data/cells/${props.cellId}/adaptations_disponibles.csv`)

  // Determine adaptation options
  const adaptationOptions = useMemo(() => {
    if (!adaptations || !adaptationsAvailable) {
      return []
    }
    const adaptationsMap = _.keyBy(adaptations, "id")
    return adaptationsAvailable.map(row => adaptationsMap[row.adaptation])
  }, [adaptations, adaptationsAvailable])

  const handleBack = () => {
    props.history.push(`/outil/${props.mrcId}`)
  }

  const renderContents = () => {
    if (mode == "map") {
      return <FillHeight>
        {(height) => (
          <CellMap
            displayParams={params}
            cellId={props.cellId}
            height={height}
            />
        )}
      </FillHeight>
    }
    // if (mode == "netCostsByType") {
    //   return <div>
    //     <NetCostsByTypeChart
    //       adaptations={adaptationOptions}
    //       cell={props.cellId}
    //       erosion={erosion}
    //       year={year + ""}
    //     />
    //   </div>
    // }
    // if (mode == "netCostsByYear") {
    //   return <div>
    //     <NetCostsByYearChart
    //       adaptations={[
    //         { id: "sansadapt", name: "Sans Adaptation" },
    //         { id: "statuquo", name: "Statu Quo" }
    //       ]}
    //       cell={props.cellId}
    //       erosion={erosion}
    //     />
    //   </div>
    // }
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
        </a> {props.cellId}
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
        adaptations={adaptationOptions}
        />
    </div>
    <div className="cell-contents">
      { renderContents() }
    </div>
  </div>
}


