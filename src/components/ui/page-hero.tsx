"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { NovaMark } from "@/components/ui/nova";
import { Section } from "@/components/ui/section";
import { EASE_NOVA, useFloatIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ==========================================================================
   OUVERTURE DE PAGE
   ==========================================================================
   Chaque page reprenait le même empilement — surtitre, titre, chapeau — mais
   recopié à la main, avec des écarts partout : les pages légales n'avaient pas
   de surtitre, les espacements variaient, le blog passait en deux colonnes.
   Tout est réuni ici pour que les ouvertures se ressemblent réellement et
   qu'une correction profite à toutes.

   L'accueil garde son ouverture propre : image plein écran et parallaxe. Le
   filet terracotta en pied de section est justement ce qui la relie à celles-ci.
   ========================================================================== */

type PageHeroProps = {
  /** Surtitre affiché dans la pastille, au-dessus du titre. */
  eyebrow: string;
  icon?: LucideIcon;
  title: ReactNode;
  lead?: ReactNode;
  /** Boutons ou champ de saisie, sous le chapeau. */
  children?: ReactNode;
  /**
   * Disposition de `children`. « actions » aligne des boutons ; « bloc » laisse
   * un panneau occuper toute la largeur de la colonne — un formulaire, un
   * parcours en plusieurs écrans.
   */
  childrenVariant?: "actions" | "bloc";
  /** Contenu additionnel : sous la colonne centrée, ou à droite si `split`. */
  aside?: ReactNode;
  /**
   * Deux colonnes à partir de `lg` — texte à gauche, `aside` à droite. Sert
   * quand l'illustration vaut d'être vue en même temps que le titre.
   */
  split?: boolean;
  className?: string;
};

function PageHero({
  eyebrow,
  icon,
  title,
  lead,
  children,
  childrenVariant = "actions",
  aside,
  split,
  className,
}: PageHeroProps) {
  const floatIn = useFloatIn();
  const reduce = useReducedMotion();

  return (
    <Section
      spacing="lg"
      className={cn("relative isolate overflow-hidden bg-surface", className)}
    >
      {/*
        Fond très retenu : un lavis clair qui monte du haut de page, et le
        grain d'impression déjà utilisé sur les blocs encre. Rien de plus —
        l'ouverture doit poser le titre, pas se faire remarquer.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(72% 55% at 50% 0%, var(--color-background) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent"
      />

      <div
        className={cn(
          split
            ? "grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16"
            : "mx-auto max-w-3xl",
        )}
      >
        {/*
          C'est CE conteneur qui centre, dans les deux dispositions. Le laisser
          sans classe en mode centré laissait ses enfants s'étaler sur toute la
          largeur : leur contenu se calait alors à gauche, et la signature comme
          les boutons partaient de travers.
        */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            className="mb-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0, { y: -32, scale: 0.85 })}
          >
            <Badge variant="outline">
              {icon && <Icon icon={icon} className="size-3.5 text-accent" />}
              {eyebrow}
            </Badge>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.1, { y: -50, scale: 0.95 })}
          >
            <Heading variant="h1">{title}</Heading>
          </motion.div>

          {/*
          La signature Nova : deux filets et l'étoile, tracés depuis le centre.
          C'est ce détail, répété à l'identique, qui fait que les ouvertures
          appartiennent visiblement à la même famille.
        */}
          <motion.span
            aria-hidden
            className="mt-7 flex items-center gap-3 text-accent"
            initial={reduce ? false : { opacity: 0, scaleX: 0.4 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, delay: 0.24, ease: EASE_NOVA }}
          >
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-accent/60" />
            <NovaMark className="size-2.5" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-accent/60" />
          </motion.span>

          {lead && (
            <motion.p
              className="measure mx-auto mt-7 text-lead text-text-secondary"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={floatIn(0.3, { y: 36 })}
            >
              {lead}
            </motion.p>
          )}

          {children && (
            /*
              Entrée au montage, et non `whileInView` : ce bloc est au-dessus de
              la ligne de flottaison par construction. Avec un seuil de 40 %, un
              panneau plus haut que l'écran ne franchissait jamais la condition
              et restait invisible, à `opacity: 0`.
            */
            <motion.div
              className={cn(
                childrenVariant === "bloc"
                  ? "mt-12 w-full"
                  : "mt-10 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row"
              )}
              initial="hidden"
              animate="visible"
              variants={floatIn(0.4, { y: 28 })}
            >
              {children}
            </motion.div>
          )}
        </div>

        {split && aside}
      </div>

      {!split && aside}
    </Section>
  );
}

export { PageHero };
