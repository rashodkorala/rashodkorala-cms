"use client"

import { useState } from "react"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      {filename && (
        <div className="px-4 py-2 bg-muted border-b text-sm font-mono text-muted-foreground">
          {filename}
        </div>
      )}
      <div className="relative">
        <pre className={cn(
          "overflow-x-auto rounded-lg bg-[#1e1e1e] p-4 text-sm",
          filename && "rounded-t-none"
        )}>
          <code className={cn("text-[#d4d4d4]", language && `language-${language}`)}>
            {code}
          </code>
        </pre>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={copyToClipboard}
        >
          {copied ? (
            <IconCheck className="h-4 w-4" />
          ) : (
            <IconCopy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

