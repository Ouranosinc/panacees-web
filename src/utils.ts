import { useState, useEffect } from "react";
import { csv } from 'd3'

/** React hook to load a JSON file. Returns [result | undefined, loading: boolean] */
export function useLoadJson<T>(url: string, onLoad?: (data: T) => void, onError?: () => void): [T | undefined, boolean] {
  const [data, setData] = useState<T>()
  const [loadingCount, setLoadingCount] = useState(0)

  useEffect(() => {
    // Increment loading count
    setLoadingCount(l => l + 1)

    fetch(url).then(response => response.json()).then(d => {
      setLoadingCount(l => l - 1)

      setData(d)
      if (onLoad) {
        onLoad(d)
      }
    }).catch((err) => {
      setLoadingCount(l => l - 1)
      console.error(err)

      if (onError) {
        onError()
      }
    })
  }, [url])

  return [data, loadingCount > 0]
}

/** React hook to load a CSV file */
export function useLoadCsv<T>(url: string, processRow?: (data: any) => T, onError?: () => void): [T[] | undefined, boolean] {
  const [data, setData] = useState<T[]>()
  const [loadingCount, setLoadingCount] = useState(0)

  useEffect(() => {
    // Increment loading count
    setLoadingCount(l => l + 1)

    csv(url, processRow as any).then((rows) => {
      setLoadingCount(l => l - 1)
      setData(rows as any)
    }).catch((err) => {
      console.error(err)
      setLoadingCount(l => l - 1)

      if (onError) {
        onError()
      }
    })
  }, [url])

  return [data, loadingCount > 0]
}