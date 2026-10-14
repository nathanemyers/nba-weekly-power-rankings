import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface TeamSummaryProps {
  teamName: string;
  summary: string;
}

export default function TeamSummary(props: TeamSummaryProps) {
  return (
    <Card
      role="region"
      aria-label={`AI-generated summary for ${props.teamName}`}
      className="mt-5"
    >
      <CardContent>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{props.teamName}</h2>
          <Badge
            variant="outline"
            className="whitespace-nowrap text-muted-foreground"
          >
            AI-generated summary
          </Badge>
        </div>
        <p className="text-base leading-normal text-foreground-soft">
          {props.summary}
        </p>
      </CardContent>
    </Card>
  );
}
