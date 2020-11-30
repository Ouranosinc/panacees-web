import _ from 'lodash'
import React, { useState, useMemo, useEffect } from "react"
import { GeoLayerSpec, GeoJsonMap } from "./GeoJsonMap"
import bbox from '@turf/bbox'
import length from '@turf/length'
import { GeoJsonObject, Feature, Point, FeatureCollection } from 'geojson'
import { useLoadJson, useLoadCsv, Checkbox } from "./utils"
import { DisplayParams } from './DisplayParams'
import { scaleLinear, interpolateRdYlBu, scaleSequential, interpolateSpectral } from 'd3'
import { CostSummary } from './CostSummary'
import LoadingComponent from './LoadingComponent'
import ReactSelect from 'react-select'
import { PopoverHelpComponent } from './PopoverHelp'

/** Map for an MRC which shows the cells and the coastline highlighted by cost of damages */
export const MRCMap = (props: {
  /** ID of the MRC e.g. "MITIS" */
  mrcId: string

  /** Parameters (e.g. which erosion, year, etc) which are active */ 
  displayParams: DisplayParams

  /** Called when a cell is clicked */
  onCellClick: (cellId: string) => void

  /** Previous cell id to show as ghost */
  prevCellId?: string | null

  /** Height of the map */
  height: number
}) => {
  // Load coastline
  const [coastline, coastlineLoading] = useLoadJson<FeatureCollection>(`data/mrcs/${props.mrcId}/trait_de_cote.geojson`)

  // True to show satellite
  const [showSatellite, setShowSatellite] = useState(false)

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
      setCellLengths(_.mapValues(byCell, (features) => _.sum(features.map(f => length(f) * 1000))))
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

        const color = scaleLinear().domain([0, 2000, 3000, 4000]).range(["green", "yellow", "orange", "red"] as any)

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
        const cellId = feature!.properties!.ID_field

        return {
          weight: 1,
          fillColor: "#444",
          fillOpacity: 0,
          opacity: cellId == props.prevCellId ? 0.8 : 0,
          color: "#d9230f"
        }
      }, 
      onEachFeature: (feature, layer: L.GeoJSON) => {
        const cellId = feature.properties!.ID_field

        layer.bindTooltip(cellId)

        layer.on("click", () => {
          props.onCellClick(cellId)
        })
        layer.on("mouseover", (e) => {
          setHover(cellId)
          e.target.setStyle({ fillColor: "#d9230f", fillOpacity: 0.3 })
        })
        layer.on("mouseout", (e) => {
          setHover(undefined)
          e.target.setStyle({ fillColor: "#444", fillOpacity: 0 })
        })
      }
    } as GeoLayerSpec

  ], [cells, coastline, cellErosionDamages, cellSubmersionDamages, cellLengths])

  if (!bounds || !cellSubmersionDamages || !coastline || !cellLengths || !cells || !rawErosionDamages || !rawSubmersionDamages) {
    return <LoadingComponent/>
  }

  const erosionDamage = _.sum(rawErosionDamages.filter(row => row.year <= params.year).map(row => row.value))
  const submersionDamage = _.sum(rawSubmersionDamages.filter(row => row.year <= params.year).map(row => row.value))
  const totalDamagePerMeter = (erosionDamage + submersionDamage) / _.sum(_.values(cellLengths))

  return <div style={{ position: "relative" }}>
    <CostSummary erosionDamage={erosionDamage} submersionDamage={submersionDamage} totalDamagePerMeter={totalDamagePerMeter} />
    <div style={{ position: "absolute", right: 20, top: 60, zIndex: 600, backgroundColor: "white", padding: 10, opacity: 0.8, borderRadius: 5 }}>
      <Checkbox value={showSatellite} onChange={setShowSatellite}>
        Satellite
        <PopoverHelpComponent placement="bottom">
          Satellite par Bing Maps
        </PopoverHelpComponent>
      </Checkbox>
    </div>

    <GeoJsonMap 
      layers={layers} 
      bounds={bounds} 
      baseLayer={ showSatellite ? "bing_satellite" : "positron" }
      height={props.height}
      loading={rawErosionDamagesLoading || rawSubmersionDamagesLoading}
    />
    <CellSelector 
      options={_.sortBy(cells.features.map(f => ({ value: f.properties!.ID_field, label: f.properties!.ID_field })), o => o.label)}
      onSelect={props.onCellClick}
    />
    <Legend/>
  </div>
}

const CellSelector = (props: {
  options: { value: string, label: string }[]
  onSelect: (value: string) => void
}) => {
  return <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1300, width: 250 }}>
    <ReactSelect
      placeholder="Sélectionner un segment côtier"
      options={props.options}
      onChange={option => { if (option) { props.onSelect((option as any).value) }}}
    />
  </div>
}


const Legend = (props: {}) => {
  return <div style={{ position: "absolute", bottom: 20, right: 10, zIndex: 1000, padding: 10, backgroundColor: "white", borderRadius: 8, fontSize: 14, opacity: 0.9 }}>
    <div className="text-muted">Coût total au mètre linéaire</div>
    <LegendItem color="red">4000$ / m</LegendItem>
    <LegendItem color="orange">3000$ / m</LegendItem>
    <LegendItem color="yellow">2000$ / m</LegendItem>
    <LegendItem color="green">0$ / m</LegendItem>
  </div>
}

const LegendItem = (props: { color: any, children: React.ReactNode }) => {
  return <div style={{ fontSize: 12 }}>
    <i className="fa fa-square" style={{ color: props.color }}/> {props.children}
  </div>
}
