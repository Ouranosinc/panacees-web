import _ from 'lodash'
import { GeoLayerSpec, GeoJsonMap } from "./GeoJsonMap"
import React, { useState, useEffect, useCallback, ReactNode, FC, Children, useMemo } from "react"
import ReactDOMServer from 'react-dom/server'
import bbox from '@turf/bbox'
import L from "leaflet"
import length from '@turf/length'
import { History } from "history"
import { GeoJsonObject, Feature, Point, FeatureCollection, MultiPoint } from 'geojson'
import { DamageSummary } from "./DamageSummary"
import { DisplayParams } from "./DisplayParams"
import LoadingComponent from "./LoadingComponent"
import { Checkbox, useLoadJson, convertFeatureToCoords, useLoadCsv, convertFeatureToPoint, formatCurrency } from "./utils"
import { PopoverHelpComponent } from './PopoverHelp'

export const CellMap = (props: {
  /** ID of MRC */
  mrcId: string

  /** ID of cell */
  cellId: string

  displayParams: DisplayParams
 
  history: History

  /** Height of the map */
  height: number
}) => {
  // Initial map bounds. Set based on cell
  const [bounds, setBounds] = useState<[number,number][]>()

  const [showSatellite, setShowSatellite] = useState(false)
  const [showAgri, setShowAgri] = useState(false)
  const [showEnviro, setShowEnviro] = useState(false)
  const [showInfras, setShowInfras] = useState(false)
  const [showRolePolygons, setShowRolePolygons] = useState(false)
  const [showRolePoints, setShowRolePoints] = useState(true)
  const [showDamages, setShowDamages] = useState(true)

  // Load cell
  const [cell, cellLoading] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/sub_cellules.geojson`)

  // Load heights
  const [heights, heightsLoading] = useLoadCsv(`data/cells/${props.cellId}/hauteur.csv`,
    row => ({ ...row, value: +row.value })
  )

  // Load layer data
  const [traitDeCote] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/trait_de_cote.geojson`)
  const [rolePoints] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/point_role.geojson`)
  const [rolePolygons] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/polygone_role.geojson`)
  const [agriPolygons] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/polygone_agri.geojson`)
  const [enviroPolygons] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/polygone_enviro.geojson`)
  const [infrasPolygons] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/polygone_infras.geojson`)

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
  const floodHeights = useMemo(() => {
    if (heights) {
      const row2 = heights.find(row => row.scenario == params.submersion2Y && row.frequence == "h2ans")
      const row20 = heights.find(row => row.scenario == params.submersion20Y && row.frequence == "h20ans")
      const row100 = heights.find(row => row.scenario == params.submersion100Y && row.frequence == "h100ans")
      return [row2!.value, row20!.value, row100!.value]
    }
    return [0, 0, 0]
  }, [heights, params]) 

  /** Create feature collection that is all damageable items */
  const damageableFeatures = useMemo<FeatureCollection>(() => {
    let features: Feature[] = []

    if (rolePoints && (showRolePoints || showRolePolygons)) {
      features = features.concat(rolePoints.features.map(convertFeatureToPoint))
    }
    if (agriPolygons && showAgri) {
      features = features.concat(agriPolygons.features.map(convertFeatureToPoint))
    }
    if (enviroPolygons && showEnviro) {
      features = features.concat(enviroPolygons.features.map(convertFeatureToPoint))
    }
    if (infrasPolygons && showInfras) {
      features = features.concat(infrasPolygons.features.map(convertFeatureToPoint))
    }
    return {
      type: "FeatureCollection",
      features: features
    }
  }, [rolePoints, rolePolygons, agriPolygons, infrasPolygons, enviroPolygons])

  /** 
   * Filter to determine if feature is touched by erosion. 
   * Uses feature properties distance, taux_statu and taux_sansa to calculate
   */
  const erosionFilter = useCallback((feature: Feature) => {
    return params.year > getErosionYear(params, feature)
  }, [params.year, params.adaptation])

  /** Calculate probability of submersion (rough) for the current year */
  const submersionProbability = useCallback((feature: Feature) => {
    // Probability of flooding (rough)
    let prob = 0
    const height = +feature.properties!.hauteur
    const years = params.year - 2020
    
    if (height < floodHeights[0]) {
      prob += (1.0/2) * years
    }
    if (height < floodHeights[1]) {
      prob += (1.0/20) * years
    }
    if (height < floodHeights[2]) {
      prob += (1.0/100) * years
    }
    return Math.min(prob, 1)
  }, [floodHeights])

  /** 
   * Filter to determine if feature is touched by erosion. 
   * Uses feature property hauteur to calculate
   */
  const submersionFilter = useCallback((feature: Feature) => {
    const distance = feature.properties!.distance

    // Fudge to prevent inland depressions from showing up as flooding
    return submersionProbability(feature) > 0 && distance < 200
  }, [submersionProbability])

  /** Layer to display red icon for eroded features */
  const erosionDamagesLayer = useMemo(() => {
    return {
      data: damageableFeatures,
      styleFunction: () => ({}),
      pointToLayer: (p: Feature<Point | MultiPoint>) => { 
        const coords = convertFeatureToCoords(p)
        const marker = L.marker(coords as any, {
          icon: L.icon({ iconUrl: "house_red_128.png", iconAnchor: [9, 21], iconSize: [18, 21], popupAnchor: [0, -21] })
        })

        // Add popup
        bindFeaturePopup(params, marker, p)
        return marker
      },
      filter: erosionFilter
    }
  }, [erosionFilter])

  /** Layer to display blue icon for submerged features */
  const submersionDamagesLayer = useMemo(() => {
    return {
      data: damageableFeatures,
      styleFunction: () => ({}),
      pointToLayer: (p: Feature<Point | MultiPoint>) => { 
        const coords = convertFeatureToCoords(p)
        const marker = L.marker(coords as any, {
          icon: L.icon({ iconUrl: "house_blue_128.png", iconAnchor: [9, 21], iconSize: [18, 21], popupAnchor: [0, -21] })
        })
        // Use opacity to show probability
        marker.setOpacity(submersionProbability(p))

        // Add popup
        bindFeaturePopup(params, marker, p)

        return marker
      },
      filter: submersionFilter
    }
  }, [submersionFilter])

  const layers: GeoLayerSpec[] = [
    // All cells (to allow selecting adjacent)
    {
      url: `data/mrcs/${props.mrcId}/sub_cellules.geojson`,
      styleFunction: (feature) => {
        const cellId = feature!.properties!.ID_field

        return {
          weight: 1,
          color: "#38F",
          opacity: cellId == props.cellId ? 0.8 : 0,
          fillColor: "#444",
          fillOpacity: 0,
        }
      }, 
      onEachFeature: (feature, layer: L.GeoJSON) => {
        const cellId = feature.properties!.ID_field

        layer.on("click", () => {
          if (cellId != props.cellId) {
            props.history.push(`/outil/${props.mrcId}/${cellId}`)
          }
        })
        layer.on("mouseover", (e) => {
          if (cellId != props.cellId) {
            e.target.setStyle({ fillOpacity: 0.2 })
          }
        })
        layer.on("mouseout", (e) => {
          e.target.setStyle({ fillOpacity: 0 })
        })
      },
    } as GeoLayerSpec,
    // Coastline
    {
      data: traitDeCote,
      styleFunction: (feature) => {
        return {
          fill: false,
          weight: 4,
          color: "black",
        }
      }
    },
  ]

  if (showAgri) {
    layers.push({
      data: agriPolygons,
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

  if (showEnviro) {
    layers.push({
      data: enviroPolygons,
      styleFunction: (feature) => {
        return {
          weight: 0.5,
          color: "blue",
          opacity: 0.7,
          fillColor: "blue",
          fillOpacity: 0.2
        }
      },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties!.desc)
      }
    })
  }

  if (showInfras) {
    layers.push({
      data: infrasPolygons,
      styleFunction: (feature) => {
        return {
          weight: 2,
          color: "#888",
          opacity: 0.7,
          fillColor: "#888",
          fillOpacity: 0.2
        }
      },
      onEachFeature: (feature, layer) => {
        // layer.bindTooltip(feature.properties!.desc)
      }
    })
  }

  if (showRolePolygons) {
    layers.push({
      data: rolePolygons,
      styleFunction: (feature) => {
        return {
          weight: 0.5,
          color: "#c89c34ff",
          opacity: 0.7,
          fillColor: "#c89c34ff",
          fillOpacity: 0.2
        }
      },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties!.desc)
      }
    })
  }

  if (showRolePoints) {
    layers.push({
      data: rolePoints,
      styleFunction: () => ({}),
      pointToLayer: (p: Feature<Point | MultiPoint>) => { 
        const coords = convertFeatureToCoords(p)
        const marker = L.circleMarker(coords as any, { radius: 1, color: "#c89c34ff", opacity: 0.8 })
        marker.bindTooltip(p.properties!.desc)
        return marker
      }
    })
  }

  if (showDamages) {
    layers.push(submersionDamagesLayer)
    layers.push(erosionDamagesLayer)
  }

  if (!bounds || !heights || !traitDeCote) {
    return <LoadingComponent/>
  }

  const erosionDamage = _.sum((rawErosionDamages || [])
    .filter(row => row.adaptation == params.adaptation && row.year <= params.year)
    .map(row => row.value))

  const submersionDamage = _.sum((rawSubmersionDamages || [])
    .filter(row => row.adaptation == params.adaptation && row.year <= params.year)
    .map(row => row.value))

  const totalDamagePerMeter = (erosionDamage + submersionDamage) / (length(traitDeCote) * 1000)

  return <div style={{ position: "relative" }}>
    <div style={{ position: "absolute", right: 20, top: 20, zIndex: 600, backgroundColor: "white", padding: 10, opacity: 0.8, borderRadius: 5 }}>
      <Checkbox value={showDamages} onChange={setShowDamages}>
        Dommages
        <PopoverHelpComponent>Lorem Ipsum</PopoverHelpComponent>
      </Checkbox>
      <Checkbox value={showRolePoints} onChange={setShowRolePoints}>
        Bâtiments (points)
        <PopoverHelpComponent>Lorem Ipsum</PopoverHelpComponent>
      </Checkbox>
      <Checkbox value={showRolePolygons} onChange={setShowRolePolygons}>
        Bâtiments (polygones)
        <PopoverHelpComponent>Lorem Ipsum</PopoverHelpComponent>
      </Checkbox>
      <Checkbox value={showInfras} onChange={setShowInfras}>
        Infrastructures
        <PopoverHelpComponent>Lorem Ipsum</PopoverHelpComponent>
      </Checkbox>
      <Checkbox value={showEnviro} onChange={setShowEnviro}>
        Environment
        <PopoverHelpComponent>Lorem Ipsum</PopoverHelpComponent>
      </Checkbox>
      <Checkbox value={showAgri} onChange={setShowAgri}>
        Agriculture
        <PopoverHelpComponent>Lorem Ipsum</PopoverHelpComponent>
      </Checkbox>
      <Checkbox value={showSatellite} onChange={setShowSatellite}>
        Satellite
        <PopoverHelpComponent>Lorem Ipsum</PopoverHelpComponent>
      </Checkbox>
    </div>
    <DamageSummary erosionDamage={erosionDamage} submersionDamage={submersionDamage} totalDamagePerMeter={totalDamagePerMeter} />
    <GeoJsonMap 
      layers={layers} 
      bounds={bounds} 
      baseLayer={ showSatellite ? "bing_satellite" : "positron" }
      loading={rawSubmersionDamagesLoading || rawErosionDamagesLoading}
      height={props.height}/>
    </div>
}

const emptyFeatureCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: []
}

function bindFeaturePopup(params: DisplayParams, marker: L.Marker, feature: Feature) {
  const props = feature.properties!

  const html = <div>
    <div><span className="text-muted">Description:</span> {props.desc}</div>
    <div><span className="text-muted">Secteur:</span> {props.secteur}</div>
    <div><span className="text-muted">Valeur totale:</span> {formatCurrency(props.valeur_tot)}</div>
    <div><span className="text-muted">Ouvrage de protection:</span> {props.ouvrage == "0" ? "Non" : "Oui"}</div>
    <div><span className="text-muted">Distance à la côte:</span> {props.distance ? props.distance.toFixed(0) + " m" : ""}</div>
    <div><span className="text-muted">Hauteur géodésique:</span> {props.hauteur} m</div>
    <div><span className="text-muted">Année d'exposition:</span> {getErosionYear(params, feature) > 2100 ? "" : getErosionYear(params, feature)}</div>
    <div><span className="text-muted">Aléa:</span> TO DO</div>
  </div>

  marker.bindPopup(ReactDOMServer.renderToString(html))
}

/** Get year when will be exposed */
function getErosionYear(params: DisplayParams, feature: Feature) {
  // Determine rate of erosion
  let rate = 0
  if (params.adaptation == "statuquo") {
    rate = feature.properties!.taux_statu
  }
  else if (params.adaptation == "sansadapt") {
    rate = feature.properties!.taux_sansa
  }
  const distance = feature.properties!.distance

  // Get number of years 
  const years = rate > 0 ? (distance / rate) : 500

  return Math.floor(years + 2020)
}
