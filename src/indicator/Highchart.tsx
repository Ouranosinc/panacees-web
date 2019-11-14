import React, { useEffect } from 'react'
import Highcharts, { Options } from 'highcharts'
import { useCallback, useRef } from 'react'

/** Displays a highchart within a div */
export const Highchart = (props: { chartOptions: Options, style?: React.CSSProperties }) => {
  const chart = useRef<Highcharts.Chart>()

  const chartRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      chart.current = Highcharts.chart(node, props.chartOptions)
    }
    else if (chart.current) {
      chart.current.destroy()
      chart.current = undefined
    }
  }, [])

  useEffect(() => {
    if (chart.current) {
      chart.current.update(props.chartOptions)
    }
  }, [props.chartOptions])

  return <div ref={chartRef} style={props.style}/>
}
