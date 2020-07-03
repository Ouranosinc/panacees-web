import _ from 'lodash'
import React, { useState, useMemo } from "react"
import 'rc-slider/assets/index.css'
import { CellControls } from "./CellControls"
import { History } from "history"
import { DisplayParams } from "./DisplayParams"
import { GeoJsonMap, GeoLayerSpec } from "./GeoJsonMap"
import { MRCMap } from './MRCMap'
import { FillHeight } from './FillHeight'

/** Page that displays all data about an MRC, including maps and indicators. */
export const MRCPage = (props: {
  history: History
  mrcId: string
}) => {
  const [params, setParams] = useState<DisplayParams>({
    year: 2050,
    adaptation: "statuquo",
    erosion: "med",
    submersion2Y: "moy",
    submersion20Y: "moy",
    submersion100Y: "moy"
  })

  const handleBack = () => {
    props.history.push("/outil")
  }

  const handleCellClick = (cellId: string) => {
    props.history.push(`/outil/${props.mrcId}/${cellId}`)
  }

  const renderContents = () => {
    return <FillHeight>
      {(height) => <MRCMap 
        mrcId={props.mrcId} 
        displayParams={params}
        onCellClick={handleCellClick}
        height={height}
        />}
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
