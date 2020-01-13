/** Parameters controlling the display of data for a cell, such as year, erosion level, etc. */
export interface CellDisplayParams {
  /** Year that is being displayed */
  year: number

  /** Intensity of erosion */
  erosion: "verylow" | "low" | "med" | "high" | "veryhigh"

  /** ID of adaptation measure being taken. Varies by cell */
  adaptation: string

  /** Submersion has two different modes: frequency and event
   * Frequency is based heights of water during different N-year events
   * Event is a single event at a certain level of water
   */
  submersionMode: "frequency" | "event"

  /** Level of submersion when submersion mode is "event" */
  submersionEventLevel: number

  /** Level of submersion when submersion mode is "frequency" for 2-year event */
  submersion2YLevel: number

  /** Level of submersion when submersion mode is "frequency" for 20-year event */
  submersion20YLevel: number

  /** Level of submersion when submersion mode is "frequency" for 100-year event */
  submersion100YLevel: number
}