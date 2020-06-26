/** Parameters controlling the display of data, such as year, erosion level, etc. */
export interface DisplayParams {
  /** Year that is being displayed */
  year: number

  /** Intensity of erosion */
  erosion: "vlow" | "low" | "med" | "high" | "vhigh"

  /** Level of submersion for 2-year event */
  submersion2Y: "min" | "moy" | "max"

  /** Level of submersion for 20-year event */
  submersion20Y: "min" | "moy" | "max"

  /** Level of submersion for 100-year event */
  submersion100Y: "min" | "moy" | "max"
  
  /** ID of adaptation measure being taken. Varies by cell */
  adaptation: string

}