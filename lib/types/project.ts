export type ProjectStatus = "In Progress" | "Completed" | "On Hold" | "Planning"
export type ProjectPriority = "High" | "Medium" | "Low"

// Database schema (snake_case)
export interface ProjectDB {
  id: string
  name: string
  description: string | null
  category: string
  status: ProjectStatus
  progress: number
  priority: ProjectPriority
  due_date: string | null
  image_url: string[] | null
  cover_image_url: string | null
  website_url: string | null
  project_url: string | null
  github_url: string | null
  technologies: string[] | null
  featured: boolean
  created_at: string
  updated_at: string
  user_id: string
}

// Application type (camelCase)
export interface Project {
  id: string
  name: string
  description: string | null
  category: string
  status: ProjectStatus
  progress: number
  priority: ProjectPriority
  dueDate: string | null
  imageUrl: string[] | null
  coverImageUrl: string | null
  websiteUrl: string | null
  projectUrl: string | null
  githubUrl: string | null
  technologies: string[] | null
  featured: boolean
  created_at: string
  updated_at: string
  user_id: string
}

export interface ProjectInsert {
  name: string
  description?: string | null
  category: string
  status: ProjectStatus
  progress: number
  priority: ProjectPriority
  dueDate?: string | null
  imageUrl?: string[] | null
  coverImageUrl?: string | null
  websiteUrl?: string | null
  projectUrl?: string | null
  githubUrl?: string | null
  technologies?: string[] | null
  featured?: boolean
}

export interface ProjectUpdate extends Partial<ProjectInsert> {
  id: string
}

