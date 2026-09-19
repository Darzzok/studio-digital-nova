/* ==========================================================================
   GÉNÉRATEUR DE PDF
   ==========================================================================
   Écrit un PDF 1.4 à la main, sans dépendance. La page d'audit vend de la
   performance : lui greffer 350 Ko de bibliothèque pour produire un document
   de deux pages serait contradictoire. Ce fichier n'est de toute façon chargé
   qu'au moment où le visiteur demande son rapport (import dynamique).

   Limites assumées : polices standard (Helvetica), encodage WinAnsi, pas
   d'image. C'est tout ce dont le rapport a besoin.
   ========================================================================== */

const A4 = { largeur: 595.28, hauteur: 841.89 }
const MARGE = 48

type Police = "normale" | "grasse"

/*
  WinAnsiEncoding suit Latin-1 pour l'essentiel, sauf la plage 0x80-0x9F où il
  place les caractères typographiques. On mappe ceux qu'un texte français
  produit réellement — apostrophe courbe, tirets longs, guillemets, euro.
*/
const WINANSI_SPECIAUX: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87,
  "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e,
  "\u2018": 0x91, "\u2019": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
  "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
}

/** Convertit une chaîne JS en octets WinAnsi, en échappant la syntaxe PDF. */
function versWinAnsi(texte: string): number[] {
  const octets: number[] = []
  for (const caractere of texte) {
    const special = WINANSI_SPECIAUX[caractere]
    const code = special ?? caractere.codePointAt(0) ?? 63
    // Hors table : on retombe sur « ? » plutôt que de produire un octet invalide.
    const octet = special ? special : code <= 0xff ? code : 63
    if (octet === 0x28 || octet === 0x29 || octet === 0x5c) octets.push(0x5c) // ( ) \
    octets.push(octet)
  }
  return octets
}

/* -------------------------------------------------------------------------- */
/* Mesure du texte                                                             */
/* -------------------------------------------------------------------------- */
/*
  Helvetica et Arial partagent leurs chasses sur la quasi-totalité des glyphes.
  On mesure donc avec le canvas du navigateur plutôt que d'embarquer les tables
  AFM : même résultat, quelques kilo-octets en moins.
*/
let contexteMesure: CanvasRenderingContext2D | null = null

function mesurer(texte: string, taille: number, police: Police): number {
  if (!contexteMesure) {
    contexteMesure = document.createElement("canvas").getContext("2d")
  }
  if (!contexteMesure) return texte.length * taille * 0.5
  contexteMesure.font = `${police === "grasse" ? "bold " : ""}${taille}px Helvetica, Arial, sans-serif`
  return contexteMesure.measureText(texte).width
}

/** Découpe un texte en lignes qui tiennent dans `largeur`. */
function decouper(texte: string, largeur: number, taille: number, police: Police): string[] {
  const lignes: string[] = []
  for (const paragraphe of texte.split("\n")) {
    let courante = ""
    for (const mot of paragraphe.split(/\s+/).filter(Boolean)) {
      const essai = courante ? `${courante} ${mot}` : mot
      if (mesurer(essai, taille, police) <= largeur) {
        courante = essai
      } else {
        if (courante) lignes.push(courante)
        courante = mot
      }
    }
    lignes.push(courante)
  }
  return lignes
}

/* -------------------------------------------------------------------------- */
/* Document                                                                    */
/* -------------------------------------------------------------------------- */

export type Couleur = [number, number, number]

export class DocumentPdf {
  private pages: string[] = []
  private flux: string[] = []
  private y = A4.hauteur - MARGE
  /* Ligne de base de la dernière ligne écrite : `texteDroite` s'y raccroche. */
  private derniereLigne = A4.hauteur - MARGE
  readonly largeurUtile = A4.largeur - MARGE * 2

  constructor() {
    this.nouvellePage()
  }

  private get courant(): string {
    return this.flux[this.flux.length - 1]
  }

  private ecrire(instruction: string) {
    this.flux[this.flux.length - 1] = `${this.courant}\n${instruction}`
  }

  nouvellePage() {
    this.flux.push("")
    this.pages.push("")
    this.y = A4.hauteur - MARGE
  }

  /** Réserve `hauteur` points ; passe à la page suivante si la place manque. */
  private reserver(hauteur: number) {
    if (this.y - hauteur < MARGE + 26) this.nouvellePage()
  }

  espace(points: number) {
    this.y -= points
  }

  get position(): number {
    return this.y
  }

