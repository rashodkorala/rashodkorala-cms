"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  headings: Heading[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "-100px 0px -66% 0px" }
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    })

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id)
        if (element) observer.unobserve(element)
      })
    }
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className="w-64 border-l pl-6">
      <div className="sticky top-24">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          On this page
        </h3>
        <ul className="space-y-2">
          {headings.map((heading, index) => (
            <li key={`${heading.id}-${index}`}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  "block text-sm transition-colors hover:text-foreground",
                  heading.level === 1 && "font-semibold",
                  heading.level === 2 && "pl-4",
                  heading.level === 3 && "pl-8 text-muted-foreground",
                  activeId === heading.id
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

