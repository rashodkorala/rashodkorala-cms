import { getCaseStudyBySlugAdmin, fetchMdxFromStorage } from "@/lib/actions/case-studies"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { IconArrowLeft, IconEdit } from "@tabler/icons-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import * as ChartComponents from "@/components/mdx/chart-components"

const components = {
  // Chart components
  ...ChartComponents,
  // HTML/Markdown components
  h1: (props: any) => <h1 className="text-4xl font-bold mt-8 mb-4" {...props} />,
  h2: (props: any) => <h2 className="text-3xl font-semibold mt-6 mb-3" {...props} />,
  h3: (props: any) => <h3 className="text-2xl font-semibold mt-4 mb-2" {...props} />,
  p: (props: any) => <p className="mb-4 leading-relaxed" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
  li: (props: any) => <li className="ml-4" {...props} />,
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-primary pl-4 italic my-4" {...props} />
  ),
  code: (props: any) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
  ),
  pre: ({ children, ...props }: any) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 text-sm" {...props}>
      {children}
    </pre>
  ),
  a: (props: any) => (
    <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  img: (props: any) => (
    <img className="rounded-lg my-4 max-w-full h-auto" {...props} />
  ),
  hr: (props: any) => <hr className="my-8 border-border" {...props} />,
  table: (props: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full divide-y divide-border" {...props} />
    </div>
  ),
  thead: (props: any) => <thead className="bg-muted" {...props} />,
  tbody: (props: any) => <tbody className="divide-y divide-border" {...props} />,
  tr: (props: any) => <tr {...props} />,
  th: (props: any) => <th className="px-4 py-2 text-left text-sm font-semibold" {...props} />,
  td: (props: any) => <td className="px-4 py-2 text-sm" {...props} />,
}

export default async function ViewCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // Check authentication first
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { slug } = await params
  const caseStudy = await getCaseStudyBySlugAdmin(slug)

  if (!caseStudy) {
    notFound()
  }

  // Fetch MDX content from storage
  let mdxContent = ""
  let mdxError = null

  try {
    mdxContent = await fetchMdxFromStorage(caseStudy.mdxPath)
  } catch (error) {
    mdxError = error instanceof Error ? error.message : "Failed to load MDX content"
  }

  return (
    <div className="space-y-6 px-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/protected/case-studies">
          <Button variant="ghost" size="sm">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Case Studies
          </Button>
        </Link>
        <Link href={`/protected/case-studies/${slug}`}>
          <Button size="sm">
            <IconEdit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Case Study Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={caseStudy.status === "published" ? "default" : "secondary"}>
            {caseStudy.status}
          </Badge>
          <Badge variant="outline">
            {caseStudy.type === "problem-solving" ? "Problem-Solving" : "Descriptive"}
          </Badge>
          {caseStudy.featured && <Badge variant="default">⭐ Featured</Badge>}
        </div>

        <h1 className="text-4xl font-bold">{caseStudy.title}</h1>

        {caseStudy.summary && (
          <p className="text-xl text-muted-foreground">{caseStudy.summary}</p>
        )}

        {/* Cover Image */}
        {caseStudy.coverUrl && (
          <div className="rounded-lg overflow-hidden">
            <img
              src={caseStudy.coverUrl}
              alt={caseStudy.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-y">
        {caseStudy.subjectName && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Subject</h3>
            <p className="text-lg">{caseStudy.subjectName}</p>
            {caseStudy.subjectType && (
              <p className="text-sm text-muted-foreground">{caseStudy.subjectType}</p>
            )}
          </div>
        )}

        {caseStudy.industry && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Industry</h3>
            <p className="text-lg">{caseStudy.industry}</p>
          </div>
        )}

        {caseStudy.role && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Role</h3>
            <p className="text-lg">{caseStudy.role}</p>
          </div>
        )}

        {caseStudy.timeline && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Timeline</h3>
            <p className="text-lg">{caseStudy.timeline}</p>
          </div>
        )}

        {caseStudy.teamSize && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Team Size</h3>
            <p className="text-lg">{caseStudy.teamSize}</p>
          </div>
        )}

        {caseStudy.audience && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Audience</h3>
            <p className="text-lg">{caseStudy.audience}</p>
          </div>
        )}
      </div>

      {/* Tags, Skills, Stack */}
      {(caseStudy.tags.length > 0 || caseStudy.skills.length > 0 || caseStudy.stack.length > 0) && (
        <div className="space-y-4">
          {caseStudy.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {caseStudy.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {caseStudy.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {caseStudy.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {caseStudy.stack.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {caseStudy.stack.map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Links */}
      {caseStudy.links.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Links</h3>
          <div className="flex flex-wrap gap-2">
            {caseStudy.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <Button variant="outline" size="sm">
                  {link.label}
                </Button>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      {caseStudy.metrics.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Key Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {caseStudy.metrics.map((metric, index) => (
              <div key={index} className="bg-muted p-4 rounded-lg text-center">
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {caseStudy.results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Results</h3>
          <ul className="list-disc list-inside space-y-1">
            {caseStudy.results.map((result, index) => (
              <li key={index}>{result.text}</li>
            ))}
          </ul>
        </div>
      )}

      {/* MDX Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none py-8">
        {mdxError ? (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Error Loading Content</h3>
            <p>{mdxError}</p>
            <p className="text-sm mt-2">Please edit the case study and fix any syntax errors in the MDX content.</p>
          </div>
        ) : mdxContent ? (
          <MDXRemote
            source={mdxContent}
            components={components}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        ) : (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-muted-foreground">No content available</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-6 text-sm text-muted-foreground">
        <p>Created: {new Date(caseStudy.createdAt).toLocaleDateString()}</p>
        <p>Last Updated: {new Date(caseStudy.updatedAt).toLocaleDateString()}</p>
        <p>Views: {caseStudy.views}</p>
      </div>
    </div>
  )
}

