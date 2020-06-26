import React from "react"

/** Displays a centered spinner */
const LoadingComponent = (props: {}) => {
  return <div style={{
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}><div className="text-muted" style={{ fontSize: 30 }}><i className="fa fa-spinner fa-spin"/></div></div>
}

export default LoadingComponent

