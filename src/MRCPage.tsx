import _ from 'lodash'
import React, { useState, useMemo } from "react"
import 'rc-slider/assets/index.css'
import { DisplayParamsControls } from "./DisplayParamsControls"
import { History } from "history"
import { DisplayParams } from "./DisplayParams"
import { GeoJsonObject, Feature, Point, FeatureCollection } from 'geojson'
import { MRCMap } from './MRCMap'
import { FillHeight } from './FillHeight'
import { useLoadJson } from './utils'
import LoadingComponent from './LoadingComponent'
import querystring from 'querystring'

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

  // Get previous cell
  const prevCellId = querystring.parse((props.history.location.search || "?").substr(1)).prevCell as string | null

  // Load mrcs
  const [mrcs] = useLoadJson<FeatureCollection>("data/mrcs.geojson")

  const mrc = useMemo(() => {
    if (mrcs) {
      return mrcs.features.find(m => m.properties!.id == props.mrcId)
    }
    return undefined
  }, [mrcs, props.mrcId])

  const handleBack = () => {
    props.history.push("/outil")
  }

  const handleCellClick = (cellId: string) => {
    props.history.push(`/outil/${props.mrcId}/${cellId}`)
  }

  if (!mrc) {
    return <LoadingComponent/>
  }

  const renderContents = () => {
    return <FillHeight>
      {(height) => <MRCMap 
        mrcId={props.mrcId} 
        displayParams={params}
        onCellClick={handleCellClick}
        height={height}
        prevCellId={prevCellId}
        />}
    </FillHeight>
  }

  return <div>
    <div className="cell-sidebar">
      <div className="cell-sidebar-title">
        <a style={{cursor: "pointer", color: "#38F" }} onClick={handleBack}>
          <i className="fa fa-fw fa-arrow-left"/>
        </a> {mrc.properties!.name}
      </div>
      <DisplayParamsControls 
        params={params}
        onChange={setParams}
        disabled={["adaptation"]}
        adaptations={
          [{ id: "statuquo", nom: "Statu quo", description: "Option de référence qui implique le maintien des conditions actuelles." }]
        }
        />
    </div>
    <div className="cell-contents">
      { renderContents() }
    </div>
  </div>
}
