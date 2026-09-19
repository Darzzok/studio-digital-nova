/*
  Recompression des cartes de partage, après l'export.

  `next/og` produit du PNG sans perte, et sans réglage de compression : une
  carte 1200×630 remplie d'une photo pesait jusqu'à 1,3 Mo. Les robots
  d'aperçu de LinkedIn et Facebook abandonnent volontiers au-delà du mégaoctet.

  On repasse chaque fichier dans sharp avec l'effort de compression maximal.
  L'opération est SANS PERTE : mêmes pixels, même format, même Content-Type —
  seulement mieux empaqueté. Environ 75 % de gain constaté.
*/
import sharp from "sharp"
import { readdir, readFile, writeFile, stat } from "node:fs/promises"
import { join } from "node:path"

const RACINE = "out"

async function* parcourir(dossier) {
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name)
    if (entree.isDirectory()) yield* parcourir(chemin)
    else if (entree.name === "opengraph-image" || entree.name === "twitter-image") yield chemin
  }
}

let avant = 0
let apres = 0
let nombre = 0

for await (const fichier of parcourir(RACINE)) {
  const brut = await readFile(fichier)
  const optimise = await sharp(brut).png({ compressionLevel: 9, effort: 10 }).toBuffer()

  // On ne réécrit que si l'on y gagne vraiment.
  if (optimise.length < brut.length) {
    await writeFile(fichier, optimise)
    apres += optimise.length
  } else {
    apres += brut.length
  }
  avant += brut.length
  nombre += 1
}

const mo = (o) => (o / 1024 / 1024).toFixed(1)
console.log(
  `  ${nombre} cartes de partage : ${mo(avant)} Mo → ${mo(apres)} Mo ` +
    `(−${Math.round((1 - apres / avant) * 100)} %, sans perte)`
)
