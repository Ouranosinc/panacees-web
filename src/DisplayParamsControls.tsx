import { useMemo, FC, ReactNode, CSSProperties } from "react"
import React from "react"
import Slider from "rc-slider"
import { DisplayParams } from "./DisplayParams"
import produce from 'immer'
import { Adaptation } from "./params"
import { PopoverHelpComponent } from "./PopoverHelp"
import ReactSelect, { FormatOptionLabelMeta } from 'react-select'

/** Display parameter controls displayed on left panel */
export const DisplayParamsControls = (props: {
  params: DisplayParams
  onChange: (params: DisplayParams) => void

  adaptations: Adaptation[]

  /** Which controls to disable */
  disabled: ("year" | "submersion" | "erosion" | "adaptation")[]

  /** Heights to display (optional) */
  heights?: {
    scenario: "min" | "moy" | "max"
    frequence: "h2ans" | "h20ans" | "h100ans"
    value: number
  }[]
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

  /** Options if no heights available */
  const baseSubmersionOptions = [
    { value: "min", label: "Min" },
    { value: "moy", label: "Moy" },
    { value: "max", label: "Max" }
  ]

  const getSubmersionOptions = (frequence: "h2ans" | "h20ans" | "h100ans") => {
    const heightMin = props.heights!.find(row => row.scenario == "min" && row.frequence == frequence)!.value
    const heightMoy = props.heights!.find(row => row.scenario == "moy" && row.frequence == frequence)!.value
    const heightMax = props.heights!.find(row => row.scenario == "max" && row.frequence == frequence)!.value
    return [
      { value: "min", label: heightMin.toFixed(2) + "m" },
      { value: "moy", label: heightMoy.toFixed(2) + "m" },
      { value: "max", label: heightMax.toFixed(2) + "m" }
    ]
  }

  const submersion2Options = props.heights ? getSubmersionOptions("h2ans") : baseSubmersionOptions
  const submersion20Options = props.heights ? getSubmersionOptions("h20ans") : baseSubmersionOptions
  const submersion100Options = props.heights ? getSubmersionOptions("h100ans") : baseSubmersionOptions

  const adaptation = props.adaptations.find(a => a.id == params.adaptation)

  const formatAdaptationOption = (option: Adaptation, labelMeta: FormatOptionLabelMeta<Adaptation>) => {
    return labelMeta.context == "value" ? option.nom : <span>{option.nom} - <span style={{ fontSize: 11 }}>{option.description}</span></span>
  }

  const reactSelectStyles = {
    menuPortal: (style: CSSProperties) => ({ ...style, zIndex: 2000 })
  }

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
      title={<span>
        Mesure d'Adaptation:
        <PopoverHelpComponent>
          { adaptation ? adaptation.description : "Selectionner une adaptation"}
        </PopoverHelpComponent>
      </span>}>
        <div style={{ paddingLeft: 5, paddingRight: 5 }}>
          <ReactSelect
            options={props.adaptations}
            onChange={option => { if (option) { setParam(p => p.adaptation = (option as any).id) }}}
            value={props.adaptations.find(a => a.id == params.adaptation)}
            styles={reactSelectStyles}
            menuPortalTarget={document.body}
            formatOptionLabel={formatAdaptationOption}
            getOptionLabel={opt => opt.nom}
            getOptionValue={opt => opt.id}
          />
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
            <option value="vlow">Très optimiste (TR/an * 0,5)</option>
            <option value="low">Optimiste (TR/an * 0,75)</option>
            <option value="med">Moyen (TR/an)</option>
            <option value="high">Pessimiste (TR/an * 1,25)</option>
            <option value="vhigh">Très pessimiste (TR/an * 1,5)</option>
          </select>
          <PopoverHelpComponent>
            Les scénarios d’érosion modélisés dans PANACÉES sont extrapolés des données fournies par le Laboratoire de dynamique et de gestion intégrée des zones côtières (LDGIZC) de l’Université de Québec à Rimouski (UQAR). Le taux de recul moyen annuel (TR/an) par segment côtier homogène a été décliné en cinq scénarios. 
            Pour plus de détails, consultez le <a href="#/guide">guide de l'usager.</a>
          </PopoverHelpComponent>
        </div>
    </CellControl>

    <CellControl 
      title={<span>
          Submersion:
          <PopoverHelpComponent>
            Les scénarios de submersion modélisés dans PANACÉES sont extrapolés des données observées des inondations côtières survenues lors de la tempête du 6 décembre 2010. Ils inclut la hausse graduelle du niveau de la mer et la probabilité qu’un niveau d’eau lors d’onde de tempête pourrait engendrer des dommages à tous les 2, 20 ou 100 ans. 
            <ul>
              <li>2 ans : Scénario selon lequel le niveau d'eau minimum (min), moyen (moy) ou maximum (max) a une chance sur deux de se produire chaque année (50%).</li>
              <li>20 ans : Scénario selon lequel le niveau d'eau minimum (min), moyen (moy) ou maximum (max) a une chance sur vingt de se produire chaque année (5%).</li>
              <li>100 ans : Scénario selon lequel le niveau d'eau minimum (min), moyen (moy) ou maximum (max) a une chance sur cent de se produire chaque année (1%).</li>
            </ul>
            Pour plus de détails consultez le <a href="#/guide">guide de l'usager.</a>
          </PopoverHelpComponent>
        </span>}
      disabled={props.disabled.includes("submersion")}>
          <div style={{ paddingLeft: 20, paddingTop: 10 }}>
            <div style={{ paddingBottom: 5 }}>
              <div className="submersion-freq-title">2 ans:</div>
              <Toggle 
                options={submersion2Options}
                value={params.submersion2Y} 
                onChange={level => setParam(p => p.submersion2Y = level)}
              />
            </div>
            <div style={{ paddingBottom: 5 }}>
              <div className="submersion-freq-title">20 ans:</div>
              <Toggle 
                options={submersion20Options}
                value={params.submersion20Y} 
                onChange={level => setParam(p => p.submersion20Y = level)}
              />
            </div>
            <div style={{ paddingBottom: 5 }}>
              <div className="submersion-freq-title">100 ans:</div>
              <Toggle 
                options={submersion100Options}
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
        key={option.value}
        type="button" 
        className={ props.value == option.value ? "btn btn-primary btn-sm active" : "btn btn-outline-primary btn-sm" }
        onClick={() => props.onChange(option.value)}>{option.label}</button>
    })}
  </div>
}