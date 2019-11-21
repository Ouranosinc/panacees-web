import { default as pointInPolygon } from '@turf/boolean-point-in-polygon'
import { FeatureCollection } from 'geojson'
import { GeoLayerSpec } from './GeoJsonMap'
import L from 'leaflet'
import { useState, useEffect } from 'react'

// 3400ms submersion, 128ms erosion
export const calculateCost = async () => {
  const submersion = await fetch("submersion/submersion_sa_deMetissurMer_0a9m-4326.geojson").then(f => f.json())
  const buildings = await fetch("static/batiments_deMetissurMer-4326.geojson").then(f => f.json())
  const erosion = await fetch("erosion/high_erosion_sa_deMetissurMer_2100-4326.geojson").then(f => f.json())
  
  let submersionTotal = 0
  console.time("submersion")
  for (const building of buildings.features) {
    // console.log(building.properties.valeur_tot)
    // console.log(building.geometry.coordinates[0])
    if (pointInPolygon(building.geometry.coordinates[0], submersion.features[0].geometry)) {
      submersionTotal += building.properties.valeur_tot
    }
  }
  console.timeEnd("submersion")

  let erosionTotal = 0
  console.time("erosion")
  for (const building of buildings.features) {
    // console.log(building.properties.valeur_tot)
    // console.log(building.geometry.coordinates[0])
    if (pointInPolygon(building.geometry.coordinates[0], erosion.features[0].geometry)) {
      erosionTotal += building.properties.valeur_tot
    }
  }
  console.timeEnd("erosion")

  console.log(`Submersion: ${submersionTotal}`)
  console.log(`Erosion: ${erosionTotal}`)
}

export const createErosionDamageLayer = async (erosion: string, year: string): Promise<{ layer: GeoLayerSpec, cost: number }> => {
  const buildings = await fetch("static/batiments_deMetissurMer-4326.geojson").then(f => f.json())
  const erosionGeoJson = await fetch(`erosion/${erosion}_erosion_sa_deMetissurMer_${year}-4326.geojson`).then(f => f.json())

  const features: FeatureCollection = { type: "FeatureCollection", features: [] }

  let erosionTotal = 0
  for (const building of buildings.features) {
    if (pointInPolygon(building.geometry.coordinates[0], erosionGeoJson.features[0].geometry)) {
      features.features.push({ type: "Feature", properties: {}, geometry: building.geometry })
      erosionTotal += building.properties.valeur_tot
    }
  }
  
  const layer = {
    data: features,
    styleFunction: () => ({}),
    pointToLayer: (p: any) => { 
      const coords = [p.geometry.coordinates[0][1], p.geometry.coordinates[0][0]]
      return L.marker(coords as any, {
        icon: L.icon({ iconUrl: "house_red.png", iconAnchor: [14, 41] })
      })
    }
  }
  return { layer: layer, cost: erosionTotal }
}

/** Get the erosion damage for a cell */
export const useGetErosionDamage = (cell: string, erosion: string, year: number, adaptation: string): number | null => {
  const [buildings, setBuildings] = useState<FeatureCollection>() 
  
  useEffect(() => {
    fetch(`statiques/${cell}/batiments_${cell}.geojson`).then(f => f.json()).then(b => setBuildings(b)).catch(() => {
      // TODO
    })
  }, [cell])

  if (!buildings) {
    return null
  }

  let cost = 0

  for (const feature of buildings.features) {
    // Look up key
    const key = erosion.replace("ery", "") + "_" + adaptation
    const value = feature.properties![key]
    if (value != "NA" && parseInt(value) <= year) {
      cost += feature.properties!.valeur_tot
    }
  }

  return cost
}
