"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import type { Project, ProjectInsert, ProjectUpdate } from "@/lib/types/project"
import { createProject, updateProject } from "@/lib/actions/projects"

interface ProjectFormProps {
  project?: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectForm({ project, open, onOpenChange }: ProjectFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!project

  const [formData, setFormData] = useState<ProjectInsert>({
    name: "",
    description: "",
    category: "",
    status: "Planning",
    progress: 0,
    priority: "Medium",
    dueDate: "",
    imageUrl: [],
    coverImageUrl: "",
    websiteUrl: "",
    projectUrl: "",
    githubUrl: "",
    technologies: [],
    featured: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [techInput, setTechInput] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        category: project.category,
        status: project.status,
        progress: project.progress,
        priority: project.priority,
        dueDate: project.dueDate || "",
        imageUrl: project.imageUrl || [],
        coverImageUrl: project.coverImageUrl || "",
        websiteUrl: project.websiteUrl || "",
        projectUrl: project.projectUrl || "",
        githubUrl: project.githubUrl || "",
        technologies: project.technologies || [],
        featured: project.featured,
      })
      setSelectedFiles([])
      setPreviewUrls({})
    } else {
      setFormData({
        name: "",
        description: "",
        category: "",
        status: "Planning",
        progress: 0,
        priority: "Medium",
        dueDate: "",
        imageUrl: [],
        coverImageUrl: "",
        websiteUrl: "",
        projectUrl: "",
        githubUrl: "",
        technologies: [],
        featured: false,
      })
      setSelectedFiles([])
      setPreviewUrls({})
    }
  }, [project, open])

  // Clean up preview URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate files
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`)
        return false
      }
      return true
    })

    // Create preview URLs
    const newPreviews: Record<string, string> = {}
    validFiles.forEach((file) => {
      newPreviews[file.name] = URL.createObjectURL(file)
    })

    setSelectedFiles((prev) => [...prev, ...validFiles])
    setPreviewUrls((prev) => ({ ...prev, ...newPreviews }))
  }

  const removeFile = (index: number) => {
    const fileToRemove = selectedFiles[index]
    if (previewUrls[fileToRemove.name]) {
      URL.revokeObjectURL(previewUrls[fileToRemove.name])
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => {
      const newPreviews = { ...prev }
      delete newPreviews[fileToRemove.name]
      return newPreviews
    })
  }

  const generateUniqueName = (file: File) => {
    const extension = file.name.split(".").pop() ?? "jpg"
    const randomPart =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
    return `${randomPart}.${extension}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Upload selected files to media bucket
      const uploadedUrls: string[] = []
      if (selectedFiles.length > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("You must be logged in to upload images")
        }

        for (const file of selectedFiles) {
          const uniqueName = generateUniqueName(file)
          const filePath = `projects/${uniqueName}`

          const { error: storageError } = await supabase.storage
            .from("media")
            .upload(filePath, file)

          if (storageError) {
            console.error("[ProjectForm] Storage upload error:", storageError)
            throw new Error(`Failed to upload image: ${storageError.message}`)
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("media").getPublicUrl(filePath)

          uploadedUrls.push(publicUrl)
        }
      }

      // Combine existing images with newly uploaded ones
      const allImageUrls = [
        ...(formData.imageUrl || []),
        ...uploadedUrls,
      ]

      if (isEditing && project) {
        const updateData: ProjectUpdate = {
          id: project.id,
          ...formData,
          imageUrl: allImageUrls,
        }
        await updateProject(updateData)
        toast.success("Project updated successfully")
      } else {
        await createProject({
          ...formData,
          imageUrl: allImageUrls,
        })
        toast.success("Project created successfully")
      }
      onOpenChange(false)
      // Small delay to ensure drawer closes before refresh
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save project"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const addTechnology = () => {
    if (techInput.trim()) {
      setFormData({
        ...formData,
        technologies: [...(formData.technologies || []), techInput.trim()],
      })
      setTechInput("")
    }
  }

  const removeTechnology = (index: number) => {
    setFormData({
      ...formData,
      technologies: formData.technologies?.filter((_, i) => i !== index) || [],
    })
  }

  const removeExistingImage = (index: number) => {
    setFormData({
      ...formData,
      imageUrl: formData.imageUrl?.filter((_, i) => i !== index) || [],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Project" : "New Project"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your project details"
              : "Add a new project to your portfolio"}
          </DialogDescription>
        </DialogHeader>
        <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., E-commerce Platform"
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe your project..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="e.g., Web Development"
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Project["status"]) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    progress: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Project["priority"]) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate || ""}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="projectImages">
              {isEditing ? "Project Images (select files to add)" : "Project Images *"}
            </Label>
            <Input
              id="projectImages"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileChange}
              required={!isEditing || selectedFiles.length === 0}
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: JPEG, PNG, WEBP, GIF (max 10MB each). You can select multiple files.
            </p>

            {/* Preview of selected files */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg border overflow-hidden bg-muted"
                  >
                    <div className="aspect-video relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrls[file.name]}
                        alt={file.name}
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs p-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Existing images (when editing) */}
            {isEditing && formData.imageUrl && formData.imageUrl.length > 0 && (
              <div className="mt-2">
                <Label className="text-sm text-muted-foreground">Existing Images</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {formData.imageUrl.map((url, index) => {
                    const isCover = formData.coverImageUrl === url
                    return (
                      <div
                        key={index}
                        className={`relative group rounded-lg border overflow-hidden bg-muted ${
                          isCover ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <div className="aspect-video relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Project image ${index + 1}`}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                          <div className="absolute top-1 left-1 flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({ ...formData, coverImageUrl: url })
                              }
                              className={`bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium transition-opacity ${
                                isCover
                                  ? "opacity-100 text-primary"
                                  : "opacity-0 group-hover:opacity-100"
                              }`}
                              title="Set as cover photo"
                            >
                              {isCover ? "✓ Cover" : "Set Cover"}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl || ""}
                onChange={(e) =>
                  setFormData({ ...formData, websiteUrl: e.target.value })
                }
                placeholder="https://example.com"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="projectUrl">Project URL</Label>
              <Input
                id="projectUrl"
                type="url"
                value={formData.projectUrl || ""}
                onChange={(e) =>
                  setFormData({ ...formData, projectUrl: e.target.value })
                }
                placeholder="https://example.com"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              type="url"
              value={formData.githubUrl || ""}
              onChange={(e) =>
                setFormData({ ...formData, githubUrl: e.target.value })
              }
              placeholder="https://github.com/user/repo"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="technologies">Technologies</Label>
            <div className="flex gap-2">
              <Input
                id="technologies"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTechnology()
                  }
                }}
                placeholder="Add technology (press Enter)"
              />
              <Button type="button" onClick={addTechnology} variant="outline">
                Add
              </Button>
            </div>
            {formData.technologies && formData.technologies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.technologies.map((tech, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                  >
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => removeTechnology(index)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, featured: !!checked })
              }
            />
            <Label htmlFor="featured" className="cursor-pointer">
              Featured project (show on frontend)
            </Label>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" disabled={isLoading}>
            {isLoading ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

