// Splits a geojson file by ID_field (first part which is the mrc)

const fs = require('fs')
const path = require('path')
const _ = require('lodash')

// Load file from input_data
const geojson = JSON.parse(fs.readFileSync("input_data/" + process.argv[2] + ".geojson"))

// Get unique mrcs
const mrcs = _.uniq(geojson.features.map(f => f.properties.ID_field.split("_")[0]))

console.log("Splitting " + process.argv[2])

for (const mrc of mrcs) {
  // Create geojson
  const mrcgeo = {
    type: "FeatureCollection",
    features: geojson.features.filter(f => f.properties.ID_field.split("_")[0] == mrc)
  }

  // Create output directory
  outputDir = `public/data`

  fs.writeFileSync(path.join(outputDir, process.argv[2] + "_" + mrc + ".geojson"), JSON.stringify(mrcgeo, null, 2))
}

