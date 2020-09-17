import { Popover, OverlayTrigger } from 'react-bootstrap'
import React from 'react'
import { Placement } from 'react-bootstrap/esm/Overlay'
 
/** Shows a popover when help icon is clicked. Needs bootstrap */
export class PopoverHelpComponent extends React.Component<{
  placement?: Placement
}> {
  render() {
    const overlay = <Popover id="help">
      <div style={{ padding: 10 }}>
        {this.props.children}
      </div>
    </Popover>

    return <OverlayTrigger 
      rootClose
      trigger={["click", "focus"]}
      placement={this.props.placement || "right"}
      overlay={overlay}>
      <span style={{ cursor: "pointer", paddingLeft: 5, paddingRight: 5, color: "#8e9aa5" }}>
        <i className="fa fa-question-circle"/>
      </span>
    </OverlayTrigger>
  }   
}
