import React from "react";
import "./ProjectCard.scss";
import StatusBadge from "../../status/statusBadge/StatusBadge";
import IconCard from "../../iconCard/IconCard";
import ProgressBar from "../../progressBar/ProgressBar";
import { FolderUserIcon, UserCircleIcon } from "@phosphor-icons/react";
import { Link } from "react-router";

function ProjectCard({ project }) {
  return (
    <Link
      to={project.id}
      key={project.id || project._id}
      className="generalCard projectCard"
    >
      <StatusBadge status={project.status} />
      <h3 className="textS">{project.name || "Unnamed Project"}</h3>
      <p className="textXS textLight">{project.description}</p>

      <div className="projectUserSegment">
        <IconCard
          name={project.client?.full_name}
          icon={UserCircleIcon}
          style="textXS"
        />
        <IconCard
          name={project.owner?.full_name}
          icon={FolderUserIcon}
          style="textXS"
        />
      </div>

      <ProgressBar
        completion={project.requirement_completion}
        label="Requirements"
      />
    </Link>
  );
}

export default ProjectCard;
