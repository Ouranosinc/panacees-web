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
        <a style={{cursor: "pointer", color: "#d9230f" }} onClick={handleBack}>
          <i className="fa fa-fw fa-arrow-left"/>
        </a> {mrc.properties!.name}
      </div>
      <div style={{ fontSize: 12, color: "#666", paddingLeft: 5, paddingRight: 5, paddingBottom: 10 }}>
        PANACÉES permet de visualiser par défaut les pertes économiques potentielles totales du scénario le plus probable pour 2050 selon le statu quo.
        Pour changer le mode de visualisation par défaut choisissez l'année ainsi que les scénarios d'érosion et de submersion. 
        Pour en savoir plus sur un secteur cliquez sur le trait de côte de la carte.
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
