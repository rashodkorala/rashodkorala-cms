import Projects from "@/components/projects";
import { getProjects } from "@/lib/actions/projects";

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <Projects initialProjects={projects} />;
}

