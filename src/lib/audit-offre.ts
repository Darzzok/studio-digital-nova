/* ==========================================================================
   CE QUE JE PROPOSE, SELON CE QUI A ÉTÉ MESURÉ
   ==========================================================================
   Le rapport se termine par une suite concrète, et non par un slogan : deux
   prestations au plus, choisies d'après le périmètre demandé et la note
   obtenue, avec leur repère tarifaire quand il en existe un.

   Les libellés, les adresses et les prix sont ceux des pages du site et de la
   grille affichée publiquement (690 € / 990 € / à partir de 1 200 €). Rien
   n'est inventé ici : si un prix change sur le site, il doit changer là aussi.
   ========================================================================== */

import { PERIMETRES, type Perimetre, type RapportPage } from "@/lib/audit"

export type Prestation = {
  nom: string
  /** Une phrase, reprise de la page correspondante. */
  ligne: string
  /** Chemin de la page, barre finale comprise. */
  lien: string
  /** Repère tarifaire public, ou `null` quand le devis dépend du périmètre. */
  prix: string | null
}

const REFONTE: Prestation = {
  nom: "Refonte de site internet",
  ligne:
    "Garder ce qui marche — votre contenu, vos positions dans Google — et reconstruire le reste.",
  lien: "/refonte-site-internet/",
  prix: null,
}

const VITRINE: Prestation = {
  nom: "Création de site vitrine",
  ligne: "Jusqu'à 5 pages, optimisation SEO comprise, livraison en 10 jours.",
  lien: "/creation-site-vitrine/",
  prix: "990 € — formule Pro",
}


const SEO: Prestation = {
  nom: "Référencement naturel",
  ligne: "Être trouvé sur les recherches qui amènent vraiment des clients près de chez vous.",
  lien: "/referencement-seo/",
  prix: null,
}

const MAINTENANCE: Prestation = {
  nom: "Maintenance et hébergement",
  ligne: "Mises à jour, sauvegardes et surveillance, pour que le site reste au niveau.",
  lien: "/maintenance-site-internet/",
  prix: null,
}

export type SuiteProposee = {
  /** Titre du bloc, adapté à ce qui a été mesuré. */
  titre: string
  /** Deux phrases au plus, qui relient le constat à la proposition. */
  phrase: string
  prestations: Prestation[]
}

/*
  La note oriente le ton, le périmètre oriente le métier. Une note haute ne
  déclenche aucune vente forcée : on propose alors d'entretenir, pas de refaire.
*/
export function suiteProposee(rapport: RapportPage | null, perimetre: Perimetre): SuiteProposee {
  const note = rapport?.note ?? null
  const urgent = note !== null && note < 45
  const moyen = note !== null && note >= 45 && note < 75
  const bon = note !== null && note >= 75

  const champ = PERIMETRES[perimetre].libelle.toLowerCase()

  if (bon) {
    return {
      titre: "Ce que je vous propose",
      phrase:
        `Votre site tient la route sur ${champ}. Il n'y a rien à refaire — ` +
        "il y a à entretenir, pour que le niveau ne se dégrade pas avec le temps.",
      prestations: [MAINTENANCE],
    }
  }

  if (perimetre === "technique") {
    return {
      titre: "Ce que je vous propose",
      phrase: urgent
        ? "Les défauts relevés sont techniques : ils se corrigent sans toucher à votre contenu ni à votre image."
        : "Les corrections relevées demandent une intervention technique, pas une refonte.",
      prestations: urgent ? [SEO, MAINTENANCE] : [SEO],
    }
  }

  if (perimetre === "visuel") {
    return {
      titre: "Ce que je vous propose",
      phrase: urgent
        ? "Ce que voit un visiteur est ce qui décide de son appel. Les défauts relevés se corrigent en reprenant la mise en page, sans perdre votre contenu ni votre référencement."
        : "Quelques réglages suffisent souvent. Si vous préférez repartir sur des bases nettes, la refonte garde votre contenu et vos positions.",
      prestations: urgent ? [REFONTE, VITRINE] : [REFONTE],
    }
  }

  /* Complet */
  return {
    titre: "Ce que je vous propose",
    phrase: urgent
      ? "Les défauts se cumulent sur les deux fronts, le visuel et la technique. C'est le cas où reprendre les fondations coûte moins cher que de rattraper indéfiniment."
      : moyen
        ? "Rien d'irrattrapable : les points relevés se corrigent un par un, et la refonte reste l'option la plus rentable si vous visez plus loin."
        : "Voici les deux façons d'avancer, selon que vous préfériez corriger ou repartir au propre.",
    prestations: urgent ? [REFONTE, VITRINE] : [REFONTE, SEO],
  }
}
