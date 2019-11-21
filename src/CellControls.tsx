import { useMemo, FC, ReactNode } from "react"
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

  /** Which controls to disable */
  disabled: ("year" | "submersion" | "erosion" | "adaptation")[]
}) => {
  const yearMarks = useMemo<{ [value: number]: string }>(() => {
    const marks: { [value: number]: string } = {}
    for (let y = 2030 ; y <= 2100 ; y+=10) {
      marks[y] = "" + y
    }
    return marks
  }, [])

  return <div>
    <CellControl 
      title={[<i className="fa fa-calendar fa-fw"/>," Année"]}
      type="slider"
      disabled={props.disabled.includes("year")}>
        <Slider 
          min={2030} 
          step={10}
          max={2100} 
          value={props.year} 
          onChange={props.setYear}  
          marks={yearMarks}
          />
    </CellControl>

    <CellControl
      type="inline"
      disabled={props.disabled.includes("adaptation")}
      title="Mesure d'Adaptation:">
      <select 
        value={props.adaptation} 
        onChange={(ev) => props.setAdaptation(ev.target.value)} 
        className="form-control form-control-sm" 
        style={{ width: "auto", display: "inline-block"}}>
        <option value="sansadapt">Sans Adaptation</option>
        <option value="statuquo">Statu Quo</option>
      </select>
    </CellControl>

    <CellControl
      type="inline"
      disabled={props.disabled.includes("erosion")}
      title="Erosion:">
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
    </CellControl>

    <CellControl 
      title="Submersion (mètres)"
      type="slider"
      disabled={props.disabled.includes("submersion")}>
        <Slider 
          min={0} 
          max={10} 
          value={props.submersion} 
          onChange={props.setSubmersion}  
          marks={{ 0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10" }}
          />
    </CellControl>
  </div>
}

const CellControl: FC<{ disabled: boolean, type: "inline" | "slider", title: ReactNode }> = (props) => {
  return <div className={ props.disabled ? "cell-control disabled" : "cell-control"}>
    <div className="cell-control-title">{props.title}</div>
    <div className={"cell-control-content-" + props.type}>
      {props.children}
    </div>
  </div>
}