/**
 * Miroir texte des questions/réponses de src/components/sections/faq.tsx,
 * utilisé uniquement pour les données structurées FAQPage (Schema.org accepte
 * un sous-ensemble de HTML dans Answer.text : a, strong, p, ul, li…).
 * Le composant FAQ reste la seule source visuelle — ce fichier ne touche à
 * aucun rendu, il ne fait que dupliquer le contenu pour le JSON-LD.
 */

import { siteConfig } from "@/lib/site"

const BASE = siteConfig.url

export const SITE_FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "Pourquoi mon entreprise a-t-elle vraiment besoin d'un site internet ?",
    answer:
      `Un site internet est aujourd'hui le <strong>premier point de contact</strong> entre votre entreprise et vos futurs clients : la majorité des recherches d'un produit ou d'un service commencent sur Google. Sans site, vous laissez cette visibilité à vos concurrents. <a href="${BASE}/blog/pourquoi-site-internet-entreprise-2026">En savoir plus</a>.`,
  },
  {
    question: "Ai-je vraiment besoin d'un site si je suis déjà présent sur les réseaux sociaux ?",
    answer:
      `Les réseaux sociaux sont un excellent complément, mais ils ne vous appartiennent pas et ne <strong>remplacent pas un site internet</strong>. Un site reste le seul espace que vous maîtrisez entièrement pour présenter votre activité et être trouvé sur Google. <a href="${BASE}/blog/site-indispensable-malgre-reseaux-sociaux">En savoir plus</a>.`,
  },
  {
    question: "Ai-je besoin d'un site vitrine ou d'un site e-commerce ?",
    answer:
      "Pour la grande majorité des artisans, commerçants et indépendants, un site vitrine suffit largement à présenter votre activité, rassurer vos visiteurs et générer des demandes de contact. Un module e-commerce n'est utile que si vous vendez directement en ligne, et peut toujours être ajouté par la suite.",
  },
  {
    question: "Combien de temps faut-il pour créer mon site internet ?",
    answer:
      "Comptez 5 jours pour un site one page, 10 jours pour un site vitrine complet, et un délai adapté pour les projets sur mesure. Vous êtes informé de l'avancée à chaque étape, sans mauvaise surprise sur le calendrier.",
  },
  {
    question: "Combien coûte la création d'un site internet professionnel ?",
    answer:
      "Mes offres démarrent à partir de 690 € pour un site vitrine essentiel, avec des formules plus complètes selon vos besoins en design, en contenu ou en référencement. Un devis personnalisé vous permet de choisir la formule la plus adaptée à votre budget.",
  },
  {
    question: "Le prix affiché est-il le prix final ?",
    answer:
      "Oui, mes tarifs sont fixes et transparents. Le montant annoncé dans votre devis est celui que vous payez, sans frais caché qui s'ajoute en cours de projet.",
  },
  {
    question: "Comment obtenir un devis pour mon projet de site internet ?",
    answer:
      "Rien de plus simple : vous décrivez votre projet via le formulaire de contact, et vous recevez un devis gratuit et sans engagement sous 24h. Nous échangeons ensuite ensemble pour affiner vos besoins avant de démarrer.",
  },
  {
    question: "Quelles questions dois-je me poser avant de lancer mon projet de site ?",
    answer:
      `Bien clarifier vos objectifs, votre budget et vos attentes en amont vous fait gagner un temps précieux et évite les allers-retours inutiles une fois le projet lancé. <a href="${BASE}/blog/questions-avant-projet-digital">En savoir plus</a>.`,
  },
  {
    question: "Comment se déroule la prise de contact et le démarrage du projet ?",
    answer:
      `Vous me contactez via le formulaire, nous échangeons ensemble sur votre projet puis vous recevez un devis gratuit sous 24h. Une fois validé, le projet démarre selon un planning clair, défini avec vous dès le départ. <a href="${BASE}/blog/comment-preparer-projet-site-internet">En savoir plus</a>.`,
  },
  {
    question: "Comment choisir le bon prestataire pour créer mon site internet ?",
    answer:
      `Au-delà du tarif, mieux vaut privilégier un interlocuteur unique, transparent sur ses délais et ses tarifs, et capable de vous montrer des réalisations concrètes. C'est la garantie d'un accompagnement sérieux du premier échange à la mise en ligne. <a href="${BASE}/blog/choisir-bon-prestataire-site-internet">En savoir plus</a>.`,
  },
  {
    question: "Créez-vous mon site avec WordPress ?",
    answer:
      "Je conçois des sites sur mesure, pensés pour votre activité plutôt que sur des modèles génériques. Cette approche garantit un site plus rapide, plus sécurisé et plus simple à faire évoluer qu'une solution standard comme WordPress, tout en restant simple à prendre en main au quotidien.",
  },
  {
    question: "Mon site sera-t-il bien référencé sur Google ?",
    answer:
      "Chaque site est construit sur des bases techniques saines (structure, vitesse, balisage) qui favorisent un bon référencement naturel dès la mise en ligne. C'est la première étape indispensable avant tout travail de positionnement sur la durée.",
  },
  {
    question: "Le référencement SEO est-il inclus dans vos offres ?",
    answer: "Il est inclus dans les offres Pro et Premium, et disponible en option pour l'offre Essentiel.",
  },
  {
    question: "Comment améliorer ma visibilité locale sur Google ?",
    answer:
      `Pour un artisan, un commerçant ou un professionnel local, apparaître dans les recherches locales est souvent plus rentable qu'un référencement national. Cela passe par un site optimisé et une présence en ligne cohérente autour de votre zone d'activité. <a href="${BASE}/blog/ameliorer-visibilite-locale-google">En savoir plus</a>.`,
  },
  {
    question: "Dois-je créer ou optimiser ma fiche Google Business Profile ?",
    answer:
      "Oui, c'est fortement recommandé en complément de votre site : c'est souvent la première chose que voient vos clients potentiels lorsqu'ils vous recherchent sur Google ou Maps. Je peux vous accompagner sur ce point selon votre offre.",
  },
  {
    question: "Mon site sera-t-il rapide et performant ?",
    answer:
      `Oui, la vitesse de chargement fait partie des priorités dès la conception : un site lent fait fuir les visiteurs en quelques secondes et pénalise votre référencement. <a href="${BASE}/blog/7-erreurs-visiteurs-fuient-site">En savoir plus</a>.`,
  },
  {
    question: "Le site sera-t-il adapté aux mobiles ?",
    answer:
      "Tous mes sites sont 100% responsives et testés sur mobile, tablette et ordinateur, puisque la majorité de vos visiteurs vous découvriront depuis leur smartphone.",
  },
  {
    question: "Le design de mon site sera-t-il moderne et actuel ?",
    answer:
      `Oui, chaque projet s'appuie sur des tendances actuelles et éprouvées, pensées pour rester agréables à utiliser dans la durée plutôt que pour suivre un effet de mode passager. <a href="${BASE}/blog/tendances-webdesign-experience-utilisateur">En savoir plus</a>.`,
  },
  {
    question: "Quels éléments donnent confiance aux visiteurs sur un site professionnel ?",
    answer:
      `Des éléments simples comme des informations claires, des avis clients et des preuves concrètes de votre savoir-faire suffisent à rassurer un visiteur et à le transformer en prospect. <a href="${BASE}/blog/elements-confiance-site-professionnel">En savoir plus</a>.`,
  },
  {
    question: "Comment un site internet peut-il m'apporter plus de clients ?",
    answer:
      `Un site bien conçu guide naturellement le visiteur vers une prise de contact ou une demande de devis, au lieu de se contenter d'être une simple vitrine passive. <a href="${BASE}/blog/transformer-visiteurs-clients">En savoir plus</a>.`,
  },
  {
    question: "Qui s'occupe de l'hébergement de mon site internet ?",
    answer:
      "Je propose un hébergement fiable et sécurisé, avec une mise en ligne rapide. Vous n'avez aucune démarche technique à gérer de votre côté.",
  },
  {
    question: "Dois-je acheter un nom de domaine séparément ?",
    answer:
      "Je vous accompagne dans le choix et la réservation de votre nom de domaine, en tenant compte de votre activité et de votre zone géographique, pour un résultat cohérent avec votre image de marque.",
  },
  {
    question: "Puis-je utiliser un nom de domaine que je possède déjà ?",
    answer:
      "Oui, si vous possédez déjà un nom de domaine, il peut être directement relié à votre nouveau site, sans perte de votre historique ni de vos adresses e-mail existantes.",
  },
  {
    question: "La maintenance de mon site est-elle incluse après la mise en ligne ?",
    answer:
      "Un suivi est proposé après la livraison pour garantir la sécurité et le bon fonctionnement de votre site dans la durée. Les modalités sont précisées selon l'offre choisie.",
  },
  {
    question: "Puis-je modifier mon site moi-même après la livraison ?",
    answer:
      "Oui, je vous forme à la prise en main et peux ajouter un espace d'administration si besoin, pour que vous puissiez mettre à jour vos contenus en toute autonomie.",
  },
  {
    question: "Que se passe-t-il si je ne suis pas satisfait du design ?",
    answer: "J'ajuste le design jusqu'à ce qu'il corresponde exactement à votre vision, sans frais supplémentaire.",
  },
  {
    question: "Puis-je demander une refonte de mon site internet existant ?",
    answer:
      "Bien sûr, je propose un service de refonte complète pour moderniser votre site actuel, améliorer ses performances et le rendre enfin à la hauteur de votre activité.",
  },
]
