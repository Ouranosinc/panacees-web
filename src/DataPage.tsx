import React, { useState } from "react"
import { CellMap } from "./CellMap"
import 'rc-slider/assets/index.css'
import Slider from "rc-slider"

/** Page that displays all data, including maps and indicators. Main page of app portion */
export const DataPage = (props: {}) => {
  const [year, setYear] = useState(2030)

  const [yearMarks] = useState<{ [value: number]: string }>(() => {
    const marks: { [value: number]: string } = {}
    for (let y = 2030 ; y <= 2100 ; y+=10) {
      marks[y] = "" + y
    }
    return marks
  })

  return <div>
    <div style={{ padding: 10, paddingBottom: 40 }}>
      <div>Year</div>
      <Slider 
        min={2030} 
        step={10}
        max={2100} 
        value={year} 
        onChange={setYear}  
        marks={yearMarks}
        />
    </div>

    <CellMap
      adaptation="sansadapt"  
      cell="deMetissurMer"
      erosion="med"
      submersion="3"
      year={year + ""}
      />
  </div>
}