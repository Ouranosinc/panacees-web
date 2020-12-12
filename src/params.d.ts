
/** One adaptation measure */
export interface Adaptation {
  id: string
  nom: string
  description: string
}


/** One row of hauteur.csv */
export interface HeightRow {
  scenario: "min" | "moy" | "max"
  frequence: "h2ans" | "h20ans" | "h100ans"
  year: number
  value: number
}