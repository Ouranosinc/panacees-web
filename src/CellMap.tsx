import _ from 'lodash'
import { GeoLayerSpec, GeoJsonMap } from "./GeoJsonMap"
import React, { useState, useEffect, useCallback, ReactNode, FC, Children, useMemo } from "react"
import ReactDOMServer from 'react-dom/server'
import bbox from '@turf/bbox'
import L from "leaflet"
import length from '@turf/length'
import { History } from "history"
import { GeoJsonObject, Feature, Point, FeatureCollection, MultiPoint } from 'geojson'
import { CostSummary } from "./CostSummary"
import { DisplayParams } from "./DisplayParams"
import LoadingComponent from "./LoadingComponent"
import { Checkbox, useLoadJson, convertFeatureToCoords, useLoadCsv, convertFeatureToPoint, formatCurrency } from "./utils"
import { PopoverHelpComponent } from './PopoverHelp'
import { HeightRow } from './params'

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
  const [heights, heightsLoading] = useLoadCsv<HeightRow>(`data/cells/${props.cellId}/hauteur.csv`,
    row => ({ ...row, year: +row.year, value: +row.value })
  )

  // Load adaptations possible
  const [adaptationsPossible, adaptationsPossibleLoading] = useLoadCsv(
    `data/cells/${props.cellId}/affichage_adaptations.csv`)

  // Load layer data
  const [traitDeCote] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/trait_de_cote.geojson`)
  const [rolePoints] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/point_role.geojson`)
  const [rolePolygons] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/polygone_role.geojson`)
  const [agriPolygons] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/polygone_agri.geojson`)
  const [enviroPolygons] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/polygone_enviro.geojson`)
  const [infrasPolygons] = useLoadJson<FeatureCollection>(`data/cells/${props.cellId}/polygone_infras.geojson`)

  // Load damages and costs for parameters
  const params = props.displayParams
  const [rawErosionDamages, rawErosionDamagesLoading] = useLoadCsv(
    `data/cells/${props.cellId}/dommages_erosion_${params.erosion}.csv`, 
    row => ({ ...row, year: +row.year, value: + row.value }))
  const [rawSubmersionDamages, rawSubmersionDamagesLoading] = useLoadCsv(
    `data/cells/${props.cellId}/dommages_submersion_${params.erosion}_2${params.submersion2Y}_20${params.submersion20Y}_100${params.submersion100Y}.csv`, 
    row => ({ ...row, year: +row.year, value: +row.value }))
  const [rawAdaptationCosts, rawAdaptationCostsLoading] = useLoadCsv(
    `data/cells/${props.cellId}/couts_adaptations_${params.erosion}.csv`, 
    row => ({ ...row, year: +row.year, value: +row.value }))
  
  // Calculate bounding box
  useEffect(() => {
    if (cell) {
      // bbox gives minx, miny, maxx, maxy
      const [minx, miny, maxx, maxy] = bbox(cell)
      setBounds([[miny, minx], [maxy, maxx]])
    }
  }, [cell])

  // Determine height of flooding indexed by "year:frequency". 
  // year is rounded to 2020, 2030, etc.
  const floodHeights = useMemo(() => {
    if (heights) {
      const heightMap: {[key: string]: number} = {}
      for (const row of heights) {
        // If matches scenario
        if ((row.scenario == params.submersion2Y && row.frequence == "h2ans")
          ||(row.scenario == params.submersion20Y && row.frequence == "h20ans")
          ||(row.scenario == params.submersion100Y && row.frequence == "h100ans")) {
          heightMap[`${row.year}:${row.frequence}`] = row.value
        }
      }
      return heightMap
    }
    return null
  }, [heights, params.submersion2Y, params.submersion20Y, params.submersion100Y]) 

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
    if (!floodHeights) {
      return 0
    }

    const height = +feature.properties!.hauteur
    
    // Start with a probability of no flood of 1.0
    // For each year, multiply by probability of no flood
    // Finally, 1 - that number is probability of flood
    let notProb = 1
    for (let year = 2020 ; year <= params.year ; year++) {
      // Get decade
      const decade = Math.floor(year / 10) * 10
      const height2 = floodHeights[`${decade}:h2ans`]
      const height20 = floodHeights[`${decade}:h20ans`]
      const height100 = floodHeights[`${decade}:h100ans`]

      if (height < height2) {
        notProb *= 1 - (1.0/2)
      }
      if (height < height20) {
        notProb *= 1 - (1.0/20)
      }
      if (height < height100) {
        notProb *= 1 - (1.0/100)
      }
    }
    return 1 - notProb
  }, [floodHeights, params.year])

  /** 
   * Filter to determine if feature is touched by submersion. 
   * Uses feature property hauteur to calculate
   */
  const submersionFilter = useCallback((feature: Feature) => {
    const distance = feature.properties!.distance

    // Fudge to prevent inland depressions from showing up as flooding
    return submersionProbability(feature) > 0 && distance < 200
  }, [submersionProbability, params.year])

  /** Layer to display red icon for eroded features and blue for submerged */
  const damagesLayer = useMemo(() => {
    return {
      data: damageableFeatures,
      styleFunction: () => ({}),
      pointToLayer: (feature: Feature<Point | MultiPoint>) => { 
        const coords = convertFeatureToCoords(feature)

        let marker: L.Marker

        const isEroded = erosionFilter(feature)
        const submersionProb = submersionProbability(feature)

        if (isEroded) {
          marker = L.marker(coords as any, {
            icon: L.icon({ iconUrl: "damage_red_128.png", iconAnchor: [9, 21], iconSize: [18, 21], popupAnchor: [0, -21] })
          })
        }
        else {
          marker = L.marker(coords as any, {
            icon: L.icon({ iconUrl: "damage_blue_128.png", iconAnchor: [9, 21], iconSize: [18, 21], popupAnchor: [0, -21] })
          })
          // Use opacity to show probability
          marker.setOpacity(submersionProb * 0.8 + 0.2)
        }

        // Generate cause
        let cause = isEroded ? "Érosion" : ""
        if (submersionProb) {
          if (cause) {
            cause += " + "
          }
          cause += `Submersion` // ${(submersionProb * 100).toFixed(0)}% prob`
        }

        // Add popup
        bindFeaturePopup(params, marker, feature, cause)

        return marker
      },
      filter: (feature: Feature) => erosionFilter(feature) || submersionFilter(feature)
    }
  }, [erosionFilter, submersionFilter, damageableFeatures])

  const layers: GeoLayerSpec[] = [
    // All cells (to allow selecting adjacent)
    {
      url: `data/mrcs/${props.mrcId}/sub_cellules.geojson`,
      styleFunction: (feature) => {
        const cellId = feature!.properties!.ID_field

        return {
          weight: 2,
          color: "#d9230f",
          opacity: cellId == props.cellId ? 0.8 : 0,
          fillColor: "#d9230f",
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
            e.target.setStyle({ fillOpacity: 0.2, opacity: 1 })
          }
        })
        layer.on("mouseout", (e) => {
          if (cellId != props.cellId) {
            e.target.setStyle({ fillOpacity: 0, opacity: 0 })
          }
        })
      },
    } as GeoLayerSpec,
    // Coastline
    {
      data: !adaptationsPossibleLoading ? traitDeCote : undefined,
      styleFunction: (feature) => {
        const segId = feature!.properties!.ID

        return {
          fill: false,
          weight: 5,
          color: "black",
          // Show dark if possible/exists
          opacity: (_.find(adaptationsPossible, (row: any) => row.ID == segId && row.adaptation == params.adaptation)) ? 1 : 0.2
        }
      },
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
    layers.push(damagesLayer)
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

  const adaptationCost = _.sum((rawAdaptationCosts || [])
    .filter(row => row.adaptation == params.adaptation && row.year <= params.year)
    .map(row => row.value))

  return <div style={{ position: "relative" }}>
    <div style={{ position: "absolute", right: 20, top: 20, zIndex: 600, backgroundColor: "white", padding: 10, opacity: 0.8, borderRadius: 5 }}>
      <Checkbox value={showDamages} onChange={setShowDamages}>
        Dommages
        <PopoverHelpComponent placement="bottom">
          Visualisation des éléments du rôle foncier potentiellement touchés par l'érosion et/ou la submersion côtière - Ouranos
        </PopoverHelpComponent>
      </Checkbox>
      <Checkbox value={showRolePoints} onChange={setShowRolePoints}>
        Bâtiments (points)
        <PopoverHelpComponent placement="bottom">
          Rôle foncier (2018) - MRC de La Mitis et MRC de Rivière-du-Loup
        </PopoverHelpComponent>
      </Checkbox>
      <Checkbox value={showRolePolygons} onChange={setShowRolePolygons}>
        Bâtiments (polygones)
        <PopoverHelpComponent placement="bottom">
          Rôle foncier (2018) - MRC de La Mitis et MRC de Rivière-du-Loup
        </PopoverHelpComponent>
      </Checkbox>
      <Checkbox value={showInfras} onChange={setShowInfras}>
        Infrastructures
        <PopoverHelpComponent placement="bottom">
          <div>Infrastructures routières (2019) - Ministère des Transports du Québec (MTQ)</div>
          <div>Infrastructures souterraines (2019) - MRC de La Mitis et de Rivière-du-Loup</div>
          <div>Biens meubles essentiels  (2019) - Ministère de la Sécurité publique (MSP)</div>
          <div>Infrastructures de transport informel (2019) - Open Street Map</div>
        </PopoverHelpComponent>
      </Checkbox>
      <Checkbox value={showEnviro} onChange={setShowEnviro}>
        Environment
        <PopoverHelpComponent placement="bottom">
          <div>Milieux humides potentiels (2018) - MRC de La Mitis et MRC de Rivière-du-Loup</div>
          <div>Atlas des milieux côtiers d'intéret pour la conservation dans l'estuaire et du golfe du Saint-Laurent (2019) -  Environnement et Changements Climatiques Canada (ECCC)</div>
          <div>Faune et Flore en danger (2018) - Ministère des Forêts, de la Faune et des Parcs du Québec (MFFP)</div>
          <div>Environnment (2019) - Open Street Map</div>
        </PopoverHelpComponent>
      </Checkbox>
      <Checkbox value={showAgri} onChange={setShowAgri}>
        Agriculture
        <PopoverHelpComponent placement="bottom">
          Parcelles agricoles (2019) - Financère agricole du Québec (FADQ)
        </PopoverHelpComponent>
      </Checkbox>
      <Checkbox value={showSatellite} onChange={setShowSatellite}>
        Satellite
        <PopoverHelpComponent placement="bottom">
          Satellite par Bing Maps
        </PopoverHelpComponent>
      </Checkbox>
    </div>
    <CostSummary 
      erosionDamage={erosionDamage} 
      submersionDamage={submersionDamage} 
      totalDamagePerMeter={totalDamagePerMeter} 
      adaptationCost={adaptationCost}
      />
    <GeoJsonMap 
      layers={layers} 
      bounds={bounds} 
      baseLayer={ showSatellite ? "bing_satellite" : "positron" }
      loading={rawSubmersionDamagesLoading || rawErosionDamagesLoading}
      height={props.height}/>
    </div>
}

function bindFeaturePopup(params: DisplayParams, marker: L.Marker, feature: Feature, cause: string) {
  const props = feature.properties!

  const html = <div>
    <div><span className="text-muted">ID du matricule:</span> {props.ID}</div>
    <div><span className="text-muted">Description:</span> {props.desc}</div>
    <div><span className="text-muted">Secteur:</span> {props.secteur}</div>
    <div><span className="text-muted">Valeur totale:</span> {formatCurrency(props.valeur_tot)}</div>
    <div><span className="text-muted">Ouvrage de protection:</span> {props.ouvrage == "0" ? "Non" : "Oui"}</div>
    <div><span className="text-muted">Distance à la côte:</span> {props.distance ? props.distance.toFixed(0) + " m" : ""}</div>
    <div><span className="text-muted">Hauteur géodésique:</span> {props.hauteur} m</div>
    <div><span className="text-muted">Année d'exposition à l'érosion:</span> {getErosionYear(params, feature) > 2100 ? "" : getErosionYear(params, feature)}</div>
    <div><span className="text-muted">Aléa:</span> {cause}</div>
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
