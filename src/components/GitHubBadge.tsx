import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import type { Props } from "types";

const REPO_URL = "https://github.com/nathanemyers/nba-weekly-power-rankings";

const Link = styled.a`
  display: inline-flex;
  align-items: center;
  color: #a1a1a6;
  font-size: 1.5rem;
  transition: color 0.15s ease;

  &:hover,
  &:focus-visible {
    color: #ffffff;
  }
`;

export default function GitHubBadge(props: Props) {
  return (
    <Link
      className={props.className}
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View this project on GitHub"
    >
      <FontAwesomeIcon icon={faGithub} />
    </Link>
  );
}
