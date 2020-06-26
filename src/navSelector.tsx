import { ReactNode } from "react"
import React from "react"

export const NavSelectorOld = (props: { 
  options: { value: string, label: ReactNode }[],
  value: string,
  onChange: (value: string) => void
}) => {
  return <div className="nav flex-column nav-pills">
    { props.options.map(option => {
      return <a 
        className={option.value == props.value ? "nav-link active" : "nav-link"}
        onClick={() => props.onChange(option.value)}
        style={{ cursor: "pointer" }}>{option.label}</a>
    })}
  </div>      
}

export const NavSelector = (props: { 
  options: { value: string, label: ReactNode }[],
  value: string,
  onChange: (value: string) => void
}) => {
  // Find active option
  const active = props.options.find(o => o.value == props.value)!

  return <div className="dropdown" style={{ marginTop: 5, marginBottom: 10 }}>
    <button className="btn btn-primary btn-block dropdown-toggle" type="button" data-toggle="dropdown" style={{ textAlign: "left" }}>
      { active.label }
    </button>
    <div className="dropdown-menu">
      { props.options.map(option => (
        <a className="dropdown-item" onClick={() => props.onChange(option.value)}>{option.label}</a>
      ))}
    </div>
  </div>
}
