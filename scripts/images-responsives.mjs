/* ==========================================================================
   VARIANTES D'IMAGES
   ==========================================================================
   Produit, à côté de chaque image WebP de `public/images`, une déclinaison en
   400 et 800 px de large. Le composant `NovaImage` s'en sert pour écrire un
   `srcset` : un téléphone télécharge alors la version de 400 px au lieu de
   l'originale de 1600.

   Écrit aussi `src/lib/images.json` : dimensions et déclinaisons disponibles,
   pour que le composant `NovaImage` compose son `srcset` sans deviner.

   Idempotent : une variante déjà à jour n'est pas régénérée.
   ========================================================================== */

import { readdir, stat, writeFile } from "node:fs/promises"
import { join, extname, basename, dirname } from "node:path"
import sharp from "sharp"

/** Doit rester synchrone avec le manifeste lu par NovaImage. */
const LARGEURS = [400, 800]
const RACINE = "public/images"

async function* parcourir(dossier) {
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name)
    if (entree.isDirectory()) yield* parcourir(chemin)
    else if (extname(entree.name) === ".webp") yield chemin
  }
}

const estVariante = (chemin) => /-\d+\.webp$/.test(chemin)

async function plusRecenteQue(candidat, reference) {
  try {
    const [a, b] = await Promise.all([stat(candidat), stat(reference)])
    return a.mtimeMs >= b.mtimeMs
  } catch {
    return false
  }
}

let produites = 0
let gagne = 0
let ignorees = 0
const manifeste = {}

for await (const source of parcourir(RACINE)) {
  if (estVariante(source)) continue

  const image = sharp(source)
  const { width, height } = await image.metadata()
  const base = join(dirname(source), basename(source, ".webp"))
  const disponibles = []

  for (const largeur of LARGEURS) {
    // Une image déjà plus étroite que la variante n'a rien à gagner.
    if (!width || width <= largeur) continue

    const cible = `${base}-${largeur}.webp`
    disponibles.push(largeur)
    if (await plusRecenteQue(cible, source)) {
      ignorees++
      continue
    }

    await sharp(source)
      .resize({ width: largeur, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(cible)

    const [avant, apres] = await Promise.all([stat(source), stat(cible)])
    gagne += avant.size - apres.size
    produites++
  }

  manifeste[`/${source.split("/").slice(1).join("/")}`] = {
    w: width ?? 0,
    h: height ?? 0,
    v: disponibles,
  }
}

await writeFile(
  "src/lib/images.json",
  JSON.stringify(Object.fromEntries(Object.entries(manifeste).sort()), null, 2) + "\n"
)

const ko = (octets) => `${Math.round(octets / 1024)} Ko`
if (produites === 0 && ignorees > 0) {
  console.log(`  Variantes d'images : ${ignorees} déjà à jour`)
} else {
  console.log(
    `  Variantes d'images : ${produites} générées` +
      (ignorees ? `, ${ignorees} à jour` : "") +
      ` — jusqu'à ${ko(gagne)} économisés sur mobile`
  )
}
