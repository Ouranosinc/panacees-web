import { useMemo } from "react"
import React from "react"
import Slider from "rc-slider"

export const CellControls = (props: {
  year: number
  setYear: (year: number) => void
  
  submersion: number
  setSubmersion: (submersion: number) => void

  erosion: string
  setErosion: (erosion: string) => void

  adaptation: string
  setAdaptation: (adaptation: string) => void
}) => {
  const yearMarks = useMemo<{ [value: number]: string }>(() => {
    const marks: { [value: number]: string } = {}
    for (let y = 2030 ; y <= 2100 ; y+=10) {
      marks[y] = "" + y
    }
    return marks
  }, [])

  return <div>
    <div className="cell-control">
      <div className="cell-control-title">
        <i className="fa fa-calendar fa-fw"/> Année</div>
      <div className="cell-control-content-slider">
        <Slider 
          min={2030} 
          step={10}
          max={2100} 
          value={props.year} 
          onChange={props.setYear}  
          marks={yearMarks}
          />
      </div>
    </div>

    <div className="cell-control">
      <div className="cell-control-title">Adaptation:</div>
      <div className="cell-control-content-inline">
        <select 
          value={props.adaptation} 
          onChange={(ev) => props.setAdaptation(ev.target.value)} 
          className="form-control form-control-sm" 
          style={{ width: "auto", display: "inline-block"}}>
          <option value="sansadapt">Sans Adaptation</option>
          <option value="statuquo">Statu Quo</option>
        </select>
      </div>
    </div>

    <div className="cell-control">
      <div className="cell-control-title">Erosion:</div>
      <div className="cell-control-content-inline">
        <select 
          value={props.erosion} 
          onChange={(ev) => props.setErosion(ev.target.value)} 
          className="form-control form-control-sm" 
          style={{ width: "auto", display: "inline-block"}}>
          <option value="verylow">Très Bas</option>
          <option value="low">Bas</option>
          <option value="med">Moyen</option>
          <option value="high">Élevé</option>
          <option value="veryhigh">Très Élevé</option>
        </select>
      </div>
    </div>

    <div className="cell-control">
      <div className="cell-control-title">Submersion (mètres)</div>
      <div className="cell-control-content-slider">
        <Slider 
          min={0} 
          max={10} 
          value={props.submersion} 
          onChange={props.setSubmersion}  
          marks={{ 0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10" }}
          />
      </div>
    </div>

  </div>
}