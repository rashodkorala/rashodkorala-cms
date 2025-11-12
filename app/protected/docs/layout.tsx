"use client"

import { useEffect, useState } from "react"
import { DocsNav } from "@/components/docs/docs-nav"
import { TableOfContents } from "@/components/docs/table-of-contents"

interface Heading {
  id: string
  text: string
  level: number
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [headings, setHeadings] = useState<Heading[]>([])

  useEffect(() => {
    const extractHeadings = () => {
      const headingElements = document.querySelectorAll("h1, h2, h3")
      const extracted: Heading[] = []
      const idCounts = new Map<string, number>()

      headingElements.forEach((el) => {
        const baseId = el.id || slugify(el.textContent || "")
        if (baseId) {
          // Ensure unique IDs by appending a counter if needed
          let uniqueId = baseId
          const count = idCounts.get(baseId) || 0
          if (count > 0) {
            uniqueId = `${baseId}-${count}`
          }
          idCounts.set(baseId, count + 1)

          el.id = uniqueId
          extracted.push({
            id: uniqueId,
            text: el.textContent || "",
            level: parseInt(el.tagName.charAt(1)),
          })
        }
      })

      setHeadings(extracted)
    }

    // Extract headings after content loads
    const timer = setTimeout(extractHeadings, 100)

    // Re-extract on navigation
    const observer = new MutationObserver(extractHeadings)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <main className="@container/main flex flex-1 flex-col bg-background rounded-2xl">
        <div className="flex min-h-[calc(100vh-3.5rem)]">
          <DocsNav />
          <div className="flex-1 overflow-y-auto">
            <div className="container max-w-4xl mx-auto px-6 py-12">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                {children}
              </div>
            </div>
          </div>
          {headings.length > 0 && (
            <div className="hidden xl:block">
              <TableOfContents headings={headings} />
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}
