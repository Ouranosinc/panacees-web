const fs = require('fs')
const csvParse = require('csv-parse')

// Parse a CSV file using promise-based async-compatible read function
module.exports = class CsvParser {
  constructor(filename, delimeter) {
    this.parser = csvParse({ columns: true, delimiter: delimeter })
    fs.createReadStream(filename).pipe(this.parser)
    this.parser.on("end", () => this.ended = true)
  }

  read() {
    return new Promise((resolve, reject) => {
      // Try direct read
      var item = this.parser.read()
      if (item) {
        resolve(item)
        return
      }
      // If ended
      if (this.ended) {
        resolve(null)
        return
      }
      // Wait for readable
      var _this = this
      function readable() {
        var item = _this.parser.read()
        resolve(item)
      }
      this.parser.once("readable", readable)
    })
  }

  /** Read all rows */
  async readAll() {
    const rows = []
    while (true) {
      const row = await this.read()
      if (!row) {
        return rows
      }
      rows.push(row)
    }
  }
}

