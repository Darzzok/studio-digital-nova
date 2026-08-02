"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, HelpCircle } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Section } from "@/components/ui/section"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { EASE_NOVA } from "@/lib/motion"

type FloatFrom = { x?: number; y?: number; rotate?: number; scale?: number }
type FloatOptions = { stiffness?: number; damping?: number; mass?: number; opacityDuration?: number }

function floatIn(delay: number, from: FloatFrom, options?: FloatOptions) {
  const { stiffness = 110, damping = 15, mass = 1, opacityDuration = 0.4 } = options ?? {}
  return {
    hidden: {
      opacity: 0,
      x: from.x ?? 0,
      y: from.y ?? 0,
      rotate: from.rotate ?? 0,
      scale: from.scale ?? 1,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness,
        damping,
        mass,
        delay,
        opacity: { duration: opacityDuration, delay },
      },
    },
  }
}

const READ_MORE_LINK_CLASSNAME =
  "font-semibold text-primary underline decoration-primary/30 underline-offset-2 transition-colors duration-150 ease-nova hover:text-primary-hover"

const QUESTIONS = [
  {
    question: "Pourquoi mon entreprise a-t-elle vraiment besoin d'un site internet ?",
    answer: (
      <>
        Un site internet est aujourd&apos;hui le{" "}
        <strong className="font-semibold text-text">premier point de contact</strong> entre votre
        entreprise et vos futurs clients : la majorité des recherches d&apos;un produit ou d&apos;un
        service commencent sur Google. Sans site, vous laissez cette visibilité à vos concurrents.{" "}
        <Link href="/blog/pourquoi-site-internet-entreprise-2026" className={READ_MORE_LINK_CLASSNAME}>
          👉 En savoir plus dans notre article consacré à ce sujet.
        </Link>
      </>
    ),
  },
  {
    question: "Ai-je vraiment besoin d'un site si je suis déjà présent sur les réseaux sociaux ?",
    answer: (
      <>
        Les réseaux sociaux sont un excellent complément, mais ils ne vous appartiennent pas et ne{" "}
        <strong className="font-semibold text-text">remplacent pas un site internet</strong>. Un
        site reste le seul espace que vous maîtrisez entièrement pour présenter votre activité et
        être trouvé sur Google.{" "}
        <Link href="/blog/site-indispensable-malgre-reseaux-sociaux" className={READ_MORE_LINK_CLASSNAME}>
          👉 En savoir plus dans notre article consacré à ce sujet.
        </Link>
      </>
    ),
  },
  {
    question: "Ai-je besoin d'un site vitrine ou d'un site e-commerce ?",
    answer: (
      <>
        Pour la grande majorité des artisans, commerçants et indépendants, un{" "}
        <strong className="font-semibold text-text">site vitrine</strong> suffit largement à
        présenter votre activité, rassurer vos visiteurs et générer des demandes de contact. Un
        module e-commerce n&apos;est utile que si vous vendez directement en ligne, et peut
        toujours être ajouté par la suite.
      </>
    ),
  },
  {
    question: "Combien de temps faut-il pour créer mon site internet ?",
    answer: (
      <>
        Comptez <strong className="font-semibold text-text">5 jours</strong> pour un site one
        page, <strong className="font-semibold text-text">10 jours</strong> pour un site vitrine
        complet, et un délai adapté pour les projets sur mesure. Vous êtes informé de l&apos;avancée
        à chaque étape, sans mauvaise surprise sur le calendrier.
      </>
    ),
  },
  {
    question: "Combien coûte la création d'un site internet professionnel ?",
    answer: (
      <>
        Mes offres démarrent{" "}
        <strong className="font-semibold text-text">à partir de 690 €</strong> pour un site
        vitrine essentiel, avec des formules plus complètes selon vos besoins en design, en
        contenu ou en référencement. Un devis personnalisé vous permet de choisir la formule la
        plus adaptée à votre budget.
      </>
    ),
  },
  {
    question: "Le prix affiché est-il le prix final ?",
    answer: (
      <>
        Oui, mes tarifs sont{" "}
        <strong className="font-semibold text-text">fixes et transparents</strong>. Le montant
        annoncé dans votre devis est celui que vous payez, sans frais caché qui s&apos;ajoute en
        cours de projet.
      </>
    ),
  },
  {
    question: "Comment obtenir un devis pour mon projet de site internet ?",
    answer: (
      <>
        Rien de plus simple : vous décrivez votre projet via le formulaire de contact, et vous
        recevez un{" "}
        <strong className="font-semibold text-text">devis gratuit et sans engagement sous 24h</strong>.
        Nous échangeons ensuite ensemble pour affiner vos besoins avant de démarrer.
      </>
    ),
  },
  {
    question: "Quelles questions dois-je me poser avant de lancer mon projet de site ?",
    answer: (
      <>
        Bien clarifier vos objectifs, votre budget et vos attentes en amont vous fait{" "}
        <strong className="font-semibold text-text">gagner un temps précieux</strong> et évite les
        allers-retours inutiles une fois le projet lancé.{" "}
        <Link href="/blog/questions-avant-projet-digital" className={READ_MORE_LINK_CLASSNAME}>
          👉 En savoir plus dans notre article consacré à ce sujet.
        </Link>
      </>
    ),
  },
  {
    question: "Comment se déroule la prise de contact et le démarrage du projet ?",
    answer: (
      <>
        Vous me contactez via le formulaire, nous échangeons ensemble sur votre projet puis vous
        recevez un{" "}
        <strong className="font-semibold text-text">devis gratuit sous 24h</strong>. Une fois
        validé, le projet démarre selon un planning clair, défini avec vous dès le départ.{" "}
        <Link href="/blog/comment-preparer-projet-site-internet" className={READ_MORE_LINK_CLASSNAME}>
          👉 En savoir plus dans notre article consacré à ce sujet.
        </Link>
      </>
    ),
  },
  {
    question: "Comment choisir le bon prestataire pour créer mon site internet ?",
    answer: (
      <>
        Au-delà du tarif, mieux vaut privilégier un{" "}
        <strong className="font-semibold text-text">interlocuteur unique, transparent sur ses
        délais et ses tarifs</strong>, et capable de vous montrer des réalisations concrètes. C&apos;est
        la garantie d&apos;un accompagnement sérieux du premier échange à la mise en ligne.{" "}
        <Link href="/blog/choisir-bon-prestataire-site-internet" className={READ_MORE_LINK_CLASSNAME}>
          👉 En savoir plus dans notre article consacré à ce sujet.
        </Link>
      </>
    ),
  },
  {
    question: "Créez-vous mon site avec WordPress ?",
    answer: (
      <>
        Je conçois des sites{" "}
        <strong className="font-semibold text-text">sur mesure, pensés pour votre activité</strong>{" "}
        plutôt que sur des modèles génériques. Cette approche garantit un site plus rapide, plus
        sécurisé et plus simple à faire évoluer qu&apos;une solution standard comme WordPress, tout
        en restant simple à prendre en main au quotidien.
      </>
    ),
  },
  {
    question: "Mon site sera-t-il bien référencé sur Google ?",
    answer: (
      <>
        Chaque site est construit sur des{" "}
        <strong className="font-semibold text-text">bases techniques saines</strong> (structure,
        vitesse, balisage) qui favorisent un bon référencement naturel dès la mise en ligne. C&apos;est
        la première étape indispensable avant tout travail de positionnement sur la durée.
      </>
    ),
  },
  {
    question: "Le référencement SEO est-il inclus dans vos offres ?",
    answer: (
      <>
        Il est inclus dans les offres{" "}
        <strong className="font-semibold text-text">Pro et Premium</strong>, et disponible en
        option pour l&apos;offre Essentiel.
      </>
    ),
  },
  {
    question: "Comment améliorer ma visibilité locale sur Google ?",
    answer: (
      <>
        Pour un artisan, un commerçant ou un professionnel local,{" "}
        <strong className="font-semibold text-text">apparaître dans les recherches locales</strong>{" "}
        est souvent plus rentable qu&apos;un référencement national. Cela passe par un site optimisé
        et une présence en ligne cohérente autour de votre zone d&apos;activité.{" "}
        <Link href="/blog/ameliorer-visibilite-locale-google" className={READ_MORE_LINK_CLASSNAME}>
          👉 En savoir plus dans notre article consacré à ce sujet.
        </Link>
      </>
    ),
  },
  {
    question: "Dois-je créer ou optimiser ma fiche Google Business Profile ?",
    answer: (
      <>
        Oui, c&apos;est{" "}
        <strong className="font-semibold text-text">fortement recommandé</strong> en complément de
        votre site : c&apos;est souvent la première chose que voient vos clients potentiels lorsqu&apos;ils
        vous recherchent sur Google ou Maps. Je peux vous accompagner sur ce point selon votre
        offre.
      </>
    ),
  },
  {
    question: "Mon site sera-t-il rapide et performant ?",
    answer: (
      <>
        Oui, la{" "}
        <strong className="font-semibold text-text">vitesse de chargement</strong> fait partie des
        priorités dès la conception : un site lent fait fuir les visiteurs en quelques secondes et
        pénalise votre référencement.{" "}
        <Link href="/blog/7-erreurs-visiteurs-fuient-site" className={READ_MORE_LINK_CLASSNAME}>
          👉 En savoir plus dans notre article consacré à ce sujet.
        </Link>
      </>
    ),
  },
  {
    question: "Le site sera-t-il adapté aux mobiles ?",
    answer: (
      <>
        Tous mes sites sont{" "}
        <strong className="font-semibold text-text">100% responsives</strong> et testés sur
        mobile, tablette et ordinateur, puisque la majorité de vos visiteurs vous découvriront
        depuis leur smartphone.
      </>
    ),
  },
  {
    question: "Le design de mon site sera-t-il moderne et actuel ?",
    answer: (
      <>
        Oui, chaque projet s&apos;appuie sur des{" "}
        <strong className="font-semibold text-text">tendances actuelles et éprouvées</strong>,
        pensées pour rester agréables à utiliser dans la durée plutôt que pour suivre un effet de
        mode passager.{" "}
        <Link href="/blog/tendances-webdesign-experience-utilisateur" className={READ_MORE_LINK_CLASSNAME}>
          👉 En savoir plus dans notre article consacré à ce sujet.
        </Link>
      </>
    ),
  },
  {
    question: "Quels éléments donnent confiance aux visiteurs sur un site professionnel ?",
    answer: (
      <>
        Des éléments simples comme des{" "}
        <strong className="font-semibold text-text">informations claires, des avis clients et des
        preuves concrètes de votre savoir-faire</strong> suffisent à rassurer un visiteur et à le
        transformer en prospect.{" "}
        <Link href="/blog/elements-confiance-site-professionnel" className={READ_MORE_LINK_CLASSNAME}>
          👉 En savoir plus dans notre article consacré à ce sujet.
        </Link>
      </>
    ),
  },
  {
    question: "Comment un site internet peut-il m'apporter plus de clients ?",
    answer: (
      <>
        Un site bien conçu guide naturellement le visiteur vers une{" "}
        <strong className="font-semibold text-text">prise de contact ou une demande de devis</strong>,
        au lieu de se contenter d&apos;être une simple vitrine passive.{" "}
        <Link href="/blog/transformer-visiteurs-clients" className={READ_MORE_LINK_CLASSNAME}>
          👉 En savoir plus dans notre article consacré à ce sujet.
        </Link>
      </>
    ),
  },
  {
    question: "Qui s'occupe de l'hébergement de mon site internet ?",
    answer: (
      <>
        Je propose un hébergement{" "}
        <strong className="font-semibold text-text">fiable et sécurisé</strong>, avec une mise en
        ligne rapide. Vous n&apos;avez aucune démarche technique à gérer de votre côté.
      </>
    ),
  },
  {
    question: "Dois-je acheter un nom de domaine séparément ?",
    answer: (
      <>
        Je vous accompagne dans le{" "}
        <strong className="font-semibold text-text">choix et la réservation de votre nom de
        domaine</strong>, en tenant compte de votre activité et de votre zone géographique, pour un
        résultat cohérent avec votre image de marque.
      </>
    ),
  },
  {
    question: "Puis-je utiliser un nom de domaine que je possède déjà ?",
    answer: (
      <>
        Oui, si vous possédez déjà un{" "}
        <strong className="font-semibold text-text">nom de domaine</strong>, il peut être
        directement relié à votre nouveau site, sans perte de votre historique ni de vos adresses
        e-mail existantes.
      </>
    ),
  },
  {
    question: "La maintenance de mon site est-elle incluse après la mise en ligne ?",
    answer: (
      <>
        Un suivi est proposé après la livraison pour garantir la{" "}
        <strong className="font-semibold text-text">sécurité et le bon fonctionnement</strong> de
        votre site dans la durée. Les modalités sont précisées selon l&apos;offre choisie.
      </>
    ),
  },
  {
    question: "Puis-je modifier mon site moi-même après la livraison ?",
    answer: (
      <>
        Oui, je vous forme à la prise en main et peux ajouter un{" "}
        <strong className="font-semibold text-text">espace d&apos;administration</strong> si
        besoin, pour que vous puissiez mettre à jour vos contenus en toute autonomie.
      </>
    ),
  },
  {
    question: "Que se passe-t-il si je ne suis pas satisfait du design ?",
    answer: (
      <>
        J&apos;ajuste le design jusqu&apos;à ce qu&apos;il corresponde exactement à votre vision,{" "}
        <strong className="font-semibold text-text">sans frais supplémentaire</strong>.
      </>
    ),
  },
  {
    question: "Puis-je demander une refonte de mon site internet existant ?",
    answer: (
      <>
        Bien sûr, je propose un service de{" "}
        <strong className="font-semibold text-text">refonte complète</strong> pour moderniser
        votre site actuel, améliorer ses performances et le rendre enfin à la hauteur de votre
        activité.
      </>
    ),
  },
]

