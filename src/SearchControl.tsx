import React from "react"

interface SearchControlProps {
  value: string
  onChange?: (value: string) => void
  placeholder?: string
}

/** Simple input box with magnifying glass */
export class SearchControl extends React.Component<SearchControlProps> {
  private inputRef = React.createRef<HTMLInputElement>()

  handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (this.props.onChange) {
      this.props.onChange(ev.target.value)
    }
  }

  focus() {
    if (this.inputRef.current) {
      this.inputRef.current.focus()
    }
  }

  render() {
    return (
      <div style={{ position: "relative", display: "inline-block", margin: 5 }}>
        <i className="fa fa-search" style={{ position: "absolute", right: 8, top: 10, color: "#AAA", pointerEvents: "none" }} />
        <input 
          type="text" 
          ref={this.inputRef}
          className="form-control" 
          style={{maxWidth: "20em"}} 
          value={this.props.value} 
          onChange={this.handleChange}
          placeholder={this.props.placeholder} />
    </div>
    )  
  }
}