import { default as pointInPolygon } from '@turf/boolean-point-in-polygon'

// 3400ms submersion, 128ms erosion
const calculateCost = async () => {
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

export default calculateCost