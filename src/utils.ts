import { useState, useEffect } from "react";
import { csv } from 'd3-fetch'

/** React hook to load a JSON file */
export function useLoadJson<T>(url: string, onLoad?: (data: T) => void, onError?: () => void): T | undefined {
  const [data, setData] = useState<T>()

  useEffect(() => {
    fetch(url).then(response => response.json()).then(d => {
      console.log("Loaded " + url)

      setData(d)
      if (onLoad) {
        onLoad(d)
      }
    }).catch((err) => {
      console.error(err)

      if (onError) {
        onError()
      }
    })
  }, [url])

  return data
}

/** React hook to load a CSV file */
export function useLoadCsv<T>(url: string, processRow?: (data: any) => T, onError?: () => void): T[] | undefined {
  const [data, setData] = useState<T[]>()

  useEffect(() => {
    csv(url, processRow as any).then((rows) => {
      setData(rows as any)
    }).catch((err) => {
      console.error(err)

      if (onError) {
        onError()
      }
    })
  }, [url])

  return data
}