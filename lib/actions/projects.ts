"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Project, ProjectDB, ProjectInsert, ProjectUpdate } from "@/lib/types/project"

function transformProject(project: ProjectDB): Project {
  return {
    ...project,
    dueDate: project.due_date,
    imageUrl: project.image_url || [],
    coverImageUrl: project.cover_image_url,
    websiteUrl: project.website_url,
    projectUrl: project.project_url,
    githubUrl: project.github_url,
  }
}

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`)
  }

  return (data || []).map(transformProject)
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(`Failed to fetch project: ${error.message}`)
  }

  return data ? transformProject(data) : null
}

export async function createProject(project: ProjectInsert): Promise<Project> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: project.name,
      description: project.description || null,
      category: project.category,
      status: project.status,
      progress: project.progress,
      priority: project.priority,
      user_id: user.id,
      due_date: project.dueDate || null,
      image_url: project.imageUrl || [],
      cover_image_url: project.coverImageUrl || null,
      website_url: project.websiteUrl || null,
      project_url: project.projectUrl || null,
      github_url: project.githubUrl || null,
      technologies: project.technologies || [],
      featured: project.featured || false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`)
  }

  revalidatePath("/protected/projects")
  return transformProject(data)
}

export async function updateProject(project: ProjectUpdate): Promise<Project> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { id, ...updates } = project

  const updateData: any = {}
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate
  if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl || []
  if (updates.coverImageUrl !== undefined) updateData.cover_image_url = updates.coverImageUrl
  if (updates.websiteUrl !== undefined) updateData.website_url = updates.websiteUrl
  if (updates.projectUrl !== undefined) updateData.project_url = updates.projectUrl
  if (updates.githubUrl !== undefined) updateData.github_url = updates.githubUrl
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.progress !== undefined) updateData.progress = updates.progress
  if (updates.priority !== undefined) updateData.priority = updates.priority
  if (updates.technologies !== undefined) updateData.technologies = updates.technologies
  if (updates.featured !== undefined) updateData.featured = updates.featured

  const { data, error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`)
  }

  revalidatePath("/protected/projects")
  return transformProject(data)
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`)
  }

  revalidatePath("/protected/projects")
}

