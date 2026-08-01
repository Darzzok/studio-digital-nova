"use client"

import type { ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Clock, Gift, MessageSquare, Rocket, SendHorizontal } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/ui/section"
import { EASE_NOVA } from "@/lib/motion"
import { cn } from "@/lib/utils"

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

const contactSchema = z.object({
  name: z.string().min(2, "Merci d'indiquer votre nom."),
  email: z.string().email("Adresse email invalide."),
  phone: z.string().optional(),
  company: z.string().optional(),
  project: z.string().optional(),
  budget: z.string().optional(),
  message: z.string().min(10, "Décrivez votre projet en quelques mots."),
})

type ContactFormValues = z.infer<typeof contactSchema>

const BENEFITS = [
  {
    icon: Clock,
    className: "bg-primary/10 text-primary",
    title: "Réponse sous 24h",
    description: (
      <>
        Je reviens vers vous rapidement, <strong className="font-semibold text-text">sans attente</strong>.
      </>
    ),
  },
  {
    icon: Gift,
    className: "bg-accent-purple/15 text-accent-purple",
    title: "Devis gratuit",
    description: (
      <>
        Une estimation claire, <strong className="font-semibold text-text">sans engagement</strong>.
      </>
    ),
  },
  {
    icon: Rocket,
    className: "bg-accent-green/15 text-accent-green",
    title: "Site livré rapidement",
    description: (
      <>
        <strong className="font-semibold text-text">Des délais courts</strong>, annoncés dès le
        départ.
      </>
    ),
  },
]

function FormField({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 transition-transform duration-150 ease-nova focus-within:scale-[1.01]",
        className
      )}
    >
      <label htmlFor={htmlFor} className="text-small font-medium text-text">
        {label}
      </label>
      {children}
      {error && <p className="text-small text-error">{error}</p>}
    </div>
  )
}

/** Illustration vectorielle — un message qui part, dans le langage du Hero. */
function ContactIllustration({ reduce }: { reduce: boolean }) {
  return (
    <Card className="relative flex h-48 items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <motion.div
        className="relative flex size-20 items-center justify-center rounded-full shadow-sm"
        style={{ backgroundImage: "linear-gradient(135deg, var(--color-primary), var(--color-accent-purple))" }}
        animate={reduce ? { scale: 1 } : { scale: [1, 1.06, 1] }}
        transition={reduce ? undefined : { duration: 2.2, repeat: Infinity, ease: EASE_NOVA }}
      >
        <Icon icon={SendHorizontal} className="size-9 text-primary-foreground" />
      </motion.div>

      <motion.span
        className="absolute left-8 top-9 size-3 rounded-full bg-accent-green/60"
        animate={reduce ? { y: 0 } : { y: [0, -8, 0] }}
        transition={reduce ? undefined : { duration: 2.6, repeat: Infinity, ease: EASE_NOVA }}
      />
      <motion.span
        className="absolute right-10 top-14 size-2 rounded-full bg-warning/60"
        animate={reduce ? { y: 0 } : { y: [0, 6, 0] }}
        transition={reduce ? undefined : { duration: 2.2, repeat: Infinity, delay: 0.3, ease: EASE_NOVA }}
      />
      <motion.span
        className="absolute bottom-10 right-16 size-2.5 rounded-full bg-primary/50"
        animate={reduce ? { y: 0 } : { y: [0, -6, 0] }}
        transition={reduce ? undefined : { duration: 2.4, repeat: Infinity, delay: 0.6, ease: EASE_NOVA }}
      />
    </Card>
  )
}

function Contact() {
  const reduce = useReducedMotion()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) })

  const onSubmit = handleSubmit(() => {
    // Export statique — aucun backend : la confirmation est purement visuelle.
  })

  return (
    <Section id="contact" className="scroll-mt-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center md:max-w-3xl">
        <motion.div
          className="mb-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0, { y: -40, scale: 0.85 })}
        >
          <Badge variant="outline" className="gap-2 py-1.5">
            <Icon icon={MessageSquare} className="size-3.5" />
            Contact
          </Badge>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.12, { y: -60, scale: 0.94 })}
        >
          <Heading variant="h2">Parlons de votre projet</Heading>
        </motion.div>

        <motion.p
          className="mt-6 max-w-xl text-body text-text-secondary"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={floatIn(0.22, { y: 40 })}
        >
          Un projet en tête ? Décrivez-le-moi, je reviens vers vous rapidement avec{" "}
          <strong className="font-semibold text-text">un devis gratuit et sans engagement</strong>.
          Chaque message est lu et traité personnellement, sans détour.
        </motion.p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={floatIn(0.1, { x: -160, rotate: -4 }, { damping: 30, mass: 4 })}
        >
          <Card>
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Nom" htmlFor="name" error={errors.name?.message}>
                  <Input id="name" placeholder="Votre nom" {...register("name")} />
                </FormField>
                <FormField label="Email" htmlFor="email" error={errors.email?.message}>
                  <Input id="email" type="email" placeholder="vous@exemple.com" {...register("email")} />
                </FormField>
                <FormField label="Téléphone" htmlFor="phone" error={errors.phone?.message}>
                  <Input id="phone" type="tel" placeholder="06 12 34 56 78" {...register("phone")} />
                </FormField>
                <FormField label="Entreprise" htmlFor="company" error={errors.company?.message}>
                  <Input id="company" placeholder="Nom de votre entreprise" {...register("company")} />
                </FormField>
                <FormField label="Projet" htmlFor="project" error={errors.project?.message}>
                  <Input id="project" placeholder="Site vitrine, refonte..." {...register("project")} />
                </FormField>
                <FormField label="Budget" htmlFor="budget" error={errors.budget?.message}>
                  <Input id="budget" placeholder="Ex. 1000€ - 2000€" {...register("budget")} />
                </FormField>
              </div>

              <FormField label="Message" htmlFor="message" error={errors.message?.message}>
                <textarea
                  id="message"
                  rows={5}
                  placeholder="Parlez-moi de votre projet..."
                  className="w-full min-w-0 rounded-xl border border-border bg-surface px-4 py-3 text-body text-text placeholder:text-text-secondary transition-colors outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                  {...register("message")}
                />
              </FormField>

              <Button type="submit" variant="primary" className="w-full">
                Demander un devis
              </Button>

              <AnimatePresence initial={false}>
                {isSubmitSuccessful && (
                  <motion.p
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: EASE_NOVA }}
                    className="rounded-xl bg-success/10 px-4 py-3 text-small font-medium text-success"
                  >
                    Merci ! Votre message a bien été envoyé, je reviens vers vous sous 24h.
                  </motion.p>
                )}
              </AnimatePresence>
            </form>
          </Card>
        </motion.div>

        <div className="flex flex-col gap-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={floatIn(0.15, { x: 160, rotate: 4 }, { damping: 30, mass: 4 })}
          >
            <ContactIllustration reduce={Boolean(reduce)} />
          </motion.div>

          {BENEFITS.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={floatIn(0.25 + index * 0.1, { y: 90 }, { damping: 30, mass: 4 })}
            >
              <Card className="flex items-start gap-3 p-5">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    benefit.className
                  )}
                >
                  <Icon icon={benefit.icon} className="size-5" />
                </span>
                <div>
                  <p className="text-small font-semibold text-text">{benefit.title}</p>
                  <p className="text-small text-text-secondary">{benefit.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

export { Contact }
