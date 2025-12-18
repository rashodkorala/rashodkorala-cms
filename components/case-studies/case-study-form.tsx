"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import type { CaseStudy, CaseStudyFormData, Link as CaseStudyLink, Metric, Result } from "@/lib/types/case-study"
import { createOrUpdateCaseStudy, uploadMedia } from "@/lib/actions/case-studies"
import { IconPlus, IconTrash, IconUpload, IconDownload } from "@tabler/icons-react"
import Link from "next/link"

interface CaseStudyFormProps {
  caseStudy?: CaseStudy
  mdxContent?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function CaseStudyForm({ caseStudy, mdxContent = "" }: CaseStudyFormProps) {
  const router = useRouter()
  const isEditing = !!caseStudy

  const [formData, setFormData] = useState<CaseStudyFormData>({
    title: caseStudy?.title || "",
    slug: caseStudy?.slug || "",
    summary: caseStudy?.summary || "",
    type: caseStudy?.type || "problem-solving",
    status: caseStudy?.status || "draft",
    featured: caseStudy?.featured || false,
    publishedAt: caseStudy?.publishedAt || null,
    subjectName: caseStudy?.subjectName || "",
    subjectType: caseStudy?.subjectType || "",
    industry: caseStudy?.industry || "",
    audience: caseStudy?.audience || "",
    role: caseStudy?.role || "",
    teamSize: caseStudy?.teamSize || "",
    timeline: caseStudy?.timeline || "",
    tags: caseStudy?.tags || [],
    skills: caseStudy?.skills || [],
    stack: caseStudy?.stack || [],
    coverUrl: caseStudy?.coverUrl || null,
    galleryUrls: caseStudy?.galleryUrls || [],
    links: caseStudy?.links || [],
    results: caseStudy?.results || [],
    metrics: caseStudy?.metrics || [],
    mdxContent: mdxContent,
    seoTitle: caseStudy?.seoTitle || "",
    seoDescription: caseStudy?.seoDescription || "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [tagInput, setTagInput] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [stackInput, setStackInput] = useState("")

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: slugify(title),
    })
  }

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCoverImageFile(file)
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData({ ...formData, coverUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] })
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] })
      setSkillInput("")
    }
  }

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) })
  }

  const addStack = () => {
    if (stackInput.trim() && !formData.stack.includes(stackInput.trim())) {
      setFormData({ ...formData, stack: [...formData.stack, stackInput.trim()] })
      setStackInput("")
    }
  }

  const removeStack = (tech: string) => {
    setFormData({ ...formData, stack: formData.stack.filter((t) => t !== tech) })
  }

  const addLink = () => {
    setFormData({
      ...formData,
      links: [...formData.links, { label: "", url: "" }],
    })
  }

  const updateLink = (index: number, field: keyof CaseStudyLink, value: string) => {
    const newLinks = [...formData.links]
    newLinks[index] = { ...newLinks[index], [field]: value }
    setFormData({ ...formData, links: newLinks })
  }

  const removeLink = (index: number) => {
    setFormData({
      ...formData,
      links: formData.links.filter((_, i) => i !== index),
    })
  }

  const addResult = () => {
    setFormData({
      ...formData,
      results: [...formData.results, { text: "" }],
    })
  }

  const updateResult = (index: number, text: string) => {
    const newResults = [...formData.results]
    newResults[index] = { text }
    setFormData({ ...formData, results: newResults })
  }

  const removeResult = (index: number) => {
    setFormData({
      ...formData,
      results: formData.results.filter((_, i) => i !== index),
    })
  }

  const addMetric = () => {
    setFormData({
      ...formData,
      metrics: [...formData.metrics, { label: "", value: "" }],
    })
  }

  const updateMetric = (index: number, field: keyof Metric, value: string) => {
    const newMetrics = [...formData.metrics]
    newMetrics[index] = { ...newMetrics[index], [field]: value }
    setFormData({ ...formData, metrics: newMetrics })
  }

  const removeMetric = (index: number) => {
    setFormData({
      ...formData,
      metrics: formData.metrics.filter((_, i) => i !== index),
    })
  }

  const insertTemplate = () => {
    const template = `# Introduction

Brief overview of the project and what it accomplished.

## Background

Context about why this project was needed.

## Problem Statement

What challenge were you solving?

## Methodology

How did you approach the solution?

## Solution

What did you build or implement?

## Results

What were the outcomes?

## Key Takeaways

What did you learn?`

    setFormData({ ...formData, mdxContent: template })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.slug) {
      toast.error("Title and slug are required")
      return
    }

    if (!formData.mdxContent.trim()) {
      toast.error("MDX content is required")
      return
    }

    setIsLoading(true)

    try {
      // Upload cover image if there's a new file
      let coverUrl = formData.coverUrl
      if (coverImageFile) {
        coverUrl = await uploadMedia(coverImageFile)
      }

      const dataToSubmit = {
        ...formData,
        coverUrl,
      }

      await createOrUpdateCaseStudy(dataToSubmit, caseStudy?.id)

      toast.success(isEditing ? "Case study updated successfully" : "Case study created successfully")
      router.push("/protected/case-studies")
      router.refresh()
    } catch (error) {
      console.error("Error saving case study:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save case study")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
          <TabsTrigger value="proof">Links & Proof</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card className="p-6 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="My Amazing Project"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="my-amazing-project"
                required
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from title, but you can customize it
              </p>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Brief introduction or overview (used for listing and SEO)"
                rows={3}
              />
            </div>

            {/* MDX Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="mdxContent">MDX Content *</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={insertTemplate}>
                    Insert Template
                  </Button>
                  <Link href="/api/case-studies/download-template" target="_blank">
                    <Button type="button" variant="outline" size="sm">
                      <IconDownload className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </Link>
                </div>
              </div>
              <Textarea
                id="mdxContent"
                value={formData.mdxContent}
                onChange={(e) => setFormData({ ...formData, mdxContent: e.target.value })}
                placeholder="Write your case study content in MDX format..."
                rows={20}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Write your narrative here: Introduction, Problem, Solution, Results, etc.
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-4">
          <Card className="p-6 space-y-4">
            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Case Study Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "problem-solving" | "descriptive") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="problem-solving">Problem-Solving</SelectItem>
                  <SelectItem value="descriptive">Descriptive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "draft" | "published" | "archived") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, featured: checked as boolean })
                }
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Featured case study
              </Label>
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image</Label>
              <Input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleCoverImageUpload}
              />
              {formData.coverUrl && (
                <div className="mt-2">
                  <img
                    src={formData.coverUrl}
                    alt="Cover preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add a tag"
                />
                <Button type="button" onClick={addTag} size="sm">
                  <IconPlus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <IconTrash className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill"
                />
                <Button type="button" onClick={addSkill} size="sm">
                  <IconPlus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-destructive"
                    >
                      <IconTrash className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="space-y-2">
              <Label>Tech Stack</Label>
              <div className="flex gap-2">
                <Input
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addStack())}
                  placeholder="Add a technology"
                />
                <Button type="button" onClick={addStack} size="sm">
                  <IconPlus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.stack.map((tech) => (
                  <div
                    key={tech}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => removeStack(tech)}
                      className="hover:text-destructive"
                    >
                      <IconTrash className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SEO */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">SEO</h3>
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder="Leave blank to use title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  placeholder="Leave blank to use summary"
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Context Tab */}
        <TabsContent value="context" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input
                id="subjectName"
                value={formData.subjectName}
                onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                placeholder="Project, product, or company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectType">Subject Type</Label>
              <Input
                id="subjectType"
                value={formData.subjectType}
                onChange={(e) => setFormData({ ...formData, subjectType: e.target.value })}
                placeholder="e.g., Web App, Mobile App, API"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., E-commerce, Healthcare, Education"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                placeholder="Who was this for?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Your Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Lead Developer, Designer, Project Manager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamSize">Team Size</Label>
              <Input
                id="teamSize"
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                placeholder="e.g., Solo, 2-5, 6-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                placeholder="e.g., 3 months, 6 weeks"
              />
            </div>
          </Card>
        </TabsContent>

        {/* Links & Proof Tab */}
        <TabsContent value="proof" className="space-y-4">
          <Card className="p-6 space-y-6">
            {/* Links */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Links</Label>
                <Button type="button" onClick={addLink} size="sm" variant="outline">
                  <IconPlus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>
              {formData.links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={link.label}
                    onChange={(e) => updateLink(index, "label", e.target.value)}
                    placeholder="Label (e.g., Demo, GitHub)"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(index, "url", e.target.value)}
                    placeholder="https://..."
                  />
                  <Button
                    type="button"
                    onClick={() => removeLink(index)}
                    size="sm"
                    variant="ghost"
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Results</Label>
                <Button type="button" onClick={addResult} size="sm" variant="outline">
                  <IconPlus className="h-4 w-4 mr-2" />
                  Add Result
                </Button>
              </div>
              {formData.results.map((result, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={result.text}
                    onChange={(e) => updateResult(index, e.target.value)}
                    placeholder="e.g., Increased conversions by 40%"
                  />
                  <Button
                    type="button"
                    onClick={() => removeResult(index)}
                    size="sm"
                    variant="ghost"
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Key Metrics</Label>
                <Button type="button" onClick={addMetric} size="sm" variant="outline">
                  <IconPlus className="h-4 w-4 mr-2" />
                  Add Metric
                </Button>
              </div>
              {formData.metrics.map((metric, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={metric.label}
                    onChange={(e) => updateMetric(index, "label", e.target.value)}
                    placeholder="Label (e.g., Users, Downloads)"
                  />
                  <Input
                    value={metric.value}
                    onChange={(e) => updateMetric(index, "value", e.target.value)}
                    placeholder="Value (e.g., 10k+, 95%)"
                  />
                  <Button
                    type="button"
                    onClick={() => removeMetric(index)}
                    size="sm"
                    variant="ghost"
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/protected/case-studies")}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEditing ? "Update Case Study" : "Create Case Study"}
        </Button>
      </div>
    </form>
  )
}

