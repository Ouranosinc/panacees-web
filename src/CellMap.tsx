import { GeoLayerSpec, GeoJsonMap } from "./GeoJsonMap"
import React, { useState, useEffect, useCallback, ReactNode, FC, Children } from "react"
import bbox from '@turf/bbox'
import L from "leaflet"
import { Feature, Point } from "geojson"
import { useGetDamages } from "./calculateCost"

export const CellMap = (props: {
  /** ID of cell */
  cell: string

  /** Erosion level "vlow", etc */
  erosion: string

  /** Adaptation measure ("statuquo", "sansadap") */
  adaptation: string

  /** Submersion level 0, 1, ... */
  submersion: number

  /** Year e.g. 2040 */
  year: number

  /** Height of the map */
  height: number
}) => {
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression>()
  const [satellite, setSatellite] = useState(true)
  const [environment, setEnvironment] = useState(false)
  const [damages, setDamages] = useState(true)

  // Get damages
  const { erosionDamage, submersionDamage } = useGetDamages(props.cell, props.erosion, props.year, props.adaptation, props.submersion)

  // Load initial bounds
  useEffect(() => {
    fetch(`/statiques/${props.cell}/cellule_${props.cell}.geojson`).then(r => r.json()).then((geojson: any) => {
      // bbox gives minx, miny, maxx, maxy
      const [minx, miny, maxx, maxy] = bbox(geojson)
      setBounds([[miny, minx], [maxy, maxx]])
    })
    // TODO errors?
  }, [props.cell])  

  const erosionBuildingFilter = useCallback((feature: Feature) => {
    // Look up key
    const key = props.erosion.replace("ery", "") + "_" + props.adaptation
    const value = feature.properties![key]
    return (value != "NA" && parseInt(value) <= props.year)
  }, [props.cell, props.adaptation, props.year, props.erosion])

  const submersionBuildingFilter = useCallback((feature: Feature) => {
    return feature.properties!.submersion_depth && feature.properties!.submersion_depth <= props.submersion
  }, [props.cell, props.adaptation, props.submersion])

  const layers: GeoLayerSpec[] = [
    {
      url: `statiques/${props.cell}/cellule_${props.cell}.geojson`,
      styleFunction: (feature) => {
        return {
          fill: false,
          weight: 1,
          color: "#38F",
          opacity: 0.8
        }
      }
    },
    // {
    //   // TODO doesn't use adaptation as not present
    //   url: props.submersion > 0 ? `submersion/${props.cell}/submersion_sansadapt_${props.cell}_0a${props.submersion}m.geojson` : undefined,
    //   // url: props.submersion > 0 ? `submersion/${props.cell}/submersion_${props.adaptation}_${props.cell}_0a${props.submersion}m.geojson` : undefined,
    //   styleFunction: (feature) => {
    //     return {
    //       stroke: false,
    //       fillColor: "#38F",
    //       fillOpacity: 0.6
    //     }
    //   }
    // },
    // {
    //   url: props.year > 2020 ? `erosion/${props.cell}/${props.erosion}_erosion_${props.adaptation}_${props.cell}_${props.year}.geojson` : undefined,
    //   styleFunction: (feature) => {
    //     return {
    //       stroke: false,
    //       fillColor: "red",
    //       fillOpacity: 0.5
    //     }
    //   }
    // }
  ]

  if (damages) {
    // Layer to display red icon for eroded houses
    layers.push({
      url: `statiques/${props.cell}/batiments_${props.cell}.geojson`,
      styleFunction: () => ({}),
      pointToLayer: (p: Feature<Point>) => { 
        const coords = [p.geometry.coordinates[1], p.geometry.coordinates[0]]
        const marker = L.marker(coords as any, {
          icon: L.icon({ iconUrl: "house_red_128.png", iconAnchor: [9, 21], iconSize: [18, 21], popupAnchor: [0, -21] })
        })
        // TODO escape HTML
        // TODO format currency
        marker.bindPopup(`
          <p>${p.properties!.description}</p>
          <div>Valeur du bâtiment: ${(p.properties!.valeur_tot || 0)}</div>
          <div>Valeur du terrain: ${(p.properties!.valeur_ter || 0)}</div>
          <div>Valeur totale: ${(p.properties!.valeur_tot || 0)}</div>
          `, { })
        return marker
        // return L.circleMarker(coords as any, { radius: 1, color: "yellow", opacity: 0.7 })
      },
      filter: erosionBuildingFilter
    })

    // Layer to display blue icon for submerged houses
    layers.push({
      url: `statiques/${props.cell}/batiments_${props.cell}.geojson`,
      styleFunction: () => ({}),
      pointToLayer: (p: Feature<Point>) => { 
        const coords = [p.geometry.coordinates[1], p.geometry.coordinates[0]]
        const marker = L.marker(coords as any, {
          icon: L.icon({ iconUrl: "house_blue_128.png", iconAnchor: [9, 21], iconSize: [18, 21], popupAnchor: [0, -21] })
        })
        // TODO escape HTML
        // TODO format currency
        marker.bindPopup(`
          <p>${p.properties!.description}</p>
          <div>Valeur du bâtiment: ${(p.properties!.valeur_tot || 0)}</div>
          <div>Valeur du terrain: ${(p.properties!.valeur_ter || 0)}</div>
          <div>Valeur totale: ${(p.properties!.valeur_tot || 0)}</div>
          `, { })
        return marker
      },
      filter: submersionBuildingFilter
    })
  }

  if (environment) {
    // Add buildings
    layers.unshift({
      url: `statiques/${props.cell}/batiments_${props.cell}.geojson`,
      styleFunction: () => ({}),
      pointToLayer: (p: Feature<Point>) => { 
        const coords = [p.geometry.coordinates[1], p.geometry.coordinates[0]]
        // const marker = L.marker(coords as any, {
        //   icon: L.icon({ iconUrl: "house_128.png", iconAnchor: [10, 8], iconSize: [20, 16], popupAnchor: [0, -8] })
        // })
        // // TODO escape HTML
        // // TODO format currency
        // marker.bindPopup(`
        //   <p>${p.properties!.description}</p>
        //   <div>Valeur du bâtiment: ${(p.properties!.valeur_tot || 0)}</div>
        //   <div>Valeur du terrain: ${(p.properties!.valeur_ter || 0)}</div>
        //   <div>Valeur totale: ${(p.properties!.valeur_tot || 0)}</div>
        //   `, { })
        // return marker
        const marker = L.circleMarker(coords as any, { radius: 1, color: "#c89c34ff", opacity: 0.8 })
        marker.bindTooltip(p.properties!.description)
        return marker
      }
    })
  
    layers.unshift({
      url: `statiques/${props.cell}/environnement_${props.cell}.geojson`,
      styleFunction: (feature) => {
        return {
          weight: 0.5,
          color: "purple",
          opacity: 0.7,
          fillColor: "purple",
          fillOpacity: 0.2
        }
      },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties!.name)
      }
    })
  }

  // if (batiments) {
  //   layers.push({ 
  //     url: "static/batiments_deMetissurMer-4326.geojson", 
  //     styleFunction: () => ({}),
  //     pointToLayer: (p: any) => { 
  //       const coords = [p.geometry.coordinates[0][1], p.geometry.coordinates[0][0]]
  //       return L.circleMarker(coords as any, { radius: 1, color: "yellow", opacity: 0.7 })
  //     }
  //   })
  // }

  if (!bounds) {
    return <div>
      <i className="fa fa-spinner fa-spin"/>
    </div>
  }

  return <div style={{ position: "relative" }}>
    <div style={{ position: "absolute", right: 20, top: 20, zIndex: 1000, backgroundColor: "white", padding: 10, opacity: 0.8, borderRadius: 5 }}>
      <Checkbox value={satellite} onChange={setSatellite}>Satellite</Checkbox>
      <Checkbox value={environment} onChange={setEnvironment}>Plan</Checkbox>
      <Checkbox value={damages} onChange={setDamages}>Dommages</Checkbox>
    </div>
    <div style={{ position: "absolute", textAlign: "center", width: "100%", top: 20, zIndex: 1000, pointerEvents: "none" }}>
      <div style={{ display: "inline-block", backgroundColor: "white", padding: 10, borderRadius: 8, fontSize: 14, opacity: 0.9 }}>
        <table>
          <tbody>
            <tr>
              <td style={{textAlign: "left"}}><span className="text-muted">Coût de l'érosion:</span></td>
              <td style={{textAlign: "right"}}>{ (erosionDamage || 0).toLocaleString("fr", { style: "currency", currency: "CAD" }).replace("CA", "").replace(",00", "") }</td>
            </tr>
            <tr>
              <td style={{textAlign: "left"}}><span className="text-muted">Coût de la submersion:</span></td>
              <td style={{textAlign: "right", minWidth: 90}}>{ (submersionDamage || 0).toLocaleString("fr", { style: "currency", currency: "CAD" }).replace("CA", "").replace(",00", "") }</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <GeoJsonMap 
      layers={layers} 
      bounds={bounds} 
      baseLayer={ satellite ? "bing_satellite" : "positron" }
      height={props.height}/>
    </div>
}

const Checkbox: FC<{ value: boolean, onChange: (value: boolean) => void }> = (props) => {
  return <div onClick={() => { props.onChange(!props.value) }} style={{ cursor: "pointer" }}>
    { props.value ?
      <i className="text-primary fa fa-fw fa-check-square"/>
    : <i className="text-muted fa fa-fw fa-square"/>
    }
    &nbsp;
    {props.children}
  </div>
}

// const Toggle = (props: {
//   options: { value: any, label: ReactNode }[],
//   value: any,
//   onChange: (value: any) => void
// }) => {
//   return <div className="btn-group">
//     {props.options.map(option => {
//       return <button 
//         type="button" 
//         className={ props.value == option.value ? "btn btn-primary btn-sm" : "btn btn-light btn-sm" }
//         onClick={() => props.onChange(option.value)}>{option.label}</button>
//     })}
//   </div>
// }

// <Toggle 
// options={[
//   { value: "satellite", label: "Satellite" },
//   { value: "environment", label: "Environment" },
// ]}
// value={mode}
// onChange={(value) => { setMode(value) }}
// />
