import type { JsonLd as JsonLdData } from "@/lib/seo"

/** Injecte une ou plusieurs données structurées Schema.org sous forme de <script type="application/ld+json">. */
function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  const items = Array.isArray(data) ? data : [data]

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  )
}

export { JsonLd }
