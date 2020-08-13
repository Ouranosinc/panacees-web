// Splits the csv files into small parts by cell and adaptation
const fs = require('fs')
const path = require('path')
const CsvParser = require('./CsvParser')

/** Convert an array representing a row to a string */
function csvifyRow(input) {
  return input.map(cell => '"' + ((cell + "").replace('"', '\"')) + '"').join(",") + "\n"
}

// /** Fix adaptations file - DONE IN ORIGINAL */
// async function adaptations() {
//   // This is semicolon delimited for some reason
//   const parser = new CsvParser("input_data/adaptations.csv", ";")
//   const rows = await parser.readAll()

//   let contents = csvifyRow(["id", "name", "description"])
//   for (const row of rows) {
//     contents += csvifyRow([row.id, row.nom, row.description])
//   }
//   fs.writeFileSync("public/data/adaptations.csv", contents)
// }

/** Split adaptations_disponibles.csv (which adaptations are available per cell) */
async function adaptations_available() {
  const parser = new CsvParser("input_data/adaptations_disponibles.csv")

  let n = 0
  while (true) {
    const row = await parser.read()
    if (!row) {
      break
    }

    if ((n % 100000) == 0) {
      console.log(n)
    }

    outputDir = `public/data/cells/${row.ID_field}`

    // Create output dir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }

    // Write to file
    const filepath = path.join(outputDir, `adaptations_disponibles.csv`)

    // Append to file
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, csvifyRow(["adaptation"]))
    }
  
    fs.appendFileSync(filepath, csvifyRow([row.adaptations]))

    n += 1
  }
}

/** Split affichage_adaptations (where adaptations are applicable per ID which is a segment of the coast) */
async function adaptations_applicable() {
  const parser = new CsvParser("input_data/affichage_adaptations.csv")

  let n = 0
  while (true) {
    const row = await parser.read()
    if (!row) {
      break
    }

    if ((n % 100000) == 0) {
      console.log(n)
    }

    outputDir = `public/data/cells/${row.ID_field}`
    
    // Create output dir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }

    // Write to file
    const filepath = path.join(outputDir, `affichage_adaptations.csv`)

    // Append to file
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, csvifyRow(["ID", "adaptation"]))
    }
  
    fs.appendFileSync(filepath, csvifyRow([row.ID, row.adaptations]))

    n += 1
  }
}

/** Split hauteur.csv (which heights per scenario are likley per cell) */
async function heights() {
  const parser = new CsvParser("input_data/hauteur.csv")

  let n = 0
  while (true) {
    const row = await parser.read()
    if (!row) {
      break
    }

    if ((n % 100000) == 0) {
      console.log(n)
    }

    outputDir = `public/data/cells/${row.ID_field}`

    // Create output dir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }

    // Write to file
    const filepath = path.join(outputDir, `hauteur.csv`)

    // Append to file
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, csvifyRow(['value', 'scenario', 'frequence']))  
    }
  
    fs.appendFileSync(filepath, csvifyRow([row.value, row.scenario, row.frequence]))

    n += 1
  }
}


async function couts_adaptations() {
  const parser = new CsvParser("input_data/couts_adaptations.csv")

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

    const filepath = path.join(outputDir, `couts_adaptations_${row.erosion}.csv`)

    // Append to file
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, csvifyRow(['adaptation', 'type', 'secteur', 'year', 'value']))
    }

    fs.appendFileSync(filepath, csvifyRow([row.mesures, row.type, row.secteur, row.year, row.value]))

    n += 1
  }
}

/** Split damages into submersion and erosion and then by cell + erosion and cell + erosion + submersion (for submersion damage) */
async function damages_by_cell() {
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
      n += 1
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
        fs.writeFileSync(filepath, csvifyRow(['secteur', 'type', 'year', 'adaptation', 'value']))
      }
  
      fs.appendFileSync(filepath, csvifyRow([row.secteur, row.type, row.year, row.mesures, row.value]))
    }
    else {
      // Convert submersion field to consistent, short format
      const submersionLevels = row.submersion.match(/(?<=h)(max|moy|min)/g)
      const filepath = path.join(outputDir, `dommages_submersion_${row.erosion}_2${submersionLevels[0]}_20${submersionLevels[1]}_100${submersionLevels[2]}.csv`)

      // Append to file
      if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, csvifyRow(['secteur', 'type', 'year', 'adaptation', 'value']))
      }

      fs.appendFileSync(filepath, csvifyRow([row.secteur, row.type, row.year, row.mesures, row.value]))
    }

    n += 1
  }
}

/** Summarize damages by MRC + cell + erosion + submersion scenario and year */
async function damages_by_mrc() {
  const parser = new CsvParser("input_data/dommages_totaux.csv")

  let n = -1
  while (true) {
    const row = await parser.read()
    if (!row) {
      break
    }
    n += 1

    if ((n % 100000) == 0) {
      console.log(n)
    }
    
    // Skip empty values for speed
    const value = parseFloat(row.value)
    if (value == 0) {
      continue
    }

    // Skip non-status quo as these are not displayed at the MRC level
    if (row.mesures != "statuquo") {
      continue
    }

    // Parse MRC from ID_field
    const mrc = row.ID_field.split("_")[0]

    outputDir = `public/data/mrcs/${mrc}`
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
        fs.writeFileSync(filepath, csvifyRow(['ID_field', 'secteur', 'type', 'year', 'adaptation', 'value']))
      }
  
      fs.appendFileSync(filepath, csvifyRow([row.ID_field, row.secteur, row.type, row.year, row.mesures, row.value]))
    }
    else {
      // Convert submersion field to consistent, short format
      const submersionLevels = row.submersion.match(/(?<=h)(max|moy|min)/g)
      const filepath = path.join(outputDir, `dommages_submersion_${row.erosion}_2${submersionLevels[0]}_20${submersionLevels[1]}_100${submersionLevels[2]}.csv`)

      // Append to file
      if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, csvifyRow(['ID_field', 'secteur', 'type', 'year', 'adaptation', 'value']))
      }

      fs.appendFileSync(filepath, csvifyRow([row.ID_field, row.secteur, row.type, row.year, row.mesures, row.value]))
    }
  }
}

async function run() {
  // await adaptations()
  await adaptations_available()
  await adaptations_applicable()
  await heights()
  await couts_adaptations()
  await damages_by_mrc()
  await damages_by_cell()
}

run().catch(error => { throw error })