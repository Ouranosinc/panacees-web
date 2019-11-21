
/** Outer bounds of all cells together */
export const bounds = [[47.5, -70.5], [49, -67]] as L.LatLngBoundsExpression

/** List of all cells to display */
export const cells = [
  { id: "delabaieMitis", name: "Cellule de la baie Mitis" },
  { id: "delAnseauLard", name: "Cellule de l'Anseau Lard" },
  { id: "delAnseauPersil", name: "Cellule de l'Anseau Persil" },
  { id: "delAnseauxCoques", name: "Cellule de l'Anseaux Coques" },
  { id: "deMetissurMer", name: "Cellule de Metis sur Mer" },
  { id: "deRivieredesCaps", name: "Cellule de Riviere des Caps" },
  { id: "deSainteFlavie", name: "Cellule de Sainte Flavie" },
  { id: "deSaintPatrice", name: "Cellule de Saint Patrice" },
  { id: "duCassePierre", name: "Cellule du Casse Pierre" }
] as { id: string, name: string }[]
