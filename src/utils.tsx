import _ from 'lodash'
import { useState, useEffect, FC, useRef } from "react"
import { GeoJsonObject, Feature, Point, FeatureCollection, MultiPoint } from 'geojson'
import { csv } from 'd3'
import React from "react"
import centroid from '@turf/centroid'
import FileSaver from 'file-saver'

/** Format currency for French Canada */
export function formatCurrency(value: number | null | undefined | string) {
  if (value == null || value == "") {
    return ""
  }
  if (typeof(value) == "string") {
    value = parseFloat(value)
  }
  return Math.round(value).toLocaleString("fr", { style: "currency", currency: "CAD" }).replace("CA", "").replace(",00", "")
}

/** React hook to load a JSON file. Returns [result | undefined, loading: boolean]. Can load multiple times and ensures latest is always returned */
export function useLoadJson<T>(url: string, onLoad?: (data: T) => void, onError?: () => void): [T | undefined, boolean] {
  const [data, setData] = useState<T>()
  const loadingCount = useRef(0)

  // Track current url to prevent stale data
  const currentUrl = useRef(url)

  useEffect(() => {
    // Set current URL
    currentUrl.current = url

    // Increment loading count
    loadingCount.current += 1

    fetch(url).then(response => response.text()).then(text => {
      loadingCount.current -= 1

      // Ignore if stale
      if (url != currentUrl.current) {
        return
      }

      // Handle strange case of webpack dev server returning HTML instead of 404
      if (text.startsWith("<!DOCTYPE html>")) {
        setData(undefined)
        return
      }
      
      const d = JSON.parse(text)
      setData(d)
      if (onLoad) {
        onLoad(d)
      }
    }).catch((err) => {
      loadingCount.current -= 1

      // Ignore if stale
      if (url != currentUrl.current) {
        return
      }

      console.error(err)

      if (onError) {
        onError()
      }
    })
  }, [url])

  return [data, loadingCount.current > 0]
}

/** React hook to load a CSV file. If fails to load, returns [] */
export function useLoadCsv<T>(url: string, processRow?: (data: any) => T, onError?: () => void): [T[] | undefined, boolean] {
  const [data, setData] = useState<T[]>()
  const loadingCount = useRef(0)

  // Track current url to prevent stale data
  const currentUrl = useRef(url)

  useEffect(() => {
    // Set current URL
    currentUrl.current = url

    // Increment loading count
    loadingCount.current += 1

    csv(url, processRow as any).then((rows) => {
      loadingCount.current -= 1

      // Ignore if stale
      if (url != currentUrl.current) {
        return
      }
            
      // Handle strange case of webpack dev server returning HTML instead of 404
      if (rows[0] && rows[0]["<!DOCTYPE html>"]) {
        setData([])
        return
      }
      setData(rows as any)
    }).catch((err) => {
      loadingCount.current -= 1
      setData([])

      // Ignore if stale
      if (url != currentUrl.current) {
        return
      }
      
      if (onError) {
        onError()
      }
    })
  }, [url])

  return [data, loadingCount.current > 0]
}

/** Checkbox with big box */
export const Checkbox: FC<{ value: boolean, onChange: (value: boolean) => void }> = (props) => {
  return <div onClick={() => { props.onChange(!props.value) }} style={{ cursor: "pointer" }}>
    { props.value ?
      <i className="text-primary fa fa-fw fa-check-square"/>
    : <i className="text-muted fa fa-fw fa-square"/>
    }
    &nbsp;
    {props.children}
  </div>
}

/** Converts feature coordinates for points */
export function convertFeatureToCoords(feature: Feature<Point | MultiPoint>): [number, number] {
  return feature.geometry.type == "MultiPoint" ? 
    [feature.geometry.coordinates[0][1], feature.geometry.coordinates[0][0]] : 
    [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]
}

export function convertFeatureToPoint(feature: Feature): Feature<Point> {
  return {
    type: "Feature",
    properties: feature.properties,
    geometry: centroid(feature).geometry
  }
}

/** Convert an array representing a row to a string */
function csvifyRow(input: any[]) {
  return input.map(cell => '"' + ((cell + "").replace('"', '\"')) + '"').join(",") + "\n"
}

/** Download the data as CSV */
export function downloadData(filename: string, headers: string[], rows: any[][]) {
  let csv = ''

  csv += csvifyRow(headers)
  for (const row of rows) {
    csv += csvifyRow(row)
  }

  const blob = new Blob([csv], {type: "text/csv"});
  FileSaver.saveAs(blob, filename)
}

/** Sum the "value" field for all rows, keeping keys distinct */
export function sumValues<T>(rows: T[], uniq: (r: T) => string): T[] {
  const groups = _.groupBy(rows, uniq)

  return _.map(_.values(groups), (g: any[]) => {
    const ret = _.clone(g[0])
    ret.value = _.sum(g.map(g => g.value))
    return ret
  })
}