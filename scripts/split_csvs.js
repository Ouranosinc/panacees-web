// Splits the csv files into small parts by cell and adaptation
const fs = require('fs')
const path = require('path')
const CsvParser = require('./CsvParser')

async function couts_adaptations() {
  const parser = new CsvParser("input_data/couts_adaptation.csv")

  let n = 0
  while (true) {
    const row = await parser.read()
    if (!row) {
      break
    }

    if ((n % 100000) == 0) {
      console.log(n)
    }

    const value = parseFloat(row.value)
    if (value == 0) {
      n += 1
      continue
    }

    outputDir = `public/data/cells/${row.ID_field}`

    // Create output dir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }

    const filepath = path.join(outputDir, `couts_adaptation_${row.erosion}.csv`)

    // Append to file
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, `mesures,type,secteur,year,value\n`)  
    }

    fs.appendFileSync(filepath, `${row.mesures},${row.type},${row.secteur},${row.year},${row.value}\n`)

    n += 1
  }
}

async function dommages_totaux() {
  const parser = new CsvParser("input_data/dommages_totaux.csv")

  let n = 0
  while (true) {
    const row = await parser.read()
    if (!row) {
      break
    }

    if ((n % 100000) == 0) {
      console.log(n)
    }

    // Skip empty values for speed
    const value = parseFloat(row.value)
    if (value == 0) {
      continue
    }

    outputDir = `public/data/cells/${row.ID_field}`
    // Create output dir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }

    // Handle erosion values
    if (row.submersion == "sub") {
      // Ensure that not wrong row type
      if (row.alea == "Submersion") {
        throw new Error("Unexpected submersion row on line " + n)
      }

      // Write to erosion file
      const filepath = path.join(outputDir, `dommages_erosion_${row.erosion}.csv`)

      // Append to file
      if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, `secteur,type,year,mesures,value\n`)  
      }
  
      fs.appendFileSync(filepath, `${row.secteur},${row.type},${row.year},${row.mesures},${row.value}\n`)
    }
    else {
      // Convert submersion field to consistent, short format
      const hauteurs = row.submersion.match(/h(max|moy|min)/g)
      const filepath = path.join(outputDir, `dommages_submersion_${row.erosion}_2${hauteurs[0]}_20${hauteurs[1]}_100${hauteurs[2]}.csv`)

      // Append to file
      if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, `secteur,type,year,mesures,value\n`)  
      }

      fs.appendFileSync(filepath, `${row.secteur},${row.type},${row.year},${row.mesures},${row.value}\n`)
    }

    n += 1
  }
}

async function run() {
  await couts_adaptations()
  await dommages_totaux()
}

run().catch(error => { throw error })