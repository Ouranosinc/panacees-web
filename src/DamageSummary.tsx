import React from "react"

/** Displays a damage summary box */
export const DamageSummary = (props: {
  erosionDamage?: number | null
  submersionDamage?: number | null
}) => {
  return <div style={{ position: "absolute", textAlign: "center", width: "100%", top: 20, zIndex: 1000, pointerEvents: "none" }}>
    <div style={{ display: "inline-block", backgroundColor: "white", padding: 10, borderRadius: 8, fontSize: 14, opacity: 0.9 }}>
      <table>
        <tbody>
          <tr>
            <td style={{textAlign: "left"}}><span className="text-muted">Coût de l'érosion:</span></td>
            <td style={{textAlign: "right"}}>{ (props.erosionDamage || 0).toLocaleString("fr", { style: "currency", currency: "CAD" }).replace("CA", "").replace(",00", "") }</td>
          </tr>
          <tr>
            <td style={{textAlign: "left"}}><span className="text-muted">Coût de la submersion:</span></td>
            <td style={{textAlign: "right", minWidth: 90}}>{ (props.submersionDamage || 0).toLocaleString("fr", { style: "currency", currency: "CAD" }).replace("CA", "").replace(",00", "") }</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
}