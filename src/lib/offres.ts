/* ==========================================================================
   PAGES D'OFFRE
   ==========================================================================
   Une page par prestation et par métier ciblé. L'accueil ne peut pas se
   positionner seul sur « création site vitrine », « refonte de site »,
   « prix création site internet » et « site internet pour restaurant » à la
   fois : chaque intention mérite sa page.

   Tout ce qui est écrit ici découle de l'offre réelle : les prix (690 €,
   990 €, à partir de 1 200 €), les délais (5 et 10 jours), les prestations
   listées sur l'accueil et les cas clients existants. Aucune promesse, aucun
   chiffre et aucune réalisation n'ont été inventés.
   ========================================================================== */

export type IconKey =
  | "vitrine"
  | "onepage"
  | "refonte"
  | "seo"
  | "maintenance"
  | "tarifs"
  | "restaurant"
  | "artisan"
  | "tpe"

export type OffreSection = {
  title: string
  paragraphs: string[]
  list?: string[]
}

export type OffrePage = {
  slug: string
  /** Surtitre affiché au-dessus du H1. */
  eyebrow: string
  /*
    Clé d'icône, et non le composant : les données traversent la frontière
    serveur → client, et un composant React n'est pas sérialisable.
    La correspondance se fait côté client, dans le gabarit.
  */
  icon: IconKey
  /** Titre affiché en H1. */
  title: string
  /** Libellé court pour le maillage interne, quand le H1 fait un mauvais lien. */
  navLabel?: string
  /** Titre court pour la balise `<title>` — 60 caractères maximum. */
  seoTitle: string
  /** Description pour les résultats de recherche — 155 caractères maximum. */
  description: string
  keywords: string[]
  /** Chapeau d'introduction, sous le H1. */
  lead: string
  sections: OffreSection[]
  /** Repère tarifaire, repris tel quel de la grille existante. */
  prix?: { montant: string; libelle: string; detail: string }
  faq: { question: string; answer: string }[]
  /** Nature de la page — sert au balisage structuré et au fil d'Ariane. */
  famille: "service" | "metier"
}

/* -------------------------------------------------------------------------- */
/* Prestations                                                                 */
/* -------------------------------------------------------------------------- */

