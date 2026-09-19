/* ==========================================================================
   IMAGE
   ==========================================================================
   Le site est exporté en statique : aucun serveur ne redimensionne les images.
   `next/image` renvoyait donc le fichier de 1600 px à tout le monde, y compris
   à un téléphone qui l'affiche sur 343 px — 868 Ko rien que sur la liste du
   blog, pour un besoin réel d'environ 120.

   Ce composant écrit lui-même son `srcset` à partir du manifeste produit au
   build par `scripts/images-responsives.mjs`. Le navigateur choisit alors la
   déclinaison qui convient à l'écran et à sa densité.
   ========================================================================== */

import manifeste from "@/lib/images.json"
import { cn } from "@/lib/utils"

type Entree = { w: number; h: number; v: number[] }
const CATALOGUE = manifeste as Record<string, Entree>

type NovaImageProps = {
  src: string
  alt: string
  /** Largeur d'affichage prévue, au format de l'attribut `sizes`. */
  sizes: string
  className?: string
  /**
   * Image de première vue : chargée tout de suite et annoncée prioritaire.
   * À réserver au visuel visible sans défiler, sinon elle vole la bande
   * passante au reste de la page.
   */
  priority?: boolean
  /** Repli quand le fichier manque — utilisé par le portrait de la page d'accueil. */
  onError?: () => void
}

/** Compose le `srcset` : chaque déclinaison, puis l'original à sa vraie taille. */
function composerSrcSet(src: string, entree: Entree | undefined): string | undefined {
  if (!entree || entree.v.length === 0) return undefined
  const point = src.lastIndexOf(".")
  const base = src.slice(0, point)
  const extension = src.slice(point)
  return [
    ...entree.v.map((largeur) => `${base}-${largeur}${extension} ${largeur}w`),
    `${src} ${entree.w}w`,
  ].join(", ")
}

/**
 * Remplit son parent, qui doit être en `position: relative`. Même contrat que
 * `next/image` avec `fill`, sans la couche d'optimisation inutilisable ici.
 */
function NovaImage({ src, alt, sizes, className, priority = false, onError }: NovaImageProps) {
  const entree = CATALOGUE[src]
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={composerSrcSet(src, entree)}
      sizes={sizes}
      alt={alt}
      width={entree?.w || undefined}
      height={entree?.h || undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      onError={onError}
      className={cn("absolute inset-0 h-full w-full", className)}
    />
  )
}

export { NovaImage }
