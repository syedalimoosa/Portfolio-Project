import { useState } from "react";
import type { Project } from "../data/projects";

export function ProjectCard({ project, index, view }: { project: Project; index: number; view: "grid" | "list" }) {
  const [failed, setFailed] = useState(false);
  return <article className={`project-card reveal ${view === "list" ? "project-list-card" : ""}`}>
    <a className="project-visual" href={project.url} target="_blank" rel="noreferrer noopener" data-cursor="view" aria-label={`View ${project.name} website`}>
      {project.image && !failed ? <img src={project.image} alt={`${project.name} website preview`} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <div className="project-art" aria-hidden="true"><span>{project.name.split(" ").map((part) => part[0]).join("")}</span><i>{project.category}</i></div>}
      <span className="project-number">{String(index + 1).padStart(2, "0")} / 09</span><span className="project-open" aria-hidden="true">&#8599;</span>
    </a>
    <div className="project-meta"><div><span>{project.category}</span><h3>{project.name}</h3></div><span className="project-platform">{project.platform}</span><p>{project.description}</p></div>
  </article>;
}
