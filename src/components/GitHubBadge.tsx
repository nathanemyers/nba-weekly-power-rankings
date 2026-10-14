import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { cn } from "@/lib/utils";
import type { Props } from "types";

const REPO_URL = "https://github.com/nathanemyers/nba-weekly-power-rankings";

export default function GitHubBadge(props: Props) {
  return (
    <a
      className={cn(
        "inline-flex items-center text-2xl text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:text-foreground rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        props.className,
      )}
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View this project on GitHub"
    >
      <FontAwesomeIcon icon={faGithub} />
    </a>
  );
}
