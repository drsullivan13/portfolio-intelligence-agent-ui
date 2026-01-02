import { Layout } from "@/components/layout";
import { useRoute, useLocation } from "wouter";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Filter, TrendingUp, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";
import { parseEventTimestamp } from "@/lib/date-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const AVAILABLE_TICKERS = ["NVDA", "TSLA", "AAPL", "MSFT", "GOOGL"];

export default function TickerView() {
  const [match, params] = useRoute("/ticker/:symbol");
  const [location, setLocation] = useLocation();
  const symbol = params?.symbol || "NVDA";
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL");
  
  // Fetch events for this ticker
  const { data: allEvents = [], isLoading } = useQuery({
    queryKey: ['ticker-events', symbol],
    queryFn: () => fetchEvents({ ticker: symbol }),
  });
  
  // Apply secondary filters
  const filteredEvents = allEvents.filter(e => {
    if (eventTypeFilter !== "ALL" && e.event_type !== eventTypeFilter) return false;
    return true;
  });

  // Calculate some ticker specific stats
  const newsCount = allEvents.filter(e => e.event_type === 'NEWS').length;
  const filingCount = allEvents.filter(e => e.event_type === 'SEC_FILING').length;
  const avgSentiment = allEvents.reduce((acc, curr) => acc + (curr.sentiment_score || 0), 0) / (allEvents.length || 1);

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
             <Button variant="ghost" size="icon">
               <ArrowLeft className="h-4 w-4" />
             </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="h-auto p-0 hover:bg-transparent font-bold text-4xl font-serif flex items-baseline gap-2 group">
                     {symbol}
                     <ChevronDown className="h-6 w-6 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="start" className="w-56">
                   <DropdownMenuLabel>Switch Ticker</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   {AVAILABLE_TICKERS.map((ticker) => (
                     <DropdownMenuItem 
                       key={ticker}
                       className="cursor-pointer"
                       onClick={() => setLocation(`/ticker/${ticker}`)}
                     >
                       {ticker}
                       {ticker === symbol && <TrendingUp className="ml-auto h-4 w-4 opacity-50" />}
                     </DropdownMenuItem>
                   ))}
                 </DropdownMenuContent>
               </DropdownMenu>
               <Badge variant="outline" className="text-sm self-start mt-2">NASDAQ</Badge>
            </div>
            <p className="text-muted-foreground">Portfolio Monitoring</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Stats */}
        <div className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Summary</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {isLoading ? (
                 <>
                   <Skeleton className="h-12 w-full" />
                   <Skeleton className="h-20 w-full" />
                 </>
               ) : (
                 <>
                   <div>
                     <div className="text-2xl font-bold">{allEvents.length}</div>
                     <div className="text-xs text-muted-foreground">Total Events (30 Days)</div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                     <div>
                       <div className="text-lg font-semibold text-blue-400">{newsCount}</div>
                       <div className="text-xs text-muted-foreground">News</div>
                     </div>
                     <div>
                       <div className="text-lg font-semibold text-amber-400">{filingCount}</div>
                       <div className="text-xs text-muted-foreground">Filings</div>
                     </div>
                   </div>

                   <div className="pt-4 border-t border-border">
                     <div className="flex items-center gap-2 mb-1">
                       <TrendingUp className="h-4 w-4 text-muted-foreground" />
                       <span className="text-sm font-medium">Sentiment Trend</span>
                     </div>
                     <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-gradient-to-r from-destructive via-warning to-success transition-all duration-500" 
                         style={{ width: `${((avgSentiment + 1) / 2) * 100}%` }}
                       />
                     </div>
                     <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                       <span>Bearish</span>
                       <span>Neutral</span>
                       <span>Bullish</span>
                     </div>
                   </div>
                 </>
               )}
             </CardContent>
           </Card>

           <Card className="bg-muted/20">
             <CardContent className="p-4">
               <h3 className="text-sm font-medium mb-2">Filters</h3>
               <div className="space-y-2">
                 <label className="text-xs text-muted-foreground">Event Type</label>
                 <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="NEWS">News</SelectItem>
                      <SelectItem value="SEC_FILING">SEC Filings</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
             </CardContent>
           </Card>
        </div>

        {/* Main Timeline */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-6">
             <Filter className="h-4 w-4 text-primary" />
             <h2 className="text-lg font-semibold">Event Timeline</h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-8">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : (
            <div className="relative space-y-8 pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-[2px] before:bg-border">
              {filteredEvents.map((event, index) => (
                <div key={event.event_id} className="relative animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                  {/* Timeline Node */}
                  <div className="absolute -left-[37px] top-6 h-6 w-6 rounded-full border-4 border-background bg-muted flex items-center justify-center z-10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  
                  {/* Date Header if it changes (simplified for now) */}
                  <div className="mb-2 text-xs font-mono text-muted-foreground">
                    {format(parseEventTimestamp(event.timestamp), "MMM d, h:mm a")}
                  </div>

                  <EventCard event={event} />
                </div>
              ))}

              {filteredEvents.length === 0 && !isLoading && (
                 <div className="py-12 text-center text-muted-foreground">
                   No events found for this filter.
                 </div>
              )}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
