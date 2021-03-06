import _ from 'lodash'
import { Options as ChartOptions, SeriesBarOptions } from "highcharts"
import React from "react"
import { Highchart } from "./Highchart"
import { Adaptation } from "../params"
import { FillHeight } from '../FillHeight'
import { DisplayParams } from '../DisplayParams'
import { useLoadCsv, downloadData, sumValues } from '../utils'
import LoadingComponent from '../LoadingComponent'

export const NetCostsByTypeChart = (props: {
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
    `data/cells/${props.cellId}/couts_adaptations_${params.erosion}.csv`, 
    row => ({ ...row, year: +row.year, value: +row.value }))

  if (!rawErosionDamages || !rawSubmersionDamages || !rawAdaptationCosts) {
    return <LoadingComponent/>
  }

  // Combine data into single list with year, value and adaptation
  let data: { type: string, adaptation: string, year: number, value: number }[] = []
  data = data.concat(rawErosionDamages.map(r => ({ type: r.type, adaptation: r.adaptation, year: r.year, value: r.value })))
  data = data.concat(rawSubmersionDamages.map(r => ({ type: r.type, adaptation: r.adaptation, year: r.year, value: r.value })))
  data = data.concat(rawAdaptationCosts.map(r => ({ type: r.type, adaptation: r.adaptation, year: r.year, value: r.value })))
  
  // // Calculate absolute max so axis doesn't change
  // const groups = _.groupBy(data, d => d.year + ":" + d.adaptation)
  // const max = _.max(_.values(groups).map(group => _.sum(group.map(d => d.value))))

  // Filter data by year
  let filtered = data.filter(d => d.year <= params.year)

  // Create download
  const handleDownload = () => {
    downloadData(`couts_par_type.csv`, ["type", "adaptation", "valeur"], 
      // Only include ones with adaptation
      sumValues(filtered.filter(row => props.adaptations.find(a => a.id == row.adaptation) != null), 
        r => `${r.type}:${r.adaptation}`).map(row => [
          row.type,
          props.adaptations.find(a => a.id == row.adaptation)!.nom,
          row.value
        ])
      )
  }

  // Sort by type
  filtered = _.sortBy(filtered, f => f.type)

  // Get series (one for each type)
  const types = _.uniq(data.map(d => d.type))
  let series = types.map(type => {
    return ({
      name: type,
      data: props.adaptations.map(adaptation => {
        const rows = filtered.filter(d => d.adaptation == adaptation.id && d.type == type)
        return Math.round(_.sum(rows.map(row => row.value))) || 0
      }),
      stacking: "stream"
    }) 
  }) as SeriesBarOptions[]

  const chartOptions: ChartOptions = {
    chart: {
      type: "bar"
    },
    title: {
      text: "Valeur actuelle nette par indicateurs de dommage"
    },
    xAxis: {
      categories: props.adaptations.map(adaptation => adaptation.nom)
    },
    yAxis: {
      title: {
        text: "Coûts"
      },
      // max: max
    },
    series: [] as SeriesBarOptions[]
  }

  chartOptions.series = series

  return <FillHeight>
    {(height) => 
      <div style={{ position: "relative" }}>
        <Highchart chartOptions={chartOptions} style={{height: height, padding: 40}}/>
        <div style={{ position: "absolute", right: 10, top: 10 }}>
          <button className="btn btn-link btn-sm" onClick={handleDownload}>
            <i className="fa fa-download"/> Télécharger
          </button>
        </div>
      </div>
    }
  </FillHeight>
}
