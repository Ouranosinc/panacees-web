import _ from 'lodash'
import React, { useState, useMemo, useEffect } from "react"
import { GeoLayerSpec, GeoJsonMap } from "./GeoJsonMap"
import { FillHeight } from "./FillHeight"
import { CellControls } from "./CellControls"
import bbox from '@turf/bbox'
import length from '@turf/length'
import { GeoJsonObject, Feature, Point, FeatureCollection } from 'geojson'
import { useLoadJson, useLoadCsv } from "./utils"
import { DisplayParams } from './DisplayParams'
import { scaleLinear, interpolateRdYlBu, scaleSequential, interpolateSpectral } from 'd3'
import { DamageSummary } from './DamageSummary'

/** Map for an MRC which shows the cells and the coastline highlighted by cost of damages */
export const MRCMap = (props: {
  /** ID of the MRC e.g. "MITIS" */
  mrcId: string

  /** Parameters (e.g. which erosion, year, etc) which are active */ 
  displayParams: DisplayParams

  /** Called when a cell is clicked */
  onCellClick: (cellId: string) => void

  /** Height of the map */
  height: number
}) => {
  // Load coastline
  const [coastline, coastlineLoading] = useLoadJson<FeatureCollection>(`data/mrcs/${props.mrcId}/trait_de_cote.geojson`)

  // Load cells
  const [cells, cellsLoading] = useLoadJson<FeatureCollection>(`data/mrcs/${props.mrcId}/sub_cellules.geojson`)

  // Initial map bounds. Set based on cells
  const [bounds, setBounds] = useState<[number,number][]>()

  // Currently hovered cell
  const [hover, setHover] = useState<string>()

  // Cell lengths in kilometers. Calculated when cells are loaded
  const [cellLengths, setCellLengths] = useState<{ [cellId: string]: number }>()

  // Cell erosion damages (total)
  const [cellErosionDamages, setCellErosionDamages] = useState<{ [cellId: string]: number }>()

  // Cell submersion damages (total)
  const [cellSubmersionDamages, setCellSubmersionDamages] = useState<{ [cellId: string]: number }>()

  // Load damages for parameters
  const params = props.displayParams
  const [rawErosionDamages, rawErosionDamagesLoading] = useLoadCsv(
    `data/mrcs/${props.mrcId}/dommages_erosion_${params.erosion}.csv`, 
    row => ({ ...row, value: + row.value }))
  const [rawSubmersionDamages, rawSubmersionDamagesLoading] = useLoadCsv(
    `data/mrcs/${props.mrcId}/dommages_submersion_${params.erosion}_2${params.submersion2Y}_20${params.submersion20Y}_100${params.submersion100Y}.csv`, 
    row => ({ ...row, value: + row.value }))
  
  // Calculate bounding box
  useEffect(() => {
    if (cells) {
      // bbox gives minx, miny, maxx, maxy
      const [minx, miny, maxx, maxy] = bbox(cells)
      setBounds([[miny, minx], [maxy, maxx]])
    }
  }, [cells])
 
  // Calculate lengths of each cell (coastline is by segment, so total)
  useEffect(() => {
    if (coastline) {
      // Group by cell and total
      const byCell = _.groupBy(coastline.features, f => f.properties!.ID_field)
      setCellLengths(_.mapValues(byCell, (features) => _.sum(features.map(f => length(f)))))
    }
  }, [coastline])

  // Calculate cumulative erosion damages by cell up to current year
  useEffect(() => {
    if (rawErosionDamages) {
      // Group by cell and total
      const included = rawErosionDamages.filter(row => row.year <= params.year)
      const byCell = _.groupBy(included, row => row.ID_field)
      setCellErosionDamages(_.mapValues(byCell, rows => _.sum(rows.map(r => r.value))))
    }
  }, [rawErosionDamages, params.year])
  
  // Calculate submersion damages by cell
  useEffect(() => {
    if (rawSubmersionDamages) {
      // Group by cell and total
      const included = rawSubmersionDamages.filter(row => row.year <= params.year)
      const byCell = _.groupBy(included, row => row.ID_field)
      setCellSubmersionDamages(_.mapValues(byCell, rows => _.sum(rows.map(r => r.value))))
    }
  }, [rawSubmersionDamages, params.year])
  
  const layers: GeoLayerSpec[] = useMemo(() => [
    {
      data: coastline,
      styleFunction: (feature) => {
        const cellId = feature!.properties.ID_field

        // Get length of cell that feature is part of
        const cellLength = (cellLengths || {})[cellId]

        // Get erosion damage
        const erosionDamage = (cellErosionDamages || {})[cellId] || 0

        // Get submersion damage
        const submersionDamage = (cellSubmersionDamages || {})[cellId] || 0

        // Calculate damage per km
        const damagePerKm = (erosionDamage + submersionDamage) / cellLength
        // const damagePerKm = (submersionDamage) / cellLength

        // console.log(`${damagePerKm} = ${erosionDamage} + ${submersionDamage} / ${cellLength}`)

        const color = scaleLinear().domain([0, 2000000, 4000000]).range(["green", "yellow", "red"] as any)

        return {
          fill: false,
          weight: 4,
          color: color(damagePerKm) as any
        }
      }, 
    } as GeoLayerSpec,
    {
      data: cells,
      styleFunction: (feature) => {
        return {
          weight: 1,
          fillColor: "#444",
          fillOpacity: 0.1,
          opacity: 0.1
        }
      }, 
      onEachFeature: (feature, layer: L.GeoJSON) => {
        const cellId = feature.properties!.ID_field

        layer.on("click", () => {
          props.onCellClick(cellId)
        })
        layer.on("mouseover", (e) => {
          setHover(cellId)
          e.target.setStyle({ fillColor: "#38F", fillOpacity: 0.3 })
        })
        layer.on("mouseout", (e) => {
          setHover(undefined)
          e.target.setStyle({ fillColor: "#444", fillOpacity: 0.1 })
        })
      }
    } as GeoLayerSpec

  ], [cells, coastline, cellErosionDamages, cellSubmersionDamages, cellLengths])

  if (!bounds || !cellSubmersionDamages || !coastline || !cellLengths || !cells || !rawErosionDamages || !rawSubmersionDamages) {
    return null
  }

  const erosionDamage = _.sum(rawErosionDamages.filter(row => row.year <= params.year).map(row => row.value))
  const submersionDamage = _.sum(rawSubmersionDamages.filter(row => row.year <= params.year).map(row => row.value))

  return <div style={{ position: "relative" }}>
    <DamageSummary erosionDamage={erosionDamage} submersionDamage={submersionDamage} />
    <GeoJsonMap 
      layers={layers} 
      bounds={bounds} 
      baseLayer={"positron"}
      height={props.height}
      loading={rawErosionDamagesLoading || rawSubmersionDamagesLoading}
    />
  </div>
}