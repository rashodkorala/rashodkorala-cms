"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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
import { useIsMobile } from "@/hooks/use-mobile"

interface ProjectFormProps {
  project?: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectForm({ project, open, onOpenChange }: ProjectFormProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
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
    websiteUrl: "",
    projectUrl: "",
    githubUrl: "",
    technologies: [],
    featured: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [techInput, setTechInput] = useState("")
  const [imageInput, setImageInput] = useState("")

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
        websiteUrl: project.websiteUrl || "",
        projectUrl: project.projectUrl || "",
        githubUrl: project.githubUrl || "",
        technologies: project.technologies || [],
        featured: project.featured,
      })
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
        websiteUrl: "",
        projectUrl: "",
        githubUrl: "",
        technologies: [],
        featured: false,
      })
    }
  }, [project, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isEditing && project) {
        const updateData: ProjectUpdate = {
          id: project.id,
          ...formData,
        }
        await updateProject(updateData)
        toast.success("Project updated successfully")
      } else {
        await createProject(formData)
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

  const addImage = () => {
    if (imageInput.trim()) {
      setFormData({
        ...formData,
        imageUrl: [...(formData.imageUrl || []), imageInput.trim()],
      })
      setImageInput("")
    }
  }

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      imageUrl: formData.imageUrl?.filter((_, i) => i !== index) || [],
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? "bottom" : "right"}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>{isEditing ? "Edit Project" : "New Project"}</DrawerTitle>
          <DrawerDescription>
            {isEditing
              ? "Update your project details"
              : "Add a new project to your portfolio"}
          </DrawerDescription>
        </DrawerHeader>
        <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-4 px-4">
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
            <Label htmlFor="imageUrl">Image URLs</Label>
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                type="url"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addImage()
                  }
                }}
                placeholder="Add image URL (press Enter)"
              />
              <Button type="button" onClick={addImage} variant="outline">
                Add
              </Button>
            </div>
            {formData.imageUrl && formData.imageUrl.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {formData.imageUrl.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md text-sm"
                  >
                    <span className="flex-1 truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
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
        <DrawerFooter>
          <Button type="submit" form="project-form" disabled={isLoading}>
            {isLoading ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

