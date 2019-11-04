

const fs = require('fs')
const JSONStream = require('JSONStream')
const ora = require('ora');
 
const f = fs.createReadStream("/home/clayton/Downloads/panacees/erosion_statuquo.geojson")
// const f = fs.createReadStream("/home/clayton/Downloads/panacees/erosion_sansadaptation.geojson")

const geo = {
  "type": "FeatureCollection",
  "name": "erosion_statuquo",
  "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::32186" } },
  "features": []
}

const js = f.pipe(JSONStream.parse('features.*'))

const spinner = ora('').start()
 
js.on('data', (data) => {
  spinner.text = JSON.stringify(data.properties)

  if (data.properties.Cellule == 'de l\'Anse au Lard' && data.properties.ringId == 70) {
    console.log(data)
    geo.features.push(data)
    fs.writeFileSync("Anse au Lard - 70.geojson", JSON.stringify(geo, null, 2))
  }
})

js.on('end', () => {
  console.log("DONE!")
})