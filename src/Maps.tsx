import React, { useState } from "react"
import 'rc-slider/assets/index.css'
import Slider from 'rc-slider'
import { GeoJsonMap, GeoLayerSpec } from "./GeoJsonMap"
import calculateCost from "./calculateCost"

const Maps = () => {
  const [submersion, setSubmersion] = useState(1)
  const [year, setYear] = useState(2030)
  const [erosion, setErosion] = useState(0)

  const [batiments, setBatiments] = useState(false)
  const [cellule, setCellule] = useState(false)
  const [environnement, setEnvironnement] = useState(false)
  const [fleuve, setFleuve] = useState(false)
  const [lignedecote, setLignedecote] = useState(false)
  const [municipalites, setMunicipalites] = useState(false)
  const [souslaligne, setSouslaligne] = useState(false)

  const yearMarks: { [value: number]: string } = {}
  for (let y = 2030 ; y <= 2100 ; y+=10) {
    yearMarks[y] = "" + y
  }

  const erosionMarks = {
    0: "Very Low",
    1: "Low",
    2: "Med",
    3: "High",
    4: "Very High"
  }

  const erosionKeys: { [value: number]: string } = {
    0: "verylow",
    1: "low",
    2: "med",
    3: "high",
    4: "veryhigh"
  }

  const layers: GeoLayerSpec[] = [
    {
      url: `submersion/submersion_sa_deMetissurMer_0a${submersion}m-4326.geojson`,
      styleFunction: (feature) => {
        return {
          stroke: false,
          fillColor: "#38F",
          fillOpacity: 0.5
        }
      }
    },
    {
      url: `erosion/${erosionKeys[erosion]}_erosion_sa_deMetissurMer_${year}-4326.geojson`,
      styleFunction: (feature) => {
        return {
          stroke: false,
          fillColor: "red",
          fillOpacity: 0.5
        }
      }
    },
  ]


  if (batiments) {
    layers.push({ url: "static/batiments_deMetissurMer-4326.geojson", styleFunction: () => ({}) })
  }
    
  if (cellule) {
    layers.push({ url: "static/cellule_deMetissurMer-4326.geojson", styleFunction: () => ({}) })
  }
    
  if (environnement) {
    layers.push({ url: "static/environnement_de_MetissurMer-4326.geojson", styleFunction: () => ({}) })
  }
    
  if (fleuve) {
    layers.push({ url: "static/fleuve_deMetissurMer-4326.geojson", styleFunction: () => ({}) })
  }
    
  if (lignedecote) {
    layers.push({ url: "static/lignedecote_deMetissurMer-4326.geojson", styleFunction: () => ({}) })
  }
    
  if (municipalites) {
    layers.push({ url: "static/municipalites_deMetissurMer-4326.geojson", styleFunction: () => ({}) })
  }
    
  if (souslaligne) {
    layers.push({ url: "static/souslaligne_deMetissurMer-4326.geojson", styleFunction: () => ({}) })
  }

  // const handleCalculate = () => {
  //   calculateCost()
  // }

  //calculateCost()

  const renderToggles = () => {
    return <div>
      <div onClick={() => setBatiments(!batiments)} style={{ cursor: "pointer" }}>
        <i className={ batiments ? "fa fa-check-square fa-fw text-primary" : "fa fa-square fa-fw text-muted"}/>
        Batiments
      </div>
      <div onClick={() => setCellule(!cellule)} style={{ cursor: "pointer" }}>
        <i className={ cellule ? "fa fa-check-square fa-fw text-primary" : "fa fa-square fa-fw text-muted"}/>
        Cellule
      </div>
      <div onClick={() => setEnvironnement(!environnement)} style={{ cursor: "pointer" }}>
        <i className={ environnement ? "fa fa-check-square fa-fw text-primary" : "fa fa-square fa-fw text-muted"}/>
        Environnement
      </div>
      <div onClick={() => setFleuve(!fleuve)} style={{ cursor: "pointer" }}>
        <i className={ fleuve ? "fa fa-check-square fa-fw text-primary" : "fa fa-square fa-fw text-muted"}/>
        Fleuve
      </div>
      <div onClick={() => setLignedecote(!lignedecote)} style={{ cursor: "pointer" }}>
        <i className={ lignedecote ? "fa fa-check-square fa-fw text-primary" : "fa fa-square fa-fw text-muted"}/>
        Lignedecote
      </div>
      <div onClick={() => setMunicipalites(!municipalites)} style={{ cursor: "pointer" }}>
        <i className={ municipalites ? "fa fa-check-square fa-fw text-primary" : "fa fa-square fa-fw text-muted"}/>
        Municipalites
      </div>
      <div onClick={() => setSouslaligne(!souslaligne)} style={{ cursor: "pointer" }}>
        <i className={ souslaligne ? "fa fa-check-square fa-fw text-primary" : "fa fa-square fa-fw text-muted"}/>
        Souslaligne
      </div>
    </div>
  }
    
  return <div>
    <div style={{ padding: 10, paddingBottom: 40 }}>
      <div>Year</div>
      <Slider 
        min={2030} 
        step={10}
        max={2100} 
        value={year} 
        onChange={setYear}  
        marks={yearMarks}
        />
    </div>
    <div style={{ padding: 10, paddingBottom: 40 }}>
      <div>Erosion</div>
      <Slider 
        min={0} 
        max={4} 
        value={erosion} 
        onChange={setErosion}  
        marks={erosionMarks}
        />
    </div>
    <div style={{ padding: 10, paddingBottom: 40 }}>
      <div>Submersion</div>
      <Slider 
        min={1} 
        max={10} 
        value={submersion} 
        onChange={setSubmersion}  
        marks={{ 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10" }}
        />
    </div>
    {renderToggles()}
    <GeoJsonMap layers={layers}/>
  </div>
}

export default Maps