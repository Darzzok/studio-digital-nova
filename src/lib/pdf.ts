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
  /*
    `document` peut manquer : rendu côté serveur, outil en ligne de commande.
    On retombe alors sur une approximation plutôt que de jeter une exception au
    milieu de la génération.
  */
  if (!contexteMesure && typeof document !== "undefined") {
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

/** Lit les dimensions d'un JPEG dans son en-tête SOF. */
function dimensionsJpeg(o: Uint8Array): { largeur: number; hauteur: number } | null {
  for (let i = 2; i < o.length; ) {
    if (o[i] !== 0xff) {
      i++
      continue
    }
    const marqueur = o[i + 1]
    if (marqueur >= 0xc0 && marqueur <= 0xc2) {
      return { hauteur: (o[i + 5] << 8) | o[i + 6], largeur: (o[i + 7] << 8) | o[i + 8] }
    }
    i += 2 + ((o[i + 2] << 8) | o[i + 3])
  }
  return null
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
  /* Images JPEG à intégrer, indexées par page. */
  private images: {
    page: number
    nom: string
    octets: Uint8Array
    /* Dimensions intrinsèques du JPEG, exigées par le XObject. */
    largeurPx: number
    hauteurPx: number
  }[] = []
  /* Liens cliquables, par page. */
  private liens: { page: number; rect: [number, number, number, number]; url: string }[] = []
  readonly largeurUtile = A4.largeur - MARGE * 2
  /* Colonne courante : décalée quand on écrit dans un panneau. */
  private margeGauche = MARGE
  private largeurBloc = A4.largeur - MARGE * 2

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

  /**
   * Garantit qu'un bloc entier tiendra sur la page courante. Sans cela, un
   * constat pouvait être coupé entre deux pages — son titre d'un côté, sa
   * recommandation de l'autre.
   */
  reserverBloc(hauteur: number) {
    if (this.y - hauteur < MARGE + 26) this.nouvellePage()
  }

  /** Hauteur qu'occupera un texte, sans l'écrire. Sert à mesurer un bloc. */
  mesurerHauteur(contenu: string, taille = 10, police: Police = "normale", largeur?: number) {
    const lignes = decouper(contenu, largeur ?? this.largeurUtile, taille, police)
    return lignes.length * taille * 1.45
  }

  get position(): number {
    return this.y
  }

  /**
   * Place le curseur à une hauteur choisie sur la page courante. Sert aux
   * pages composées, où l'on veut centrer un bloc verticalement plutôt que de
   * le laisser tomber en haut et laisser du blanc en bas.
   */
  placer(y: number) {
    this.y = y
    this.derniereLigne = y
  }

  /** Numéro de la page en cours de composition, à partir de 1. */
  get numeroPage(): number {
    return this.flux.length
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
    const largeur = options.largeur ?? this.largeurBloc
    const x = options.x ?? this.margeGauche

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
    const x = this.margeGauche + this.largeurBloc - largeur
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
    this.rectangle(this.margeGauche, this.y, this.largeurBloc, epaisseur, couleur)
  }

  /**
   * Pose un panneau coloré et place le curseur à l'intérieur, sous son bord
   * haut. Le fond est peint AVANT le texte : dans un PDF le contenu s'empile
   * dans l'ordre d'écriture, il n'y a pas de plans à gérer.
   *
   * Retourne une fonction à appeler une fois le contenu écrit : elle ramène le
   * curseur sous le panneau, quelle que soit la hauteur réellement occupée.
   */
  panneau(
    hauteur: number,
    fond: Couleur,
    options: { filetGauche?: Couleur; marge?: number } = {}
  ): () => void {
    const marge = options.marge ?? 14
    const total = hauteur + marge * 2
    this.reserverBloc(total)
    const haut = this.y
    const bas = haut - total
    this.rectangle(MARGE, bas, this.largeurUtile, total, fond)
    if (options.filetGauche) {
      this.rectangle(MARGE, bas, 2.5, total, options.filetGauche)
    }
    this.y = haut - marge
    const decalage = options.filetGauche ? 12 : 0
    this.margeGauche = MARGE + marge + decalage
    this.largeurBloc = this.largeurUtile - marge * 2 - decalage
    return () => {
      this.margeGauche = MARGE
      this.largeurBloc = this.largeurUtile
      this.y = Math.min(this.y, bas) - 6
    }
  }

  /**
   * Écrit à une position exacte, sans toucher au curseur ni réserver de
   * hauteur. Sert aux pavés posés en coordonnées absolues — pied de
   * couverture, encart de contact — où le flux n'a pas à intervenir.
   */
  texteAbsolu(
    contenu: string,
    x: number,
    y: number,
    options: { taille?: number; police?: Police; couleur?: Couleur } = {}
  ) {
    const taille = options.taille ?? 10
    const police = options.police ?? "normale"
    const [r, v, b] = options.couleur ?? [0.15, 0.19, 0.24]
    const octets = versWinAnsi(contenu)
    const chaine = octets.map((o) => String.fromCharCode(o)).join("")
    this.derniereLigne = y
    this.ecrire(
      `BT /${police === "grasse" ? "F2" : "F1"} ${taille} Tf ` +
        `${r} ${v} ${b} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${chaine}) Tj ET`
    )
  }

  /** Largeur qu'occupera un texte. Sert à centrer sans tâtonner. */
  largeurTexte(contenu: string, taille = 10, police: Police = "normale") {
    return mesurer(contenu, taille, police)
  }

  /**
   * Texte centré dans la colonne courante. Le centrage se calcule ligne par
   * ligne : un paragraphe de deux lignes centre chacune d'elles, et non le
   * bloc entier aligné à gauche.
   */
  texteCentre(
    contenu: string,
    options: {
      taille?: number
      police?: Police
      couleur?: Couleur
      interligne?: number
      largeur?: number
    } = {}
  ) {
    const taille = options.taille ?? 10
    const police = options.police ?? "normale"
    const [r, v, b] = options.couleur ?? [0.15, 0.19, 0.24]
    const interligne = options.interligne ?? taille * 1.45
    const largeur = options.largeur ?? this.largeurBloc

    for (const ligne of decouper(contenu, largeur, taille, police)) {
      this.reserver(interligne)
      this.y -= interligne
      this.derniereLigne = this.y
      const x = this.margeGauche + (this.largeurBloc - mesurer(ligne, taille, police)) / 2
      const octets = versWinAnsi(ligne)
      const chaine = octets.map((o) => String.fromCharCode(o)).join("")
      this.ecrire(
        `BT /${police === "grasse" ? "F2" : "F1"} ${taille} Tf ` +
          `${r} ${v} ${b} rg 1 0 0 1 ${x.toFixed(2)} ${this.y.toFixed(2)} Tm (${chaine}) Tj ET`
      )
    }
  }

  /**
   * Anneau de score. L'arc est approché par une polyligne épaisse à bouts
   * ronds — une soixantaine de segments suffisent pour que l'œil n'y voie
   * qu'un cercle, et cela évite d'avoir à poser des courbes de Bézier à angle
   * quelconque. La note s'écrit au centre.
   */
  anneau(
    note: number | null,
    couleur: Couleur,
    options: { rayon?: number; epaisseur?: number; piste?: Couleur; texte?: Couleur; legende?: string } = {}
  ) {
    const rayon = options.rayon ?? 44
    const epaisseur = options.epaisseur ?? 7
    const piste = options.piste ?? [0.89, 0.87, 0.84]
    const encre = options.texte ?? [0.043, 0.09, 0.149]
    const hauteur = rayon * 2 + epaisseur + (options.legende ? 16 : 0)

    this.reserverBloc(hauteur + 12)
    this.y -= 6
    const cx = this.margeGauche + this.largeurBloc / 2
    const cy = this.y - rayon
    this.y -= rayon * 2 + epaisseur

    const arc = (depuis: number, jusqua: number, [r, v, b]: Couleur) => {
      if (jusqua <= depuis) return
      const pas = Math.max(2, Math.ceil((jusqua - depuis) / 0.06))
      const points: string[] = []
      for (let i = 0; i <= pas; i++) {
        const a = depuis + ((jusqua - depuis) * i) / pas
        /* On part du haut et on tourne dans le sens horaire, comme une jauge. */
        const x = cx + rayon * Math.sin(a)
        const y = cy + rayon * Math.cos(a)
        points.push(`${x.toFixed(2)} ${y.toFixed(2)} ${i === 0 ? "m" : "l"}`)
      }
      this.ecrire(
        `q ${r} ${v} ${b} RG ${epaisseur.toFixed(2)} w 1 J 1 j ${points.join(" ")} S Q`
      )
    }

    arc(0, Math.PI * 2, piste)
    if (note !== null) arc(0, Math.PI * 2 * (Math.max(0, Math.min(100, note)) / 100), couleur)

    /* La note, posée au centre optique de l'anneau. */
    const valeur = note === null ? "—" : String(note)
    const taille = note === null ? 20 : 30
    const largeurValeur = mesurer(valeur, taille, "grasse")
    const octets = versWinAnsi(valeur)
    const chaine = octets.map((o) => String.fromCharCode(o)).join("")
    const [er, ev, eb] = encre
    this.ecrire(
      `BT /F2 ${taille} Tf ${er} ${ev} ${eb} rg 1 0 0 1 ` +
        `${(cx - largeurValeur / 2).toFixed(2)} ${(cy - taille * 0.34).toFixed(2)} Tm (${chaine}) Tj ET`
    )

    if (options.legende) {
      this.espace(12)
      this.texteCentre(options.legende.toUpperCase(), { taille: 7.5, police: "grasse", couleur: [0.42, 0.46, 0.5] })
    }
  }

  /**
   * Ligne de note : libellé à gauche, valeur à droite, barre dessous. Les
   * trois vont ensemble et ne peuvent pas se séparer entre deux pages, ce qui
   * évitait de retrouver une barre orpheline en haut de page.
   */
  ligneNote(
    libelle: string,
    note: number | null,
    couleur: Couleur,
    options: { appoint?: string; encre?: Couleur; piste?: Couleur } = {}
  ) {
    this.reserverBloc(34)
    this.texte(libelle, { taille: 9.5, police: "grasse", couleur: options.encre ?? [0.15, 0.19, 0.24] })
    this.texteDroite(note === null ? "non mesuré" : `${note}/100`, {
      taille: 9.5,
      police: "grasse",
      couleur: note === null ? [0.42, 0.46, 0.5] : couleur,
    })
    /* Assez d'air pour dégager les jambages du libellé au-dessus de la barre. */
    this.espace(9)
    const y = this.y
    this.rectangle(this.margeGauche, y, this.largeurBloc, 5, options.piste ?? [0.89, 0.87, 0.84])
    if (note !== null) {
      this.rectangle(
        this.margeGauche,
        y,
        (this.largeurBloc * Math.max(0, Math.min(100, note))) / 100,
        5,
        couleur
      )
    }
    this.espace(8)
    if (options.appoint) {
      this.texte(options.appoint, { taille: 8, couleur: [0.42, 0.46, 0.5] })
    }
  }

  /** Image centrée dans la colonne courante, au lieu d'être collée à gauche. */
  imageJpegCentree(dataUri: string, largeurVoulue: number, ratio: number) {
    const largeur = Math.min(largeurVoulue, this.largeurBloc)
    const decalage = (this.largeurBloc - largeur) / 2
    const gardeMarge = this.margeGauche
    const gardeLargeur = this.largeurBloc
    this.margeGauche = gardeMarge + decalage
    this.largeurBloc = largeur
    const pose = this.imageJpeg(dataUri, largeur, ratio)
    this.margeGauche = gardeMarge
    this.largeurBloc = gardeLargeur
    return pose
  }

  /** Pastille colorée : un mot, sur un fond teinté. Retourne sa largeur. */
  pastille(texte: string, fond: Couleur, encre: Couleur, x?: number): number {
    const taille = 7.5
    const largeurTexte = mesurer(texte, taille, "grasse")
    const largeur = largeurTexte + 14
    const gauche = x ?? this.margeGauche
    this.reserver(16)
    this.y -= 13
    this.rectangle(gauche, this.y - 3.5, largeur, 15, fond)
    const [r, v, b] = encre
    const octets = versWinAnsi(texte)
    const chaine = octets.map((o) => String.fromCharCode(o)).join("")
    this.ecrire(
      `BT /F2 ${taille} Tf ${r} ${v} ${b} rg 1 0 0 1 ${(gauche + 7).toFixed(2)} ${this.y.toFixed(2)} Tm (${chaine}) Tj ET`
    )
    this.derniereLigne = this.y
    return largeur
  }

  /** Barre de score : le remplissage est proportionnel à la note. */
  barre(note: number, couleur: Couleur) {
    this.reserver(18)
    // 14 points : assez pour dégager les jambages du libellé au-dessus.
    this.y -= 14
    this.rectangle(this.margeGauche, this.y, this.largeurBloc, 4, [0.89, 0.87, 0.84])
    this.rectangle(
      this.margeGauche,
      this.y,
      (this.largeurBloc * Math.max(0, Math.min(100, note))) / 100,
      4,
      couleur
    )
  }

  /**
   * Pose une image JPEG à la position courante et avance d'autant.
   * `largeurVoulue` est en points ; la hauteur suit le rapport d'origine.
   */
  imageJpeg(
    dataUri: string,
    largeurVoulue: number,
    ratio: number
  ): { x: number; y: number; largeur: number; hauteur: number } | null {
    const b64 = dataUri.includes(",") ? dataUri.split(",", 2)[1] : dataUri
    const bin = atob(b64)
    const octets = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i)

    const largeur = Math.min(largeurVoulue, this.largeurBloc)
    const hauteur = largeur / ratio
    this.reserver(hauteur + 10)
    this.y -= hauteur + 6

    /* Le XObject a besoin des dimensions réelles du fichier, pas de l'affichage. */
    const taille = dimensionsJpeg(octets)
    if (!taille) return null

    const nom = `Im${this.images.length + 1}`
    this.images.push({
      page: this.flux.length - 1,
      nom,
      octets,
      largeurPx: taille.largeur,
      hauteurPx: taille.hauteur,
    })
    this.ecrire(
      `q ${largeur.toFixed(2)} 0 0 ${hauteur.toFixed(2)} ${this.margeGauche.toFixed(2)} ${this.y.toFixed(2)} cm /${nom} Do Q`
    )
    return { x: this.margeGauche, y: this.y, largeur, hauteur }
  }

  /** Cadre non rempli — sert à cerner une zone sur une capture. */
  cadre(x: number, y: number, largeur: number, hauteur: number, couleur: Couleur, epaisseur = 1.4) {
    const [r, v, b] = couleur
    this.ecrire(
      `q ${r} ${v} ${b} RG ${epaisseur} w ${x.toFixed(2)} ${y.toFixed(2)} ` +
        `${largeur.toFixed(2)} ${hauteur.toFixed(2)} re S Q`
    )
  }

  /** Petit carré numéroté, posé en coordonnées absolues sur une image. */
  numero(n: number, x: number, y: number, fond: Couleur, encre: Couleur) {
    const cote = 12
    this.rectangle(x, y, cote, cote, fond)
    const [r, v, b] = encre
    const etiquette = String(n)
    const largeur = mesurer(etiquette, 7.5, "grasse")
    const octets = versWinAnsi(etiquette)
    const chaine = octets.map((o) => String.fromCharCode(o)).join("")
    this.ecrire(
      `BT /F2 7.5 Tf ${r} ${v} ${b} rg 1 0 0 1 ` +
        `${(x + (cote - largeur) / 2).toFixed(2)} ${(y + 3.4).toFixed(2)} Tm (${chaine}) Tj ET`
    )
  }

  /** Rend cliquable la dernière ligne écrite. */
  lienSurDerniereLigne(url: string, largeur: number) {
    this.liens.push({
      page: this.flux.length - 1,
      rect: [MARGE, this.derniereLigne - 3, MARGE + largeur, this.derniereLigne + 11],
      url,
    })
  }

  /**
   * Vrai pied de page : un filet, la signature à gauche, la pagination à
   * droite. Appeler juste avant `versOctets`. Les pages listées dans `sauter`
   * n'en reçoivent pas — les aplats sombres, où un filet gris jurerait.
   */
  pieds(signature: string, sauter: number[] = []) {
    const total = this.flux.length
    const ligne = MARGE - 22
    for (let i = 0; i < total; i++) {
      if (sauter.includes(i + 1)) continue
      const pagination = `${i + 1} / ${total}`
      const poser = (texte: string, x: number) => {
        const octets = versWinAnsi(texte)
        const chaine = octets.map((o) => String.fromCharCode(o)).join("")
        this.flux[i] +=
          `\nBT /F1 7.5 Tf 0.55 0.58 0.62 rg 1 0 0 1 ${x.toFixed(2)} ${ligne.toFixed(2)} Tm (${chaine}) Tj ET`
      }
      this.flux[i] +=
        `\n0.89 0.87 0.84 rg ${MARGE} ${(ligne + 13).toFixed(2)} ` +
        `${(A4.largeur - MARGE * 2).toFixed(2)} 0.6 re f`
      poser(signature, MARGE)
      poser(pagination, A4.largeur - MARGE - mesurer(pagination, 7.5, "normale"))
    }
  }

  /**
   * Numérote chaque page en pied. Appeler juste avant `versOctets`.
   * `sauter` laisse des pages sans pied — typiquement la couverture, où le
   * texte gris viendrait se poser sur un aplat sombre et chevaucher le pavé
   * de contact.
   */
  paginer(mention: string, sauter: number[] = []) {
    const total = this.flux.length
    for (let i = 0; i < total; i++) {
      if (sauter.includes(i + 1)) continue
      const texte = `${mention}    ${i + 1} / ${total}`
      const octets = versWinAnsi(texte)
      const chaine = octets.map((o) => String.fromCharCode(o)).join("")
      this.flux[i] +=
        `\nBT /F1 8 Tf 0.55 0.58 0.62 rg 1 0 0 1 ${MARGE} ${(MARGE - 16).toFixed(2)} Tm (${chaine}) Tj ET`
    }
  }

  /** Assemble le fichier. Retourne les octets prêts à être téléchargés. */
  versOctets(): Uint8Array {
    const nbPages = this.flux.length
    /*
      Les objets sont numérotés dans l'ordre où ils sont poussés. On garde un
      corps binaire à part pour les images : leur flux ne peut pas transiter
      par une chaîne UTF-16 sans être abîmé.
    */
    const objets: { tete: string; binaire?: Uint8Array }[] = []
    const pousser = (tete: string, binaire?: Uint8Array) => objets.push({ tete, binaire }) 

    pousser(`<< /Type /Catalog /Pages 2 0 R >>`) // 1
    pousser("") // 2 — l'arbre des pages, complété plus bas

    const idPage: number[] = []
    for (let i = 0; i < nbPages; i++) idPage.push(3 + i)
    const idContenu = (i: number) => 3 + nbPages + i
    const idFont1 = 3 + nbPages * 2
    const idFont2 = idFont1 + 1
    let prochain = idFont2 + 1

    /* Images : un XObject par image, rattaché à sa page. */
    const idImage = new Map<string, number>()
    for (const img of this.images) {
      idImage.set(img.nom, prochain++)
    }
    /* Liens : une annotation par lien. */
    const idLien = this.liens.map(() => prochain++)

    for (let i = 0; i < nbPages; i++) {
      const imagesPage = this.images.filter((im) => im.page === i)
      const ressourcesImage = imagesPage.length
        ? ` /XObject << ${imagesPage.map((im) => `/${im.nom} ${idImage.get(im.nom)} 0 R`).join(" ")} >>`
        : ""
      const annots = this.liens
        .map((l, k) => (l.page === i ? `${idLien[k]} 0 R` : null))
        .filter(Boolean)
      const champAnnots = annots.length ? ` /Annots [${annots.join(" ")}]` : ""
      pousser(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.largeur} ${A4.hauteur}] ` +
          `/Resources << /Font << /F1 ${idFont1} 0 R /F2 ${idFont2} 0 R >>${ressourcesImage} >> ` +
          `/Contents ${idContenu(i)} 0 R${champAnnots} >>`
      )
    }
    for (let i = 0; i < nbPages; i++) {
      const contenu = this.flux[i]
      pousser(`<< /Length ${contenu.length} >>\nstream${contenu}\nendstream`)
    }
    pousser(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`)
    pousser(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`)

    for (const img of this.images) {
      pousser(
        `<< /Type /XObject /Subtype /Image /Width ${img.largeurPx} /Height ${img.hauteurPx} ` +
          `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.octets.length} >>`,
        img.octets
      )
    }
    for (const l of this.liens) {
      const [x1, y1, x2, y2] = l.rect
      pousser(
        `<< /Type /Annot /Subtype /Link /Border [0 0 0] ` +
          `/Rect [${x1.toFixed(2)} ${y1.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}] ` +
          `/A << /S /URI /URI (${l.url}) >> >>`
      )
    }

    objets[1].tete =
      `<< /Type /Pages /Count ${nbPages} /Kids [${idPage.map((n) => `${n} 0 R`).join(" ")}] >>`

    /* Assemblage en octets : les flux binaires interdisent de tout concaténer. */
    const morceaux: Uint8Array[] = []
    const enc = (txt: string) => {
      const u = new Uint8Array(txt.length)
      for (let i = 0; i < txt.length; i++) u[i] = txt.charCodeAt(i) & 0xff
      return u
    }
    let position = 0
    const ajouter = (u: Uint8Array) => {
      morceaux.push(u)
      position += u.length
    }

    ajouter(enc("%PDF-1.4\n"))
    const decalages: number[] = []
    objets.forEach((o, index) => {
      decalages.push(position)
      if (o.binaire) {
        ajouter(enc(`${index + 1} 0 obj\n${o.tete}\nstream\n`))
        ajouter(o.binaire)
        ajouter(enc("\nendstream\nendobj\n"))
      } else {
        ajouter(enc(`${index + 1} 0 obj\n${o.tete}\nendobj\n`))
      }
    })
    const debutXref = position
    let fin = `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`
    for (const d of decalages) fin += `${String(d).padStart(10, "0")} 00000 n \n`
    fin += `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\nstartxref\n${debutXref}\n%%EOF`
    ajouter(enc(fin))

    const total = morceaux.reduce((s, m) => s + m.length, 0)
    const octets = new Uint8Array(total)
    let curseur = 0
    for (const m of morceaux) {
      octets.set(m, curseur)
      curseur += m.length
    }
    return octets
  }
}

export const MARGE_PDF = MARGE
export const PAGE_PDF = A4
