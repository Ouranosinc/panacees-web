import _ from 'lodash'
import { Options as ChartOptions, SeriesBarOptions } from "highcharts"
import React from "react"
import { Highchart } from "./Highchart"
import { Adaptation } from "../params"
import { FillHeight } from '../FillHeight'
import { DisplayParams } from '../DisplayParams'
import { useLoadCsv } from '../utils'
import LoadingComponent from '../LoadingComponent'

export const NetCostsByYearChart = (props: {
  adaptations: Adaptation[]
  displayParams: DisplayParams
  cellId: string
}) => {
  // Load data
  const params = props.displayParams
  const [rawErosionDamages, rawErosionDamagesLoading] = useLoadCsv(
    `data/cells/${props.cellId}/dommages_erosion_${params.erosion}.csv`, 
    row => ({ ...row, year: +row.year, value: + row.value }))
  const [rawSubmersionDamages, rawSubmersionDamagesLoading] = useLoadCsv(
    `data/cells/${props.cellId}/dommages_submersion_${params.erosion}_2${params.submersion2Y}_20${params.submersion20Y}_100${params.submersion100Y}.csv`, 
    row => ({ ...row, year: +row.year, value: +row.value }))
  const [rawAdaptationCosts, rawAdaptationCostsLoading] = useLoadCsv(
    `data/cells/${props.cellId}/couts_adaptation_${params.erosion}.csv`, 
    row => ({ ...row, year: +row.year, value: +row.value }))

  if (!rawErosionDamages || !rawSubmersionDamages || !rawAdaptationCosts) {
    return <LoadingComponent/>
  }

  // Combine data into single list with year, value and adaptation
  let data: { adaptation: string, year: number, value: number }[] = []
  data = data.concat(rawErosionDamages.map(r => ({ adaptation: r.adaptation, year: r.year, value: r.value })))
  data = data.concat(rawSubmersionDamages.map(r => ({ adaptation: r.adaptation, year: r.year, value: r.value })))
  data = data.concat(rawAdaptationCosts.map(r => ({ adaptation: r.adaptation, year: r.year, value: r.value })))

  // Calculate absolute max so axis doesn't change
  // const groups = _.groupBy(data, d => d.adaptation + ":" + d.scenario + ":" + d.year)
  // const max = _.max(_.values(groups).map(group => _.sum(group.map(d => parseFloat(d.value)))))
  
  // Filter data by year + erosion
  // let filtered = data.filter(d => d.scenario == params.erosion.replace("ery", ""))

  const years = [2020, 2030, 2040, 2050, 2060, 2070, 2080, 2090, 2100]

  // Get series (one for each adaptation)
  let series = props.adaptations.map(adaptation => {
    return ({
      name: adaptation.nom,
      data: years.map(year => {
        const rows = data.filter(d => d.adaptation == adaptation.id && d.year == year)
        return Math.round(_.sum(rows.map(row => row.value)))
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
      // max: max TODO
    },
    series: series
  }

  chartOptions.series = series

  return <FillHeight>
    {(height) => <Highchart chartOptions={chartOptions} style={{height: height, padding: 40}}/>}
  </FillHeight>
}
