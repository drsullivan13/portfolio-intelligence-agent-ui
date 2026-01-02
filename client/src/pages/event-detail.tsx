import { Layout } from "@/components/layout";
import { useRoute } from "wouter";
import { mockEvents } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Share2, Printer, AlertTriangle, Info, TrendingUp, TrendingDown, Minus, Clock, Search } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

export default function EventDetail() {
  const [match, params] = useRoute("/event/:id");
  const event = mockEvents.find(e => e.event_id === params?.id);

  if (!event) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-2xl font-bold mb-2 font-serif">Event Not Found</h1>
          <p className="text-muted-foreground mb-4">The event you are looking for does not exist or has been removed.</p>
          <Link href="/">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isNews = event.event_type === 'NEWS';
  const sentimentScore = event.sentiment_score ?? 0;

  const getSentimentIcon = () => {
    if (!event.sentiment_score) return <Minus className="h-5 w-5" />;
    if (event.sentiment_score > 0.2) return <TrendingUp className="h-5 w-5" />;
    if (event.sentiment_score < -0.2) return <TrendingDown className="h-5 w-5" />;
    return <Minus className="h-5 w-5" />;
  };

  return (
    <Layout>
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Event Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="text-base px-3 py-1 font-bold tracking-tight">
                {event.ticker}
              </Badge>
              <Badge variant={isNews ? "default" : "secondary"} className="text-sm">
                {isNews ? "News" : "SEC Filing"}
              </Badge>
              <span className="text-muted-foreground text-sm font-mono">
                {format(new Date(event.timestamp), "MMM d, yyyy • h:mm a")}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight font-serif text-foreground">
              {event.headline}
            </h1>

            <div className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer w-fit group">
              <ExternalLink className="h-4 w-4" />
              <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium border-b border-transparent group-hover:border-primary/50">
                View Original Source
              </a>
            </div>
          </div>

          {/* Analysis Section */}
          {event.status === 'ANALYZED' && event.analysis ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards delay-100">
              
              {/* Executive Summary */}
              <Card className="bg-card/50 border-primary/20 shadow-sm overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="h-1 bg-gradient-to-r from-primary to-accent w-full" />
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-serif tracking-wide">
                    <span>AI Executive Summary</span>
                    <Badge variant={event.analysis.confidence_level === 'HIGH' ? "default" : "secondary"} className="font-sans font-normal">
                      {event.analysis.confidence_level} Confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed text-foreground/90 font-serif">
                    {event.analysis.summary}
                  </p>
                </CardContent>
              </Card>

              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {event.analysis.key_insights.map((insight, i) => (
                      <li key={i} className="flex gap-4 text-base group">
                        <span className="text-primary mt-2 h-1.5 w-1.5 rounded-full bg-current shrink-0 group-hover:scale-150 transition-transform" />
                        <span className="leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Impact Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Card className="bg-muted/30 border-border/50">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Market Implications</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-sm leading-relaxed">{event.analysis.impact_assessment.market_implications}</p>
                   </CardContent>
                 </Card>
                 <Card className="bg-muted/30 border-border/50">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Financial Impact</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-sm leading-relaxed">{event.analysis.impact_assessment.financial_impact}</p>
                   </CardContent>
                 </Card>
                 <Card className="bg-muted/30 border-border/50">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Strategic Significance</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-sm leading-relaxed">{event.analysis.impact_assessment.strategic_significance}</p>
                   </CardContent>
                 </Card>
              </div>

            </div>
          ) : (
             <Card className="border-warning/50 bg-warning/5">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                   <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center mb-4 text-warning animate-pulse">
                      <Clock className="h-6 w-6" />
                   </div>
                   <h3 className="text-lg font-semibold text-warning mb-2 font-serif">Analysis Pending</h3>
                   <p className="text-muted-foreground max-w-md">
                     Our AI models are currently processing this event. Detailed insights, sentiment analysis, and impact assessment will be available shortly.
                   </p>
                </CardContent>
             </Card>
          )}

        </div>

        {/* Right Column - Context & Meta */}
        <div className="space-y-6">
          
          {/* Sentiment Card */}
          {isNews && event.status === 'ANALYZED' && (
            <Card className={cn(
               "border-l-4 overflow-hidden relative",
               sentimentScore > 0.2 ? "border-l-success" : 
               sentimentScore < -0.2 ? "border-l-destructive" : "border-l-warning"
            )}>
              <div className={cn(
                "absolute inset-0 opacity-5 pointer-events-none",
                sentimentScore > 0.2 ? "bg-success" : 
                sentimentScore < -0.2 ? "bg-destructive" : "bg-warning"
              )} />
              <CardHeader className="pb-2">
                 <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-full",
                    sentimentScore > 0.2 ? "bg-success/10 text-success" : 
                    sentimentScore < -0.2 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                  )}>
                    {getSentimentIcon()}
                  </div>
                  <div>
                    <div className={cn(
                      "text-2xl font-bold font-serif",
                      sentimentScore > 0.2 ? "text-success" : 
                      sentimentScore < -0.2 ? "text-destructive" : "text-warning"
                    )}>
                      {sentimentScore > 0.2 ? "Bullish" : sentimentScore < -0.2 ? "Bearish" : "Neutral"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      Score: {sentimentScore} • Confidence: High
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Context */}
          {event.analysis?.related_context && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                  <Info className="h-4 w-4 text-primary" />
                  Related Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {event.analysis.related_context}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Investigation Areas */}
          {event.analysis?.investigation_areas && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                  <Search className="h-4 w-4 text-primary" />
                  Investigation Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <ul className="space-y-3">
                   {event.analysis.investigation_areas.map((area, i) => (
                     <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                       <span className="text-primary">•</span>
                       <span>{area}</span>
                     </li>
                   ))}
                 </ul>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-2 pt-4 border-t border-border font-mono">
            <div className="flex justify-between">
              <span>Event ID:</span>
              <span className="text-foreground">{event.event_id.substring(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Detected:</span>
              <span className="text-foreground">{format(new Date(event.detected_at), "HH:mm:ss")}</span>
            </div>
            <div className="flex justify-between">
              <span>Model:</span>
              <span className="text-foreground">{event.processing_metadata?.model_version}</span>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}
