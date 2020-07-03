import _ from 'lodash'
import { GeoLayerSpec, GeoJsonMap } from "./GeoJsonMap"
import React, { useState, useEffect, useCallback, ReactNode, FC, Children, useMemo } from "react"
import bbox from '@turf/bbox'
import L from "leaflet"
import { GeoJsonObject, Feature, Point, FeatureCollection, MultiPoint } from 'geojson'
import { DamageSummary } from "./DamageSummary"
import { DisplayParams } from "./DisplayParams"
import LoadingComponent from "./LoadingComponent"
import { Checkbox, useLoadJson, convertFeatureToCoords, useLoadCsv } from "./utils"

export const CellMap = (props: {
  /** ID of cell */
  cellId: string

  displayParams: DisplayParams

  /** Height of the map */
  height: number
}) => {
  // Initial map bounds. Set based on cell
  const [bounds, setBounds] = useState<[number,number][]>()

  const [satellite, setSatellite] = useState(true)
  const [environment, setEnvironment] = useState(false)
  const [damages, setDamages] = useState(true)

  // Load cell
  const [cell, cellLoading] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/sub_cellules.geojson`)

  // Load heights
  const [heights, heightsLoading] = useLoadCsv(`data/cells/${props.cellId}/hauteur.csv`,
    row => ({ ...row, value: +row.value })
  )

  // Load damages for parameters
  const params = props.displayParams
  const [rawErosionDamages, rawErosionDamagesLoading] = useLoadCsv(
    `data/cells/${props.cellId}/dommages_erosion_${params.erosion}.csv`, 
    row => ({ ...row, year: +row.year, value: + row.value }))
  const [rawSubmersionDamages, rawSubmersionDamagesLoading] = useLoadCsv(
    `data/cells/${props.cellId}/dommages_submersion_${params.erosion}_2${params.submersion2Y}_20${params.submersion20Y}_100${params.submersion100Y}.csv`, 
    row => ({ ...row, year: +row.year, value: +row.value }))

  // Calculate bounding box
  useEffect(() => {
    if (cell) {
      // bbox gives minx, miny, maxx, maxy
      const [minx, miny, maxx, maxy] = bbox(cell)
      setBounds([[miny, minx], [maxy, maxx]])
    }
  }, [cell])

  // Determine height of flooding
  const floodHeight = useMemo(() => {
    if (heights) {
      const row = heights.find(row => row.scenario == params.submersion20Y && row.frequence == "h20ans")
      return row ? row.value : 0
    }
    return 0
  }, [heights, params.submersion20Y]) 

  const layers: GeoLayerSpec[] = [
    // Cell outline
    {
      url: `data/cells/${props.cellId}/sub_cellules.geojson`,
      styleFunction: (feature) => {
        return {
          fill: false,
          weight: 1,
          color: "#38F",
          opacity: 0.8
        }
      }
    },
    // Coastline
    {
      url: `data/cells/${props.cellId}/trait_de_cote.geojson`,
      styleFunction: (feature) => {
        return {
          fill: false,
          weight: 4,
          color: "#38F",
        }
      }
    },
  ]

  const erosionFilter = useCallback((feature: Feature) => {
    // Determine rate of erosion
    let rate = 0
    if (params.adaptation == "statuquo") {
      rate = feature.properties!.taux_statu
    }
    else if (params.adaptation == "sansadapt") {
      rate = feature.properties!.taux_sansa
    }
    const distance = feature.properties!.distance

    // Get number ofparams.year years 
    const years = rate > 0 ? (distance / rate) : 500
    return params.year > (2020 + years)
  }, [params.year, params.adaptation])

  const submersionFilter = useCallback((feature: Feature) => {
    return +feature.properties!.hauteur <= floodHeight
  }, [floodHeight])

  /** Layer to display red icon for eroded houses */
  const erosionDamagesLayer = useMemo(() => {
    return {
      url: `data/cells/${props.cellId}/point_role.geojson`,
      styleFunction: () => ({}),
      pointToLayer: (p: Feature<Point | MultiPoint>) => { 
        const coords = convertFeatureToCoords(p)
        const marker = L.marker(coords as any, {
          icon: L.icon({ iconUrl: "house_red_128.png", iconAnchor: [9, 21], iconSize: [18, 21], popupAnchor: [0, -21] })
        })
        // TODO escape HTML
        // TODO format currency
        marker.bindPopup(`
          <p>${p.properties!.description}</p>
          <div>Valeur du bâtiment: ${(p.properties!.valeur_tot || 0)}</div>
          <div>Valeur du terrain: ${(p.properties!.valeur_ter || 0)}</div>
          <div>Valeur totale: ${(p.properties!.valeur_tot || 0)}</div>
          `, { })
        return marker
        // return L.circleMarker(coords as any, { radius: 1, color: "yellow", opacity: 0.7 })
      },
      filter: erosionFilter
    }
  }, [erosionFilter])

  /** Layer to display blue icon for submerged houses */
  const submersionDamagesLayer = useMemo(() => {
    return {
      url: `data/cells/${props.cellId}/point_role.geojson`,
      styleFunction: () => ({}),
      pointToLayer: (p: Feature<Point | MultiPoint>) => { 
        const coords = convertFeatureToCoords(p)
        const marker = L.marker(coords as any, {
          icon: L.icon({ iconUrl: "house_blue_128.png", iconAnchor: [9, 21], iconSize: [18, 21], popupAnchor: [0, -21] })
        })
        // TODO escape HTML
        // TODO format currency
        marker.bindPopup(`
          <p>${p.properties!.description}</p>
          <div>Valeur du bâtiment: ${(p.properties!.valeur_tot || 0)}</div>
          <div>Valeur du terrain: ${(p.properties!.valeur_ter || 0)}</div>
          <div>Valeur totale: ${(p.properties!.valeur_tot || 0)}</div>
          `, { })
        return marker
      },
      filter: submersionFilter
    }
  }, [submersionFilter])

  if (damages) {
    layers.push(submersionDamagesLayer)
    layers.push(erosionDamagesLayer)
  }

  if (environment) {
    // Add buildings
    layers.unshift({
      url: `data/cells/${props.cellId}/point_role.geojson`,
      styleFunction: () => ({}),
      pointToLayer: (p: Feature<Point | MultiPoint>) => { 
        const coords = convertFeatureToCoords(p)
        // const marker = L.marker(coords as any, {
        //   icon: L.icon({ iconUrl: "house_128.png", iconAnchor: [10, 8], iconSize: [20, 16], popupAnchor: [0, -8] })
        // })
        // // TODO escape HTML
        // // TODO format currency
        // marker.bindPopup(`
        //   <p>${p.properties!.description}</p>
        //   <div>Valeur du bâtiment: ${(p.properties!.valeur_tot || 0)}</div>
        //   <div>Valeur du terrain: ${(p.properties!.valeur_ter || 0)}</div>
        //   <div>Valeur totale: ${(p.properties!.valeur_tot || 0)}</div>
        //   `, { })
        // return marker
        const marker = L.circleMarker(coords as any, { radius: 1, color: "#c89c34ff", opacity: 0.8 })
        marker.bindTooltip(p.properties!.desc)
        return marker
      }
    })
  
    layers.unshift({
      url: `data/cells/${props.cellId}/polygone_enviro.geojson`,
      styleFunction: (feature) => {
        return {
          weight: 0.5,
          color: "purple",
          opacity: 0.7,
          fillColor: "purple",
          fillOpacity: 0.2
        }
      },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties!.desc)
      }
    })
  }

  // if (batiments) {
  //   layers.push({ 
  //     url: "static/batiments_deMetissurMer-4326.geojson", 
  //     styleFunction: () => ({}),
  //     pointToLayer: (p: any) => { 
  //       const coords = [p.geometry.coordinates[0][1], p.geometry.coordinates[0][0]]
  //       return L.circleMarker(coords as any, { radius: 1, color: "yellow", opacity: 0.7 })
  //     }
  //   })
  // }

  if (!bounds) {
    return <LoadingComponent/>
  }

  const erosionDamage = _.sum((rawErosionDamages || [])
    .filter(row => row.adaptation == params.adaptation && row.year <= params.year)
    .map(row => row.value))

  const submersionDamage = _.sum((rawSubmersionDamages || [])
    .filter(row => row.adaptation == params.adaptation && row.year <= params.year)
    .map(row => row.value))

  return <div style={{ position: "relative" }}>
    <div style={{ position: "absolute", right: 20, top: 20, zIndex: 1000, backgroundColor: "white", padding: 10, opacity: 0.8, borderRadius: 5 }}>
      <Checkbox value={satellite} onChange={setSatellite}>Satellite</Checkbox>
      <Checkbox value={environment} onChange={setEnvironment}>Plan</Checkbox>
      <Checkbox value={damages} onChange={setDamages}>Dommages</Checkbox>
    </div>
    <DamageSummary erosionDamage={erosionDamage} submersionDamage={submersionDamage} />
    <GeoJsonMap 
      layers={layers} 
      bounds={bounds} 
      baseLayer={ satellite ? "bing_satellite" : "positron" }
      height={props.height}/>
    </div>
}

