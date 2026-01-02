import { Event } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { 
  Newspaper, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  Clock,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { parseEventTimestamp } from "@/lib/date-utils";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const isNews = event.event_type === 'NEWS';
  const sentimentScore = event.sentiment_score ?? 0;
  
  // Determine card border/bg based on sentiment/status
  let sentimentColor = "border-border";
  let sentimentBg = "bg-card";
  
  if (isNews && event.status === 'ANALYZED') {
    if (sentimentScore > 0.2) {
      sentimentColor = "border-success/30 hover:border-success/50";
      sentimentBg = "bg-success/5";
    } else if (sentimentScore < -0.2) {
      sentimentColor = "border-destructive/30 hover:border-destructive/50";
      sentimentBg = "bg-destructive/5";
    }
  }

  const getSentimentIcon = () => {
    if (!event.sentiment_score) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (event.sentiment_score > 0.2) return <TrendingUp className="h-4 w-4 text-success" />;
    if (event.sentiment_score < -0.2) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-warning" />;
  };

  const eventDate = parseEventTimestamp(event.timestamp);

  return (
    <Link href={`/event/${event.event_id}`}>
      <Card className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-[2px]", 
        sentimentColor, 
        sentimentBg
      )}>
        <CardContent className="p-5">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 space-y-3">
              {/* Header Row */}
              <div className="flex items-center gap-3 text-sm">
                <span className="font-bold text-foreground tracking-wide">{event.ticker}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  {formatDistanceToNow(eventDate, { addSuffix: true })}
                </span>
                
                {event.status === 'ANALYZED' && isNews && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/50 border border-border">
                      {getSentimentIcon()}
                      <span className={cn(
                        "text-xs font-medium",
                        sentimentScore > 0.2 ? "text-success" : 
                        sentimentScore < -0.2 ? "text-destructive" : "text-warning"
                      )}>
                        {Math.abs(sentimentScore).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Headline */}
              <h3 className="text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
                {event.headline}
              </h3>

              {/* Summary Preview */}
              {event.analysis?.summary && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.analysis.summary}
                </p>
              )}

              {/* Footer Row */}
              <div className="flex items-center gap-3 pt-1">
                <Badge variant="outline" className={cn(
                  "gap-1.5 px-2.5 py-0.5",
                  isNews ? "text-blue-400 border-blue-400/20 bg-blue-400/5" : "text-amber-400 border-amber-400/20 bg-amber-400/5"
                )}>
                  {isNews ? <Newspaper className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                  {isNews ? "News" : "SEC Filing"}
                </Badge>

                {event.status === 'PENDING_ANALYSIS' ? (
                  <Badge variant="secondary" className="gap-1.5 bg-warning/10 text-warning border-warning/20">
                    <Clock className="h-3 w-3 animate-pulse" />
                    Analysis Pending
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1.5 bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Analyzed
                  </Badge>
                )}

                {event.analysis?.confidence_level && (
                  <Badge variant="outline" className="text-muted-foreground text-xs">
                    {event.analysis.confidence_level} Confidence
                  </Badge>
                )}
              </div>
            </div>
            
            <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
               <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
