import React from "react"
import { FillHeight } from "./FillHeight"

/** Displays a centered spinner */
const LoadingComponent = (props: {}) => {
  return <FillHeight>
    {(height: number) => {
      return <div style={{
        width: "100%",
        height: height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}><div className="text-muted" style={{ fontSize: 30 }}><i className="fa fa-spinner fa-spin"/></div></div>
    }}
  </FillHeight>
}

export default LoadingComponent

