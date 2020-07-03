import _ from 'lodash'
import { Options as ChartOptions, SeriesBarOptions } from "highcharts"
import React, { useState, useEffect } from "react"
import { Highchart } from "./Highchart"
import { Adaptation } from "../params"
import { csv } from 'd3'
import { FillHeight } from '../FillHeight'

export const NetCostsByYearChart = (props: {
  adaptations: Adaptation[]
  cell: string
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

  // Calculate absolute max so axis doesn't change
  const groups = _.groupBy(data, d => d.mesure + ":" + d.scenario + ":" + d.year)
  const max = _.max(_.values(groups).map(group => _.sum(group.map(d => parseFloat(d.value)))))
  
  // Filter data by year + erosion
  // TODO ery
  let filtered = data.filter(d => d.scenario == props.erosion.replace("ery", ""))

  const years = [2020, 2030, 2040, 2050, 2060, 2070, 2080, 2090, 2100]

  // Get series (one for each adaptation)
  let series = props.adaptations.map(adaptation => {
    return ({
      name: adaptation.nom,
      data: years.map(year => {
        const rows = filtered.filter(d => d.mesure == adaptation.id && d.year == year + "")
        return Math.round(_.sum(rows.map(row => parseFloat(row.value))))
      })
    }) 
  }) as SeriesBarOptions[]

  const chartOptions: ChartOptions = {
    chart: {
      type: "line"
    },
    title: {
      text: "Coûts Nets Actualisés"
    },
    plotOptions: {
      series: {
        label: {
            connectorAllowed: false
        },
        pointStart: 2020,
        pointInterval: 10
      }
    },    
    yAxis: {
      title: {
        text: "Coûts"
      },
      max: max
    },
    series: series
  }

  chartOptions.series = series

  return <FillHeight>
    {(height) => <Highchart chartOptions={chartOptions} style={{height: height, padding: 40}}/>}
  </FillHeight>
}
