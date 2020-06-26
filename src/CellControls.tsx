import { useMemo, FC, ReactNode } from "react"
import React from "react"
import Slider from "rc-slider"
import { DisplayParams } from "./DisplayParams"
import produce from 'immer'

/** Controls displayed on left panel for a specific cell */
export const CellControls = (props: {
  params: DisplayParams
  onChange: (params: DisplayParams) => void

  /** Which controls to disable */
  disabled: ("year" | "submersion" | "erosion" | "adaptation")[]
}) => {
  const params = props.params

  /** Set a value on a param by mutating p */
  const setParam = (action: (p: DisplayParams) => void) => {
    props.onChange(produce(params, draft => { action(draft) }))
  }

  const yearMarks = useMemo<{ [value: number]: string }>(() => {
    const marks: { [value: number]: string } = {}
    for (let y = 2020 ; y <= 2100 ; y+=10) {
      marks[y] = "" + y
    }
    return marks
  }, [])

  const submersionOptions = [
    { value: "min", label: "Min" },
    { value: "moy", label: "Moy" },
    { value: "max", label: "Max" }
  ]

  return <div>
    <CellControl 
      title={[<i className="fa fa-calendar fa-fw"/>," Année"]}
      disabled={props.disabled.includes("year")}>
        <div style={{ paddingBottom: 25, paddingLeft: 20, paddingRight: 20, paddingTop: 5 }}>
          <Slider 
            min={2020} 
            step={10}
            max={2100} 
            value={props.params.year} 
            onChange={year => setParam(p => p.year = year)}  
            marks={yearMarks}
            />
        </div>
    </CellControl>

    <CellControl
      disabled={props.disabled.includes("adaptation")}
      title="Mesure d'Adaptation:">
        <div style={{ display: "inline-block", paddingLeft: 5 }}>
          <select 
            value={params.adaptation} 
            onChange={ev => setParam(p => p.adaptation = ev.target.value)} 
            className="form-control form-control-sm" 
            style={{ width: "auto", display: "inline-block"}}>
            <option value="sansadapt">Sans Adaptation</option>
            <option value="statuquo">Statu Quo</option>
          </select>
        </div>          
    </CellControl>

    <CellControl
      disabled={props.disabled.includes("erosion")}
      title="Erosion:">
        <div style={{ display: "inline-block", paddingLeft: 5 }}>
          <select 
            value={params.erosion} 
            onChange={ev => setParam(p => p.erosion = ev.target.value as any)} 
            className="form-control form-control-sm" 
            style={{ width: "auto", display: "inline-block"}}>
            <option value="verylow">Très Bas</option>
            <option value="low">Bas</option>
            <option value="med">Moyen</option>
            <option value="high">Élevé</option>
            <option value="veryhigh">Très Élevé</option>
          </select>
        </div>
    </CellControl>

    <CellControl 
      title="Submersion:"
      disabled={props.disabled.includes("submersion")}>
          <div style={{ paddingLeft: 20, paddingTop: 10 }}>
            <div style={{ paddingBottom: 5 }}>
              <div className="submersion-freq-title">2 ans:</div>
              <Toggle 
                options={submersionOptions}
                value={params.submersion2Y} 
                onChange={level => setParam(p => p.submersion2Y = level)}
              />
            </div>
            <div style={{ paddingBottom: 5 }}>
              <div className="submersion-freq-title">20 ans:</div>
              <Toggle 
                options={submersionOptions}
                value={params.submersion20Y} 
                onChange={level => setParam(p => p.submersion20Y = level)}
              />
            </div>
            <div style={{ paddingBottom: 5 }}>
              <div className="submersion-freq-title">100 ans:</div>
              <Toggle 
                options={submersionOptions}
                value={params.submersion100Y} 
                onChange={level => setParam(p => p.submersion100Y = level)}
              />
            </div>
          </div>
    </CellControl>
  </div>
}

const CellControl: FC<{ disabled: boolean, title: ReactNode }> = (props) => {
  return <div className={ props.disabled ? "cell-control disabled" : "cell-control"}>
    <div className="cell-control-title">{props.title}</div>
    {props.children}
  </div>
}

const Toggle = (props: {
  options: { value: any, label: ReactNode }[],
  value: any,
  onChange: (value: any) => void
}) => {
  return <div className="btn-group">
    {props.options.map(option => {
      return <button 
        type="button" 
        className={ props.value == option.value ? "btn btn-primary btn-sm active" : "btn btn-outline-primary btn-sm" }
        onClick={() => props.onChange(option.value)}>{option.label}</button>
    })}
  </div>
}