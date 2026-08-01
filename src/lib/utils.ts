import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge ne connaît pas l'échelle typographique personnalisée du Design
 * System (text-display / text-h1 / text-h2 / text-h3 / text-body / text-small).
 * Sans cette extension, il les classe par défaut dans le même groupe que les
 * utilitaires de couleur de texte (text-primary-foreground, text-text, ...) et
 * finit par en supprimer un des deux lors de la fusion — d'où des boutons au
 * fond coloré qui se retrouvaient avec le mauvais texte.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-display", "text-h1", "text-h2", "text-h3", "text-body", "text-small"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
