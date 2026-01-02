import { Layout } from "@/components/layout";
import { mockEvents, mockPortfolioMetrics } from "@/lib/mock-data";
import { StatsCard } from "@/components/stats-card";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FileText, Newspaper, RefreshCw, Search, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Event } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ANALYZED' | 'PENDING'>('ALL');
  const [tickerFilter, setTickerFilter] = useState<string | null>(null);
  
  const filteredEvents = mockEvents.filter((event: Event) => {
    if (statusFilter === 'ANALYZED' && event.status !== 'ANALYZED') return false;
    if (statusFilter === 'PENDING' && event.status !== 'PENDING_ANALYSIS') return false;
    if (tickerFilter && event.ticker !== tickerFilter) return false;
    return true;
  });

  const uniqueTickers = Array.from(new Set(mockEvents.map(e => e.ticker)));

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif">Portfolio Intelligence</h1>
          <p className="text-muted-foreground mt-1">Real-time market event monitoring and analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden md:inline-block">Last updated: Just now</span>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <StatsCard 
          title="Total Events" 
          value={mockPortfolioMetrics.total_events} 
          icon={Calendar} 
          trend="+12% from yesterday"
          trendUp={true}
        />
        <StatsCard 
          title="Analyzed" 
          value={mockPortfolioMetrics.events_by_status.ANALYZED} 
          icon={CheckCircle2} 
          iconColor="text-success"
        />
        <StatsCard 
          title="News Articles" 
          value={mockPortfolioMetrics.events_by_type.NEWS} 
          icon={Newspaper} 
          iconColor="text-blue-400"
        />
        <StatsCard 
          title="SEC Filings" 
          value={mockPortfolioMetrics.events_by_type.SEC_FILING} 
          icon={FileText} 
          iconColor="text-amber-400"
        />
      </div>

      {/* Filters */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Tabs defaultValue="ALL" className="w-full md:w-auto" onValueChange={(v) => setStatusFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="ALL">All Events</TabsTrigger>
              <TabsTrigger value="ANALYZED">Analyzed</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto mask-linear-fade">
             <Button 
               variant={tickerFilter === null ? "secondary" : "ghost"} 
               size="sm"
               onClick={() => setTickerFilter(null)}
               className="rounded-full px-4"
             >
               All Tickers
             </Button>
             {uniqueTickers.map(ticker => (
               <Button
                 key={ticker}
                 variant={tickerFilter === ticker ? "secondary" : "outline"}
                 size="sm"
                 onClick={() => setTickerFilter(ticker === tickerFilter ? null : ticker)}
                 className="rounded-full px-4"
               >
                 {ticker}
               </Button>
             ))}
          </div>
        </div>
      </div>

      {/* Event Feed */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <h2 className="text-xl font-semibold tracking-tight font-serif">Recent Activity</h2>
        <div className="grid gap-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <EventCard key={event.event_id} event={event} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed border-border">
              <p>No events found matching your filters.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
