// Splits a geojson file by ID_field

const fs = require('fs')
const path = require('path')
const _ = require('lodash')

// Load file from input_data
const geojson = JSON.parse(fs.readFileSync("input_data/" + process.argv[2] + ".geojson"))

// Get unique cells
const cells = _.uniq(geojson.features.map(f => f.properties.ID_field))

console.log("Splitting " + process.argv[2])

for (const cell of cells) {
  // Create geojson
  const cellgeo = {
    type: "FeatureCollection",
    features: geojson.features.filter(f => f.properties.ID_field == cell)
  }

  // Create output directory
  outputDir = `public/data/cells/${cell}`

  // Create output dir
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  fs.writeFileSync(path.join(outputDir, process.argv[2] + ".geojson"), JSON.stringify(cellgeo, null, 2))
}

