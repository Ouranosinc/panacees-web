import { Popover, OverlayTrigger } from 'react-bootstrap'
import React from 'react'
 
/** Shows a popover when help icon is clicked. Needs bootstrap */
export class PopoverHelpComponent extends React.Component<{}> {
  render() {
    const overlay = <Popover id="help">
      <div style={{ padding: 10 }}>
        {this.props.children}
      </div>
    </Popover>

    return <OverlayTrigger 
      trigger={["hover", "focus"]}
      placement={"right"}
      overlay={overlay}>
      <span className="text-muted" style={{ cursor: "pointer", paddingLeft: 5, paddingRight: 5 }}>
        <i className="fa fa-question-circle"/>
      </span>
    </OverlayTrigger>
  }   
}
