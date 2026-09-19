/* ==========================================================================
   QUESTIONS DE LA PAGE D'AUDIT
   ==========================================================================
   Module neutre, volontairement hors du composant client : la page (composant
   serveur) en a besoin pour produire le balisage `FAQPage`, et un composant
   serveur qui importe depuis un module « use client » ne reçoit qu'une
   référence, pas la donnée.
   ========================================================================== */

export const QUESTIONS_AUDIT = [
  {
    question: "C'est vraiment gratuit ?",
    reponse:
      "Oui, et sans contrepartie cachée. L'analyse et la note s'affichent sans rien demander. Seuls le rapport détaillé et son PDF demandent vos coordonnées — c'est ma seule contrepartie, et vous restez libre de ne pas les laisser.",
  },
  {
    question: "Pourquoi ma note est-elle plus basse que sur PageSpeed Insights ?",
    reponse:
      "Parce que la mesure est la même mais le barème est plus exigeant. Je note un site tel que je le livrerais, pas tel qu'il passe tout juste. La mesure brute est affichée à côté de la note, et le barème complet est publié plus haut : vous pouvez tout recouper.",
  },
  {
    question: "Que faites-vous de mon adresse et de mon numéro ?",
    reponse:
      "Je vous recontacte une fois au sujet de cette analyse. Pas d'inscription, pas de revente, pas de séquence automatique. Si vous ne répondez pas, vous n'entendrez plus parler de moi.",
  },
  {
    question: "L'analyse porte sur tout mon site ?",
    reponse:
      "Non, sur la seule page dont vous donnez l'adresse. C'est déjà très révélateur, mais un audit complet couvre l'ensemble des pages, le contenu, la structure et la concurrence — et c'est souvent là que se trouvent les vraies occasions manquées.",
  },
  {
    question: "Et si mon site obtient une bonne note ?",
    reponse:
      "Tant mieux, et je vous le dirai. L'outil affiche aussi ce qui va bien. Je préfère vous dire que votre site est sain plutôt que de vous vendre une refonte dont vous n'avez pas besoin.",
  },
] as const
