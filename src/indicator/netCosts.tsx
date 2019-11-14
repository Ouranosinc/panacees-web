import Highcharts, { Options, SeriesBarOptions, HTMLDOMElement } from 'highcharts'
import { useCallback, useRef } from 'react'
import React from 'react'


export const SimpleChart = (props: {}) => {
  const chart = useRef<Highcharts.Chart>()

  const chartRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      const options: Options = {
        chart: {
            type: 'bar'
        },
        title: {
            text: 'Fruit Consumption'
        },
        xAxis: {
            categories: ['Apples', 'Bananas', 'Oranges']
        },
        yAxis: {
            title: {
                text: 'Fruit eaten'
            }
        },
        series: [{
            name: 'Jane',
            data: [1, 0, 4],
            stacking: "stream"
        }, {
            name: 'John',
            data: [5, 7, 3],
            stacking: "stream"
        }] as SeriesBarOptions[]
      }
      chart.current = Highcharts.chart(node, options)
    }
    else if (chart.current) {
      chart.current.destroy()
      chart.current = undefined
    }
  }, [])

  return <div ref={chartRef}/>
}
