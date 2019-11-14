import React, { useState } from "react"
import { CellMap } from "./CellMap"
import 'rc-slider/assets/index.css'
import Slider from "rc-slider"

/** Page that displays all data, including maps and indicators. Main page of app portion */
export const DataPage = (props: {}) => {
  const [year, setYear] = useState(2030)
  const [erosion, setErosion] = useState("med")
  const [submersion, setSubmersion] = useState(0)

  const [yearMarks] = useState<{ [value: number]: string }>(() => {
    const marks: { [value: number]: string } = {}
    for (let y = 2030 ; y <= 2100 ; y+=10) {
      marks[y] = "" + y
    }
    return marks
  })

  return <div>
    <div style={{ padding: 10, paddingBottom: 40 }}>
      <div className="text-muted">Année</div>
      <Slider 
        min={2030} 
        step={10}
        max={2100} 
        value={year} 
        onChange={setYear}  
        marks={yearMarks}
        />
    </div>

    <div style={{ padding: 10, paddingBottom: 40 }}>
      <div className="text-muted">Submersion</div>
      <Slider 
        min={0} 
        max={10} 
        value={submersion} 
        onChange={setSubmersion}  
        marks={{ 0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10" }}
        />
    </div>

    <div>
      <span className="text-muted">Erosion&nbsp;</span>
      <select value={erosion} onChange={(ev) => setErosion(ev.target.value)} className="form-control form-control-sm" style={{ width: "auto", display: "inline-block"}}>
        <option value="verylow">Très Bas</option>
        <option value="low">Bas</option>
        <option value="med">Moyen</option>
        <option value="high">Élevé</option>
        <option value="veryhigh">Très Élevé</option>
      </select>
    </div>

    <CellMap
      adaptation="sansadapt"  
      cell="deMetissurMer"
      erosion={erosion}
      submersion={submersion + ""}
      year={year + ""}
      />
  </div>
}