const SERVICES: OffrePage[] = [
  {
    slug: "creation-site-vitrine",
    eyebrow: "Création de site",
    icon: "vitrine",
    famille: "service",
    title: "Création de site vitrine",
    seoTitle: "Création de site vitrine pour TPE et artisans",
    description:
      "Site vitrine sur mesure jusqu'à 5 pages, optimisé pour le référencement. 990 €, livré en 10 jours, partout en France.",
    keywords: [
      "création site vitrine",
      "site vitrine TPE",
      "créer un site vitrine",
      "site vitrine artisan",
      "site vitrine prix",
    ],
    lead:
      "Un site vitrine, c'est votre entreprise expliquée clairement à quelqu'un qui ne vous connaît pas encore. Ni une plaquette numérique, ni un catalogue : un outil qui répond aux questions que se pose un client avant de vous appeler.",
    sections: [
      {
        title: "À qui ça s'adresse",
        paragraphs: [
          "Vous avez plusieurs prestations à présenter, une histoire à raconter, des questions qui reviennent sans cesse au téléphone. Une page unique ne suffit plus : il vous faut de la place pour expliquer, rassurer et convaincre.",
          "C'est la formule qui convient à la majorité des TPE, artisans et commerçants que j'accompagne. Elle laisse assez d'espace pour être trouvé sur Google, sans devenir un site que vous n'aurez jamais le temps de faire vivre.",
        ],
      },
      {
        title: "Ce qui est compris",
        paragraphs: [
          "Le site est écrit et construit avec vous, pas déposé sur un thème acheté. Chaque page a une raison d'exister et une action attendue de la part du visiteur.",
        ],
        list: [
          "Jusqu'à 5 pages incluses",
          "Structure pensée pour le référencement",
          "Contenu et images optimisés",
          "Design responsive premium",
          "Optimisation SEO incluse",
          "Formulaire de contact",
          "Livraison en 10 jours",
        ],
      },
      {
        title: "Pourquoi cinq pages, et pas quinze",
        paragraphs: [
          "Un site de quinze pages à moitié remplies se positionne moins bien qu'un site de cinq pages solides. Google évalue la qualité de chaque page, pas leur nombre.",
          "Cinq pages permettent de couvrir l'essentiel : qui vous êtes, ce que vous faites, pour qui, ce que ça coûte, et comment vous joindre. Si votre activité en demande davantage, on passe sur un projet sur mesure.",
        ],
      },
      {
        title: "Comment ça se passe",
        paragraphs: [
          "Six étapes, de la découverte à la mise en ligne. Vous validez la maquette avant que la moindre ligne de code soit écrite, puis vous relisez l'ensemble avant publication.",
          "Un seul interlocuteur du début à la fin : pas de chef de projet intermédiaire, pas de sous-traitance.",
        ],
      },
    ],
    prix: {
      montant: "990 €",
      libelle: "Formule Pro",
      detail: "Jusqu'à 5 pages, optimisation SEO incluse, livraison en 10 jours.",
    },
    faq: [
      {
        question: "Puis-je modifier le contenu moi-même ensuite ?",
        answer:
          "Oui. On en discute dès la découverte : selon vos besoins, je prévois soit une interface d'édition, soit une intervention de ma part incluse dans la maintenance. Le choix dépend de la fréquence à laquelle vous comptez modifier votre site.",
      },
      {
        question: "Que se passe-t-il si j'ai besoin d'une sixième page ?",
        answer:
          "On en parle avant de démarrer. Si le besoin apparaît en cours de projet, je vous dis franchement ce que ça change au devis, sans facturer de surprise en fin de parcours.",
      },
      {
        question: "Faut-il que je fournisse les textes ?",
        answer:
          "Vous fournissez la matière — ce que vous faites, pour qui, ce qui vous distingue. Je m'occupe de la mise en forme et de la structure pour que Google et vos visiteurs s'y retrouvent.",
      },
    ],
  },
  {
    slug: "creation-site-one-page",
    eyebrow: "Création de site",
    icon: "onepage",
    famille: "service",
    title: "Création de site one page",
    seoTitle: "Création de site one page — livré en 5 jours",
    description:
      "Une page unique et percutante pour lancer votre activité. 690 €, livrée en 5 jours, design sur mesure pensé pour convertir.",
    keywords: [
      "site one page",
      "création site une page",
      "site internet simple",
      "site vitrine une page",
      "site internet rapide",
    ],
    lead:
      "Une seule page, mais qui dit tout. Le format qui convient quand vous démarrez, quand votre offre tient en quelques lignes, ou quand vous avez besoin d'exister en ligne rapidement sans vous lancer dans un projet long.",
    sections: [
      {
        title: "À qui ça s'adresse",
        paragraphs: [
          "Vous lancez votre activité et vous avez besoin d'une adresse à donner. Vous exercez un métier qui s'explique en peu de mots. Ou vous voulez tester un marché avant d'investir davantage.",
          "Dans ces trois cas, une page bien conçue vaut mieux qu'un site de cinq pages à moitié vide.",
        ],
      },
      {
        title: "Ce qui est compris",
        paragraphs: [
          "Tout ce qui compte tient sur un seul écran défilant : qui vous êtes, ce que vous proposez, pourquoi vous faire confiance, et comment vous joindre.",
        ],
        list: [
          "Design sur mesure, pensé pour convertir",
          "1 page optimisée",
          "Formulaire de contact",
          "Livraison en 5 jours",
          "Idéal pour lancer rapidement votre activité",
        ],
      },
      {
        title: "Les limites, dites franchement",
        paragraphs: [
          "Une page unique se positionne sur peu de requêtes. Si votre objectif est d'être trouvé sur Google pour plusieurs prestations différentes, le site vitrine est un meilleur investissement dès le départ.",
          "En revanche, rien n'est perdu : une page bien construite peut évoluer vers un site complet sans repartir de zéro.",
        ],
      },
    ],
    prix: {
      montant: "690 €",
      libelle: "Formule Essentiel",
      detail: "Une page optimisée, design personnalisé, livraison en 5 jours.",
    },
    faq: [
      {
        question: "Cinq jours, vraiment ?",
        answer:
          "À condition que vous soyez disponible pour valider la maquette et relire le contenu. Le délai court parce que le périmètre est réduit et que je travaille en direct, sans allers-retours entre plusieurs intervenants.",
      },
      {
        question: "Pourrai-je passer à un site plus complet plus tard ?",
        answer:
          "Oui. Le travail réalisé sur le design, le contenu et la structure sert de base. On ajoute des pages plutôt que de tout recommencer.",
      },
    ],
  },
  {
    slug: "refonte-site-internet",
    eyebrow: "Refonte",
    icon: "refonte",
    famille: "service",
    title: "Refonte de site internet",
    seoTitle: "Refonte de site internet sans perte de référencement",
    description:
      "Votre site a vieilli ? Refonte complète avec reprise de votre contenu et aucune perte de référencement. Devis gratuit.",
    keywords: [
      "refonte site internet",
      "refaire son site internet",
      "moderniser son site",
      "refonte site vitrine",
      "refonte sans perte SEO",
    ],
    lead:
      "Votre site fonctionne, mais il ne vous ressemble plus. Il est lent, illisible sur téléphone, ou simplement daté. La refonte consiste à garder ce qui marche — votre contenu, vos positions dans Google — et à reconstruire le reste.",
    sections: [
      {
        title: "Les signes qui ne trompent pas",
        paragraphs: [
          "Vous évitez de donner l'adresse de votre site. Vos clients vous disent qu'ils ne l'ont pas trouvé. Il s'affiche mal sur un téléphone. Le chargement traîne. Ou vous n'avez tout simplement plus la main dessus depuis que le prestataire d'origine a disparu.",
          "Aucun de ces symptômes ne justifie de tout jeter. Ils justifient de reprendre les fondations.",
        ],
      },
      {
        title: "Ce qui est compris",
        paragraphs: [
          "Le point le plus important : votre référencement acquis ne disparaît pas. Les anciennes adresses sont redirigées vers les nouvelles, le contenu qui vous positionne est conservé et réécrit s'il le faut.",
        ],
        list: [
          "Reprise de votre contenu existant",
          "Design entièrement modernisé",
          "Aucune perte de référencement",
          "Site adapté aux mobiles",
          "Chargement optimisé",
        ],
      },
      {
        title: "Refonte ou reconstruction ?",
        paragraphs: [
          "Je regarde d'abord ce que vaut l'existant. Parfois le contenu est bon et seule la présentation a vieilli : la refonte est rapide. Parfois la structure elle-même pose problème, et repartir d'une base saine coûte moins cher que de rafistoler.",
          "Je vous dis lequel des deux cas est le vôtre avant de chiffrer, pas après.",
        ],
      },
    ],
    faq: [
      {
        question: "Vais-je perdre mes positions dans Google ?",
        answer:
          "Pas si la refonte est menée correctement. Les anciennes adresses sont redirigées une à une vers leurs équivalents, et le contenu qui vous positionne est conservé. C'est précisément le travail qui distingue une refonte d'une reconstruction improvisée.",
      },
      {
        question: "Mon site sera-t-il inaccessible pendant les travaux ?",
        answer:
          "Non. Le nouveau site est préparé en parallèle. La bascule se fait une fois que vous avez tout validé, et prend quelques minutes.",
      },
      {
        question: "Combien coûte une refonte ?",
        answer:
          "Cela dépend de ce qu'il y a à reprendre. Une refonte de site vitrine se situe dans les mêmes ordres de grandeur qu'une création. Le devis est gratuit et détaillé avant toute décision.",
      },
    ],
  },
  {
    slug: "referencement-seo",
    eyebrow: "Référencement",
    icon: "seo",
    famille: "service",
    title: "Référencement naturel",
    seoTitle: "Référencement naturel pour TPE et artisans",
    description:
      "Audit complet, optimisation technique et éditoriale, suivi mensuel des positions. Être trouvé par les clients qui vous cherchent.",
    keywords: [
      "référencement naturel",
      "SEO TPE",
      "optimisation SEO site vitrine",
      "audit SEO",
      "être trouvé sur Google",
    ],
    lead:
      "Avoir un site ne sert à rien si personne ne le trouve. Le référencement naturel consiste à faire correspondre ce que vous proposez avec ce que vos clients tapent dans Google — un travail de fond, sans achat de publicité.",
    sections: [
      {
        title: "Ce que je regarde en premier",
        paragraphs: [
          "Avant d'écrire quoi que ce soit, il faut savoir ce qui bloque. La plupart des sites que j'audite ont trois problèmes en commun : ils chargent trop lentement, leurs titres ne correspondent à aucune recherche réelle, et leur contenu est trop mince pour que Google ait quelque chose à classer.",
          "L'audit gratuit disponible sur ce site vous donne déjà un premier aperçu chiffré de deux de ces trois points.",
        ],
      },
      {
        title: "Ce qui est compris",
        paragraphs: [
          "Le référencement se joue sur la technique et sur le contenu. Négliger l'un des deux revient à ne rien faire.",
        ],
        list: [
          "Audit complet de votre site",
          "Optimisation technique et éditoriale",
          "Suivi mensuel des positions",
          "Structure des pages revue pour Google",
          "Vitesse de chargement corrigée",
        ],
      },
      {
        title: "Ce que je ne promets pas",
        paragraphs: [
          "Personne ne peut garantir la première place sur une requête donnée, et quiconque vous le promet vend autre chose que du référencement.",
          "Ce que je peux faire : corriger ce qui vous pénalise objectivement, structurer votre site pour qu'il soit compris, et suivre l'évolution de vos positions mois après mois pour ajuster.",
        ],
      },
    ],
    faq: [
      {
        question: "En combien de temps voit-on des résultats ?",
        answer:
          "Les corrections techniques produisent un effet en quelques semaines. Le contenu met plus longtemps — souvent plusieurs mois — parce que Google observe la constance avant de faire remonter un site. Méfiez-vous des délais annoncés plus courts.",
      },
      {
        question: "Faut-il payer tous les mois ?",
        answer:
          "Pas nécessairement. L'audit et les corrections techniques peuvent se faire en une fois. Le suivi mensuel n'a d'intérêt que si vous publiez régulièrement ou si vous êtes sur un marché concurrentiel.",
      },
    ],
  },
  {
    slug: "maintenance-site-internet",
    eyebrow: "Maintenance",
    icon: "maintenance",
    famille: "service",
    title: "Maintenance et hébergement",
    seoTitle: "Maintenance et hébergement de site internet",
    description:
      "Mises à jour de sécurité, sauvegardes automatiques, hébergement rapide avec SSL. Un site qui reste en ligne et à jour.",
    keywords: [
      "maintenance site internet",
      "hébergement site vitrine",
      "sauvegarde site internet",
      "sécurité site web",
      "mise à jour site internet",
    ],
    lead:
      "Un site n'est jamais vraiment terminé. Les navigateurs évoluent, les failles apparaissent, les certificats expirent. La maintenance, c'est ce qui fait la différence entre un site qui dure et un site qu'on redécouvre en panne un lundi matin.",
    sections: [
      {
        title: "Ce qui casse, et quand",
        paragraphs: [
          "Un certificat de sécurité expiré affiche un avertissement rouge à vos visiteurs. Une extension non mise à jour ouvre une porte. Un hébergement saturé fait tomber le site au pire moment — souvent quand le trafic augmente.",
          "Ces incidents sont prévisibles. C'est précisément pour ça qu'ils sont évitables.",
        ],
      },
      {
        title: "Ce qui est compris",
        paragraphs: [
          "Hébergement et maintenance vont ensemble : héberger sans surveiller n'a pas beaucoup de sens.",
        ],
        list: [
          "Mises à jour de sécurité",
          "Sauvegardes automatiques",
          "Intervention rapide en cas de souci",
          "Hébergement rapide et sécurisé",
          "Certificat SSL inclus",
          "Mise en ligne en moins de 24h",
        ],
      },
      {
        title: "Et si vous partez ailleurs ?",
        paragraphs: [
          "Votre site vous appartient. Si vous décidez un jour de confier la maintenance à quelqu'un d'autre, je transmets les accès et les sauvegardes sans discussion.",
        ],
      },
    ],
    faq: [
      {
        question: "La maintenance est-elle obligatoire ?",
        answer:
          "Non, jamais. Vous pouvez faire créer votre site et en assurer le suivi vous-même ou par un tiers. Je vous dirai simplement ce qu'il faut surveiller pour que ça tienne dans le temps.",
      },
      {
        question: "Que se passe-t-il si mon site tombe ?",
        answer:
          "Vous me contactez directement, sans passer par un support. J'interviens rapidement, et une sauvegarde récente permet de repartir même en cas de problème sérieux.",
      },
    ],
  },
  {
    slug: "tarifs-creation-site-internet",
    eyebrow: "Tarifs",
    icon: "tarifs",
    famille: "service",
    title: "Combien coûte un site internet ?",
    navLabel: "Tarifs et prix",
    seoTitle: "Prix création site internet : tarifs clairs dès 690 €",
    description:
      "Trois formules à prix fixe : 690 €, 990 € et à partir de 1 200 €. Ce qui est compris, et ce qui fait varier le devis.",
    keywords: [
      "prix création site internet",
      "combien coûte un site internet",
      "tarif site vitrine",
      "devis site internet",
      "coût création site web",
    ],
    lead:
      "C'est la première question que tout le monde se pose, et celle à laquelle presque personne ne répond publiquement. Voici mes tarifs, ce qu'ils comprennent, et les raisons pour lesquelles un devis peut s'en écarter.",
    sections: [
      {
        title: "Trois formules, trois périmètres",
        paragraphs: [
          "Essentiel à 690 € : une page unique et optimisée, livrée en cinq jours. Pour démarrer votre présence en ligne rapidement.",
          "Pro à 990 € : jusqu'à cinq pages, optimisation SEO incluse, design responsive premium, livré en dix jours. La formule la plus complète pour convertir vos visiteurs.",
          "Premium à partir de 1 200 € : fonctionnalités sur mesure, accompagnement dédié, optimisation avancée. Pour un projet ambitieux aux besoins spécifiques.",
        ],
      },
      {
        title: "Pourquoi des prix fixes",
        paragraphs: [
          "Un devis qui dépend de la tête du client n'est pas un devis, c'est une négociation. Afficher mes tarifs vous permet de savoir immédiatement si nous sommes dans le même ordre de grandeur, sans avoir à décrocher le téléphone.",
          "Ces montants correspondent à un périmètre défini. Ils ne bougent pas en cours de route : si votre projet en sort, je vous le dis avant de commencer, pas à la facture.",
        ],
      },
      {
        title: "Ce qui fait varier un devis",
        paragraphs: [
          "Quelques éléments sortent du forfait et sont chiffrés à part quand ils s'appliquent :",
        ],
        list: [
          "Un nombre de pages supérieur à cinq",
          "Des fonctionnalités spécifiques à développer",
          "La reprise d'un site existant particulièrement ancien",
          "Un accompagnement éditorial poussé sur les textes",
          "Le suivi mensuel du référencement",
        ],
      },
      {
        title: "Ce qui n'est jamais facturé en plus",
        paragraphs: [
          "Le premier échange, le devis, et le temps passé à comprendre votre besoin. Vous savez ce que vous payez avant de vous engager, et vous ne payez rien tant que vous ne vous êtes pas engagé.",
        ],
      },
    ],
    faq: [
      {
        question: "Y a-t-il un abonnement obligatoire ?",
        answer:
          "Non. La création est un montant unique. L'hébergement et la maintenance sont des services distincts, que vous pouvez prendre ailleurs ou assurer vous-même.",
      },
      {
        question: "Le devis est-il vraiment gratuit ?",
        answer:
          "Oui, et sans engagement. Vous recevez une proposition détaillée sous 24 heures après notre échange. Si elle ne vous convient pas, elle s'arrête là.",
      },
      {
        question: "Pourquoi est-ce moins cher qu'une agence ?",
        answer:
          "Parce qu'il n'y a pas de chef de projet, pas de commercial, pas de locaux à financer. Vous parlez directement à la personne qui fabrique votre site.",
      },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/* Métiers                                                                     */
/* -------------------------------------------------------------------------- */
/*
  Les trois métiers repris ici sont exactement ceux des cas clients déjà
  présentés sur l'accueil — restauration, artisanat, TPE. Les problématiques
  décrites reprennent celles qui y figurent, développées. Rien d'inventé.
*/

const METIERS: OffrePage[] = [
  {
    slug: "site-internet-restaurant",
    eyebrow: "Restauration",
    icon: "restaurant",
    famille: "metier",
    title: "Site internet pour restaurant",
    seoTitle: "Site internet pour restaurant : menu, horaires, réservation",
    description:
      "Un site clair qui rassure vos clients et facilite la réservation : menu, horaires, localisation. Dès 690 €.",
    keywords: [
      "site internet restaurant",
      "créer site restaurant",
      "site web restaurateur",
      "site vitrine restaurant",
      "menu en ligne restaurant",
    ],
    lead:
      "Avant de pousser votre porte, un client vérifie trois choses : ce que vous servez, quand vous êtes ouvert, et où vous êtes. S'il ne les trouve pas en dix secondes, il va voir ailleurs — souvent chez le restaurant d'à côté.",
    sections: [
      {
        title: "La situation la plus fréquente",
        paragraphs: [
          "Le restaurant n'a aucune présence en ligne, ou seulement une page de réseau social difficile à tenir à jour. Les clients trouvent difficilement les informations essentielles, et le téléphone sonne pour des questions auxquelles un site répondrait tout seul.",
          "Résultat : du temps perdu en salle, et des clients qui renoncent avant même d'avoir appelé.",
        ],
      },
      {
        title: "Ce qu'on met en place",
        paragraphs: [
          "Un site moderne présentant le menu, les horaires, la localisation et les moyens de réservation. Rien de superflu : ce que le client cherche, immédiatement accessible, y compris depuis un téléphone dans la rue.",
        ],
        list: [
          "Menu consultable sans téléchargement",
          "Horaires et jours de fermeture bien visibles",
          "Localisation et itinéraire",
          "Moyens de réservation mis en avant",
          "Affichage impeccable sur téléphone",
        ],
      },
      {
        title: "Le résultat visé",
        paragraphs: [
          "Un site clair qui rassure les clients et facilite la réservation. Moins d'appels pour des questions d'horaires, plus de clients qui arrivent en sachant déjà ce qu'ils vont commander.",
        ],
      },
    ],
    prix: {
      montant: "dès 690 €",
      libelle: "Selon le périmètre",
      detail: "Une page suffit souvent pour un restaurant. Devis gratuit sous 24 heures.",
    },
    faq: [
      {
        question: "Puis-je mettre à jour mon menu moi-même ?",
        answer:
          "C'est une question à trancher dès le départ. Si votre carte change chaque semaine, on prévoit une interface simple pour la modifier. Si elle bouge deux fois par an, une intervention de ma part suffit.",
      },
      {
        question: "Faut-il un système de réservation en ligne ?",
        answer:
          "Pas forcément. Beaucoup de restaurants s'en sortent très bien avec un numéro bien visible et un formulaire. Un vrai module de réservation a un coût et une charge de gestion : on en parle avant de l'ajouter.",
      },
    ],
  },
  {
    slug: "site-internet-artisan",
    eyebrow: "Artisanat",
    icon: "artisan",
    famille: "metier",
    title: "Site internet pour artisan",
    seoTitle: "Site internet pour artisan : présenter et être appelé",
    description:
      "Présentez vos prestations et vos réalisations, générez des demandes de devis. Site vitrine artisan dès 690 €.",
    keywords: [
      "site internet artisan",
      "site web artisan",
      "créer site artisan",
      "site vitrine bâtiment",
      "demande de devis en ligne",
    ],
    lead:
      "Votre travail parle pour vous — encore faut-il qu'on puisse le voir. Un artisan sans site perd les clients qui cherchent d'abord en ligne, et passe son temps au téléphone à répéter ce qu'une page expliquerait mieux.",
    sections: [
      {
        title: "La situation la plus fréquente",
        paragraphs: [
          "Les demandes arrivent uniquement par téléphone, souvent en pleine intervention. L'entreprise ne présente pas clairement ses services, et le bouche-à-oreille finit par plafonner.",
          "Le client qui vous découvre ne sait pas ce que vous faites exactement, ni si vous intervenez chez lui.",
        ],
      },
      {
        title: "Ce qu'on met en place",
        paragraphs: [
          "Un site vitrine optimisé permettant de présenter les prestations, les réalisations, et de générer des demandes de devis. Le formulaire remplace les appels qui vous coupent en plein chantier.",
        ],
        list: [
          "Prestations détaillées, une par une",
          "Galerie de réalisations",
          "Zone d'intervention clairement indiquée",
          "Formulaire de demande de devis",
          "Structure pensée pour le référencement local",
        ],
      },
      {
        title: "Le résultat visé",
        paragraphs: [
          "Une image professionnelle qui génère plus de demandes de devis. Et des demandes mieux qualifiées : le client a déjà vu ce que vous faites avant de vous écrire.",
        ],
      },
    ],
    prix: {
      montant: "dès 690 €",
      libelle: "Selon le périmètre",
      detail: "Un site vitrine à 990 € convient à la plupart des artisans multi-prestations.",
    },
    faq: [
      {
        question: "Je n'ai pas de photos de mes chantiers, c'est bloquant ?",
        answer:
          "Non, mais c'est dommage. Quelques photos prises au téléphone, correctement cadrées, valent mieux que des images d'illustration achetées. On regarde ensemble ce que vous avez.",
      },
      {
        question: "Comment être trouvé dans ma zone ?",
        answer:
          "La zone d'intervention doit apparaître clairement dans les textes et la structure du site, et votre fiche Google Business Profile doit être correctement renseignée. Les deux travaillent ensemble.",
      },
    ],
  },
  {
    slug: "site-internet-tpe",
    eyebrow: "TPE",
    icon: "tpe",
    famille: "metier",
    title: "Site internet pour TPE et commerçants",
    seoTitle: "Site internet pour TPE et commerçants",
    description:
      "Un site moderne, rapide et adapté aux mobiles qui inspire confiance et convertit. Pour les petites entreprises, partout en France.",
    keywords: [
      "site internet TPE",
      "site internet commerçant",
      "site petite entreprise",
      "site internet pas cher TPE",
      "création site petite entreprise",
    ],
    lead:
      "Une petite structure n'a ni service marketing, ni temps à consacrer à un site compliqué. Ce qu'il lui faut, c'est un outil simple qui inspire confiance et qui tienne dans le temps sans demander d'entretien quotidien.",
    sections: [
      {
        title: "La situation la plus fréquente",
        paragraphs: [
          "L'entreprise possède un ancien site peu rassurant, lent et non adapté aux mobiles. Il a été fait il y a des années, parfois par un proche, et plus personne ne sait vraiment comment y toucher.",
          "Il dessert plus qu'il ne sert : un visiteur qui tombe dessus se demande si l'entreprise est encore en activité.",
        ],
      },
      {
        title: "Ce qu'on met en place",
        paragraphs: [
          "Une refonte complète avec un design moderne, responsive, rapide et optimisé pour le référencement. On repart de ce qui existe quand ça vaut la peine, on reconstruit quand c'est plus sain.",
        ],
        list: [
          "Design moderne et responsive",
          "Chargement rapide, y compris en 4G",
          "Optimisation pour le référencement",
          "Contenu repris et clarifié",
          "Aucune perte de référencement acquis",
        ],
      },
      {
        title: "Le résultat visé",
        paragraphs: [
          "Un site moderne qui inspire confiance et convertit mieux. C'est souvent le premier contact qu'un client aura avec vous : autant qu'il donne envie de poursuivre.",
        ],
      },
    ],
    faq: [
      {
        question: "Mon activité est très locale, ai-je vraiment besoin d'un site ?",
        answer:
          "Même localement, un client vérifie en ligne avant de se déplacer. Un site sert autant à rassurer ceux qui vous connaissent déjà qu'à en attirer de nouveaux.",
      },
      {
        question: "Travaillez-vous à distance ?",
        answer:
          "Oui, partout en France. Les échanges se font par téléphone, visioconférence et email. Cela ne change rien à la qualité du suivi : vous avez le même interlocuteur du premier échange à la mise en ligne.",
      },
    ],
  },
]

export const OFFRE_PAGES: OffrePage[] = [...SERVICES, ...METIERS]

export function getOffreBySlug(slug: string): OffrePage | undefined {
  return OFFRE_PAGES.find((page) => page.slug === slug)
}

/* -------------------------------------------------------------------------- */
/* Maillage depuis le blog                                                     */
/* -------------------------------------------------------------------------- */
/*
  Les articles ne pointaient vers les pages d'offre que par le pied de page,
  qui est identique partout et donc de faible valeur pour le référencement. On
  associe ici chaque article à deux prestations réellement liées à son sujet.

  Les correspondances par catégorie servent de défaut ; un article peut être
  rattaché plus précisément par son slug.
*/
const PAR_CATEGORIE: Record<string, string[]> = {
  "Création de site": ["creation-site-vitrine", "creation-site-one-page"],
  SEO: ["referencement-seo", "creation-site-vitrine"],
  Webdesign: ["refonte-site-internet", "creation-site-vitrine"],
  Marketing: ["referencement-seo", "tarifs-creation-site-internet"],
  "Conseils TPE": ["site-internet-tpe", "tarifs-creation-site-internet"],
}

const PAR_ARTICLE: Record<string, string[]> = {
  "maintenance-site-internet-apres-mise-en-ligne": [
    "maintenance-site-internet",
    "site-internet-tpe",
  ],
  "wordpress-ou-site-sur-mesure": ["creation-site-vitrine", "refonte-site-internet"],
  "ameliorer-visibilite-locale-google": ["referencement-seo", "site-internet-artisan"],
  "choisir-bon-prestataire-site-internet": [
    "tarifs-creation-site-internet",
    "creation-site-vitrine",
  ],
  "7-erreurs-visiteurs-fuient-site": ["refonte-site-internet", "creation-site-vitrine"],
}

/** Prestations à mettre en avant au bas d'un article. */
export function offresLieesAArticle(slug: string, categorie: string): OffrePage[] {
  const cibles = PAR_ARTICLE[slug] ?? PAR_CATEGORIE[categorie] ?? []
  return cibles
    .map((s) => getOffreBySlug(s))
    .filter((p): p is OffrePage => Boolean(p))
}
