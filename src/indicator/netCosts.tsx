import _ from 'lodash'
import { Options as ChartOptions, SeriesBarOptions } from "highcharts"
import React, { useState, useEffect } from "react"
import { Highchart } from "./Highchart"
import { Adaptation } from "../params"
import { csv } from 'd3-fetch'

export const NetCostsChart = (props: {
  adaptations: Adaptation[]
  cell: string
  year: string
  erosion: string
}) => {
  const [data, setData] = useState<any[]>()

  // Load data
  useEffect(() => {
    csv(`/indicateurs/couts_nets_actualises_${props.cell}.csv`).then((d) => {
      setData(d)
    })
  }, [props.cell])

  if (!data) {
    return null
  }

  // Filter data by year + erosion
  // TODO ery
  let filtered = data.filter(d => d.scenario == props.erosion.replace("ery", "") && d.year == props.year)

  // Sort by impacts
  filtered = _.sortBy(filtered, f => f.impacts)

  // Get series (one for each impact)
  const impacts = _.uniq(data.map(d => d.impacts))
  let series = impacts.map(impact => {
    return ({
      name: impact,
      data: props.adaptations.map(adaptation => {
        const row = filtered.find(d => d.mesure == adaptation.id && d.impacts == impact)
        if (row) {
          return Math.round(parseFloat(row.value))
        }
        return 0
      }),
      stacking: "stream"
    }) 
  }) as SeriesBarOptions[]

  const chartOptions: ChartOptions = {
    chart: {
      type: "bar"
    },
    title: {
      text: "Coûts Nets Actualisés"
    },
    xAxis: {
      categories: props.adaptations.map(adaptation => adaptation.name)
    },
    yAxis: {
      title: {
        text: "Coûts"
      }
    },
    series: [
      {
        name: "Impacts économiques",
        data: [1, 4],
        stacking: "stream"
      },
      {
        name: "Impacts environnementaux",
        data: [1, 4],
        stacking: "stream"
      }
    ] as SeriesBarOptions[]
  }

  console.log(chartOptions.series)
  console.log(series)
  chartOptions.series = series

  return <Highchart chartOptions={chartOptions} />
}