  texte(
    contenu: string,
    options: {
      taille?: number
      police?: Police
      couleur?: Couleur
      interligne?: number
      largeur?: number
      x?: number
    } = {}
  ) {
    const taille = options.taille ?? 10
    const police = options.police ?? "normale"
    const [r, v, b] = options.couleur ?? [0.15, 0.19, 0.24]
    const interligne = options.interligne ?? taille * 1.45
    const largeur = options.largeur ?? this.largeurUtile
    const x = options.x ?? MARGE

    for (const ligne of decouper(contenu, largeur, taille, police)) {
      this.reserver(interligne)
      this.y -= interligne
      this.derniereLigne = this.y
      const octets = versWinAnsi(ligne)
      const chaine = octets.map((o) => String.fromCharCode(o)).join("")
      this.ecrire(
        `BT /${police === "grasse" ? "F2" : "F1"} ${taille} Tf ` +
          `${r} ${v} ${b} rg 1 0 0 1 ${x.toFixed(2)} ${this.y.toFixed(2)} Tm (${chaine}) Tj ET`
      )
    }
  }

  /**
   * Texte aligné à droite, posé sur la MÊME ligne de base que le texte
   * précédent — typiquement une valeur en regard de son libellé. Ne consomme
   * donc pas de hauteur.
   */
  texteDroite(contenu: string, options: { taille?: number; police?: Police; couleur?: Couleur } = {}) {
    const taille = options.taille ?? 10
    const police = options.police ?? "normale"
    const [r, v, b] = options.couleur ?? [0.15, 0.19, 0.24]
    const largeur = mesurer(contenu, taille, police)
    const x = A4.largeur - MARGE - largeur
    const octets = versWinAnsi(contenu)
    const chaine = octets.map((o) => String.fromCharCode(o)).join("")
    this.ecrire(
      `BT /${police === "grasse" ? "F2" : "F1"} ${taille} Tf ` +
        `${r} ${v} ${b} rg 1 0 0 1 ${x.toFixed(2)} ${this.derniereLigne.toFixed(2)} Tm (${chaine}) Tj ET`
    )
  }

  rectangle(x: number, y: number, largeur: number, hauteur: number, couleur: Couleur) {
    const [r, v, b] = couleur
    this.ecrire(
      `${r} ${v} ${b} rg ${x.toFixed(2)} ${y.toFixed(2)} ${largeur.toFixed(2)} ${hauteur.toFixed(2)} re f`
    )
  }

  /** Filet horizontal pleine largeur. */
  filet(couleur: Couleur = [0.85, 0.83, 0.79], epaisseur = 0.7) {
    this.reserver(10)
    this.y -= 8
    this.rectangle(MARGE, this.y, this.largeurUtile, epaisseur, couleur)
  }

  /** Barre de score : le remplissage est proportionnel à la note. */
  barre(note: number, couleur: Couleur) {
    this.reserver(18)
    // 14 points : assez pour dégager les jambages du libellé au-dessus.
    this.y -= 14
    this.rectangle(MARGE, this.y, this.largeurUtile, 5, [0.89, 0.87, 0.84])
    this.rectangle(MARGE, this.y, (this.largeurUtile * Math.max(0, Math.min(100, note))) / 100, 5, couleur)
  }

  /** Assemble le fichier. Retourne les octets prêts à être téléchargés. */
  versOctets(): Uint8Array {
    const objets: string[] = []
    const nbPages = this.flux.length
    // 1 catalogue, 2 pages, 3..3+n-1 pages, puis contenus, puis 2 polices
    const idPage = (i: number) => 3 + i
    const idContenu = (i: number) => 3 + nbPages + i
    const idFont1 = 3 + nbPages * 2
    const idFont2 = idFont1 + 1

    objets.push(`<< /Type /Catalog /Pages 2 0 R >>`)
    objets.push(
      `<< /Type /Pages /Count ${nbPages} /Kids [${Array.from(
        { length: nbPages },
        (_, i) => `${idPage(i)} 0 R`
      ).join(" ")}] >>`
    )
    for (let i = 0; i < nbPages; i++) {
      objets.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.largeur} ${A4.hauteur}] ` +
          `/Resources << /Font << /F1 ${idFont1} 0 R /F2 ${idFont2} 0 R >> >> ` +
          `/Contents ${idContenu(i)} 0 R >>`
      )
    }
    for (let i = 0; i < nbPages; i++) {
      const contenu = this.flux[i]
      objets.push(`<< /Length ${contenu.length} >>\nstream${contenu}\nendstream`)
    }
    objets.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`)
    objets.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`)

    let pdf = "%PDF-1.4\n"
    const decalages: number[] = []
    objets.forEach((corps, index) => {
      decalages.push(pdf.length)
      pdf += `${index + 1} 0 obj\n${corps}\nendobj\n`
    })
    const debutXref = pdf.length
    pdf += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`
    for (const decalage of decalages) {
      pdf += `${String(decalage).padStart(10, "0")} 00000 n \n`
    }
    pdf += `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\nstartxref\n${debutXref}\n%%EOF`

    // Latin-1 octet par octet : les chaînes ont déjà été converties en WinAnsi.
    const octets = new Uint8Array(pdf.length)
    for (let i = 0; i < pdf.length; i++) octets[i] = pdf.charCodeAt(i) & 0xff
    return octets
  }
}

export const MARGE_PDF = MARGE
export const PAGE_PDF = A4
