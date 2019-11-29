
/** Outer bounds of all cells together */
export const bounds = [[47.5, -70.5], [49, -67]] as L.LatLngBoundsExpression

/** List of all cells to display */
export const cells = [
  { id: "deRivieredesCaps", name: "Cellule de Rivière-des-Caps" },
  { id: "deSaintPatrice", name: "Cellule de Saint-Patrice" },
  { id: "delAnseauPersil", name: "Unité de l'Anse au Persil" },
  { id: "delAnseauLard", name: "Cellule de l'Anseau Lard" },
  { id: "delAnseauxCoques", name: "Cellule de l'Anse aux Coques" },
  { id: "deSainteFlavie", name: "Cellule de Sainte-Flavie" },
  { id: "delabaieMitis", name: "Cellule de la baie Mitis" },
  { id: "duCassePierre", name: "Cellule du Casse-Pierre" },
  { id: "deMetissurMer", name: "Cellule de Metis-sur-Mer" },
] as { id: string, name: string }[]

export const municipalities = [
  { name: "Grand-Métis", cells: ["delabaieMitis"] },
  { name: "Métis-sur-Mer", cells: ["duCassePierre", "deMetissurMer", "delabaieMitis"] },
  { name: "Notre-Dame-du-Portage", cells: ["deSaintPatrice", "deRivieredesCaps"] },
  { name: "Rivière-du-Loup", cells: ["deSaintPatrice", "delAnseauPersil"] },
  { name: "Sainte-Flavie", cells: ["deSainteFlavie", "delAnseauxCoques", "delabaieMitis"] },
  { name: "Sainte-Luce", cells: ["delAnseauxCoques", "delAnseauLard"] },
]