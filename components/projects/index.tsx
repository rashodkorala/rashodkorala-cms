"use client"

import { useState, useEffect } from "react"
import { IconDotsVertical, IconEdit, IconFolder, IconPlus, IconRefresh, IconStar, IconTrash, IconTrendingUp } from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProjectForm } from "./project-form"
import type { Project } from "@/lib/types/project"
import { deleteProject } from "@/lib/actions/projects"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ProjectsProps {
  initialProjects: Project[]
}

const Projects = ({ initialProjects }: ProjectsProps) => {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Sync state when initialProjects changes (after refresh)
  useEffect(() => {
    setProjects(initialProjects)
  }, [initialProjects])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return
    }

    try {
      await deleteProject(id)
      setProjects(projects.filter((p) => p.id !== id))
      toast.success("Project deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project"
      )
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setIsFormOpen(true)
  }

  const handleNewProject = () => {
    setEditingProject(null)
    setIsFormOpen(true)
  }

  const handleFormClose = (shouldRefresh: boolean = true) => {
    setIsFormOpen(false)
    setEditingProject(null)
    if (shouldRefresh) {
      router.refresh()
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      router.refresh()
      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success("Data refreshed")
    } catch {
      toast.error("Failed to refresh data")
    } finally {
      setIsRefreshing(false)
    }
  }

  const inProgress = projects.filter((p) => p.status === "In Progress").length
  const completed = projects.filter((p) => p.status === "Completed").length
  const onHold = projects.filter((p) => p.status === "On Hold").length

  return (
    <div className="flex flex-grow flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Stats Cards */}
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:px-6 @xl/main:grid-cols-4">
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total Projects</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {projects.length}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <IconTrendingUp />
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  All your projects in one place
                </div>
              </CardFooter>
            </Card>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>In Progress</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {inProgress}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Projects currently being worked on
                </div>
              </CardFooter>
            </Card>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Completed</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {completed}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 dark:text-green-400">
                    Done
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Successfully completed projects
                </div>
              </CardFooter>
            </Card>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>On Hold</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {onHold}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                    Paused
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Projects temporarily paused
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Projects Table */}
          <div className="px-4 lg:px-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">All Projects</h2>
                <p className="text-sm text-muted-foreground">
                  Manage and track your projects
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                >
                  <IconRefresh
                    className={cn(
                      "size-4",
                      isRefreshing && "animate-spin"
                    )}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button onClick={handleNewProject}>
                  <IconPlus className="size-4" />
                  New Project
                </Button>
              </div>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No projects yet. Click "New Project" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconFolder className="size-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{project.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {project.category}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              project.status === "Completed"
                                ? "text-green-600 dark:text-green-400"
                                : project.status === "In Progress"
                                ? "text-yellow-600 dark:text-yellow-400"
                                : project.status === "On Hold"
                                ? "text-gray-600 dark:text-gray-400"
                                : ""
                            }
                          >
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {project.progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              project.priority === "High"
                                ? "text-red-600 dark:text-red-400"
                                : project.priority === "Medium"
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-blue-600 dark:text-blue-400"
                            }
                          >
                            {project.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {project.dueDate
                            ? new Date(project.dueDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {project.featured && (
                            <IconStar className="size-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                                size="icon"
                              >
                                <IconDotsVertical />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuItem onClick={() => handleEdit(project)}>
                                <IconEdit className="size-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(project.id)}
                              >
                                <IconTrash className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
      <ProjectForm
        project={editingProject}
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleFormClose()
          } else {
            setIsFormOpen(true)
          }
        }}
      />
    </div>
  )
}

export default Projects