function FaqCta() {
  const reduce = Boolean(useReducedMotion())
  const isMobile = useIsMobile()

  return (
    <motion.div
      initial={reduce || isMobile ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={floatIn(0, { y: 60, scale: 0.94 })}
    >
      <Card className="relative mx-auto max-w-3xl overflow-hidden text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -top-24 h-56 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-4 py-4">
          <Heading variant="h2">Une autre question ?</Heading>
          <p className="max-w-xl text-body text-text-secondary">
            <strong className="font-semibold text-text">Je réponds personnellement à chaque message</strong>.
            Parlons de votre projet et voyons ensemble comment je peux vous aider.
          </p>
          <a href="/#contact" className="group">
            <Button variant="primary">
              Construisons votre projet
              <Icon
                icon={ArrowRight}
                className="size-4 transition-transform duration-200 ease-nova group-hover:translate-x-0.5"
              />
            </Button>
          </a>
        </div>
      </Card>
    </motion.div>
  )
}

const INITIAL_VISIBLE_QUESTIONS = 8

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const reduce = Boolean(useReducedMotion())
  const isMobile = useIsMobile()
  const visibleQuestions = showAll ? QUESTIONS : QUESTIONS.slice(0, INITIAL_VISIBLE_QUESTIONS)
  const hiddenCount = QUESTIONS.length - INITIAL_VISIBLE_QUESTIONS

  return (
    <Section>
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center md:max-w-3xl">
        <motion.div
          className="mb-4"
          initial={reduce || isMobile ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0, { y: -40, scale: 0.85 })}
        >
          <Badge variant="outline" className="gap-2 py-1.5">
            <Icon icon={HelpCircle} className="size-3.5" />
            Questions fréquentes
          </Badge>
        </motion.div>

        <motion.div
          initial={reduce || isMobile ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.12, { y: -60, scale: 0.94 })}
        >
          <Heading variant="h2">Vos questions, mes réponses</Heading>
        </motion.div>

        <motion.p
          className="mt-6 max-w-xl text-body text-text-secondary"
          initial={reduce || isMobile ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.22, { y: 40 })}
        >
          Tout ce qu'il faut savoir avant de vous lancer. Une autre question ? Contactez-moi,{" "}
          <strong className="font-semibold text-text">je réponds personnellement à chaque message</strong>.
        </motion.p>
      </div>

      <div className="mx-auto mt-16 flex max-w-3xl flex-col gap-4">
        {visibleQuestions.map((item, index) => {
          const isOpen = openIndex === index
          const from: FloatFrom =
            index % 2 === 0 ? { x: -140, rotate: -4 } : { x: 140, rotate: 4 }

          return (
            <motion.div
              key={item.question}
              initial={reduce || isMobile ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={floatIn(index * 0.08, from, { damping: 30, mass: 4 })}
            >
              <Card className="overflow-hidden p-0">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="text-body font-semibold text-text transition-colors duration-150 ease-nova group-hover:text-primary">
                    {item.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: EASE_NOVA }}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-150 ease-nova group-hover:bg-primary/20"
                  >
                    <Icon icon={ChevronDown} className="size-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE_NOVA }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-body text-text-secondary">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )
        })}

        {hiddenCount > 0 && (
          <div className="mt-2 flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="h-11 px-6 text-small"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? "Afficher moins de questions" : `Voir les ${hiddenCount} autres questions`}
              <motion.span
                animate={{ rotate: showAll ? 180 : 0 }}
                transition={{ duration: 0.2, ease: EASE_NOVA }}
                className="flex items-center justify-center"
              >
                <Icon icon={ChevronDown} className="size-4" />
              </motion.span>
            </Button>
          </div>
        )}
      </div>

      <div className="mt-16">
        <FaqCta />
      </div>
    </Section>
  )
}

export { FAQ, FaqCta }
