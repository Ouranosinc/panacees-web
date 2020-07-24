import React from "react"
import { formatCurrency } from "./utils"
import { PopoverHelpComponent } from "./PopoverHelp"

/** Displays a damage summary box */
export const DamageSummary = (props: {
  erosionDamage?: number | null
  submersionDamage?: number | null
  totalDamagePerMeter?: number | null
}) => {
  return <div style={{ position: "absolute", textAlign: "center", width: "100%", top: 20, zIndex: 600, pointerEvents: "none" }}>
    <div style={{ display: "inline-block", backgroundColor: "white", padding: 10, borderRadius: 8, fontSize: 14, opacity: 0.9 }}>
      <table>
        <tbody>
          <tr key="erosion">
            <td style={{textAlign: "left"}}>
              <span className="text-muted">Coût de l'érosion:</span>
            </td>
            <td style={{textAlign: "right"}}>
              {formatCurrency(props.erosionDamage)}
              <PopoverHelpComponent>
                Pertes économiques potentielles totales dues à l'érosion côtière
              </PopoverHelpComponent>
            </td>
          </tr>
          <tr key="submersion">
            <td style={{textAlign: "left"}}>
              <span className="text-muted">Coût de la submersion:</span>
            </td>
            <td style={{textAlign: "right", minWidth: 90}}>
              {formatCurrency(props.submersionDamage)}
              <PopoverHelpComponent>
                Pertes économiques potentielles totales dues à la submersion côtière
              </PopoverHelpComponent>
            </td>
          </tr>
          <tr key="total_per_m">
            <td style={{textAlign: "left"}}>
              <span className="text-muted">Coût total au mètre linéaire:</span>
            </td>
            <td style={{textAlign: "right", minWidth: 90}}>
              {formatCurrency(props.totalDamagePerMeter)}
              <PopoverHelpComponent>
                Pertes économiques potentielles totales dues à la submersion et l'érosion côtière au mètre linéaire
              </PopoverHelpComponent>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
}

