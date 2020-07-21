import _ from 'lodash'
import React, { useState, ReactNode, useMemo } from "react"
import { CellMap } from "./CellMap"
import 'rc-slider/assets/index.css'
import { NetCostsByTypeChart } from "./indicator/netCostsByType"
import { DisplayParamsControls } from "./DisplayParamsControls"
import { History } from "history"
import { FillHeight } from "./FillHeight"
import { NetCostsByYearChart } from "./indicator/netCostsByYear"
import { DisplayParams } from "./DisplayParams"
import { NavSelector } from "./navSelector"
import { useLoadCsv } from "./utils"
import { Adaptation } from './params'
import { NetCostsBySectorChart } from './indicator/netCostsBySector'

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
    return _.uniq(adaptationsAvailable.map(row => row.adaptation)).map(adaptation => adaptationsMap[adaptation])
  }, [adaptations, adaptationsAvailable])

  const handleBack = () => {
    props.history.push(`/outil/${props.mrcId}?prevCell=${props.cellId}`)
  }

  const renderContents = () => {
    if (mode == "map") {
      return <FillHeight>
        {(height) => (
          <CellMap
            displayParams={params}
            mrcId={props.mrcId}
            cellId={props.cellId}
            history={props.history}
            height={height}
            />
        )}
      </FillHeight>
    }
    if (mode == "netCostsByType") {
      return <div>
        <NetCostsByTypeChart
          adaptations={adaptationOptions}
          cellId={props.cellId}
          displayParams={params}
        />
      </div>
    }
    if (mode == "netCostsBySector") {
      return <div>
        <NetCostsBySectorChart
          adaptations={adaptationOptions}
          cellId={props.cellId}
          displayParams={params}
        />
      </div>
    }
    if (mode == "netCostsByYear") {
      return <div>
        <NetCostsByYearChart
          adaptations={adaptationOptions}
          cellId={props.cellId}
          displayParams={params}
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
      disabled = ["adaptation"]
      break
    case "netCostsBySector":
      disabled = ["adaptation"]
      break
    case "netCostsByYear":
      disabled = ["year", "adaptation"]
      break
  }

  return <div>
    <div className="cell-sidebar">
      <div className="cell-sidebar-title">
        <a style={{cursor: "pointer", color: "#38F" }} onClick={handleBack}>
          <i className="fa fa-fw fa-arrow-left"/>
        </a> {props.cellId}
      </div>
      <div style={{ fontSize: 12, color: "#666", paddingLeft: 5, paddingRight: 5 }}>
        PANACÉES calcul 27 scénarios de submersion et 3 scénario d’érosion selon 
        27 indicateurs répartis dans huit secteurs d’activités d’intérêts pour un segment côtier donnée. 
      </div>
      <NavSelector options={[
        { value: "map", label: [<i className="fa fa-map fa-fw faded-icon"/>," Carte"]},
        { value: "netCostsByType", label: [<i className="fa fa-bar-chart fa-fw faded-icon"/>," Coûts Nets Actualisés par Type"]},
        { value: "netCostsBySector", label: [<i className="fa fa-bar-chart fa-fw faded-icon"/>," Coûts Nets Actualisés par Secteur"]},
        { value: "netCostsByYear", label: [<i className="fa fa-line-chart fa-fw faded-icon"/>," Coûts Nets Actualisés par Année"]} 
      ]} value={mode} onChange={setMode}/>
      <DisplayParamsControls 
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


