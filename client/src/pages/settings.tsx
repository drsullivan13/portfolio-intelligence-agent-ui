import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Activity, Database, Shield, Plus, Trash2, RefreshCw, Loader2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWatchlist, updateWatchlist, testWebhook, WatchlistTicker } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTickerSymbol, setNewTickerSymbol] = useState("");
  const [newTickerName, setNewTickerName] = useState("");
  const [isAddTickerOpen, setIsAddTickerOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [showWebhookUrl, setShowWebhookUrl] = useState(false);

  // Fetch watchlist from DynamoDB
  const { data: watchlist, isLoading, refetch } = useQuery({
    queryKey: ['watchlist'],
    queryFn: fetchWatchlist,
  });

  const tickers = watchlist?.tickers || [];

  // Initialize webhook URL from fetched watchlist
  useEffect(() => {
    if (watchlist?.webhook_url) {
      setWebhookUrl(watchlist.webhook_url);
    }
  }, [watchlist]);

  // Mutation for updating watchlist
  const updateMutation = useMutation({
    mutationFn: updateWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAddTicker = () => {
    if (!newTickerSymbol || !newTickerName) {
      toast({
        title: "Error",
        description: "Please fill in both symbol and name.",
        variant: "destructive"
      });
      return;
    }

    if (tickers.some(t => t.symbol === newTickerSymbol.toUpperCase())) {
      toast({
        title: "Error",
        description: "Ticker already exists in watchlist.",
        variant: "destructive"
      });
      return;
    }

    const newTickers: WatchlistTicker[] = [...tickers, { 
      symbol: newTickerSymbol.toUpperCase(), 
      name: newTickerName, 
      status: "Active" 
    }];
    
    updateMutation.mutate(newTickers, {
      onSuccess: () => {
        setNewTickerSymbol("");
        setNewTickerName("");
        setIsAddTickerOpen(false);
        toast({
          title: "Ticker Added",
          description: `Successfully added ${newTickerSymbol.toUpperCase()} to watchlist.`,
        });
      }
    });
  };

  const handleDeleteTicker = (symbol: string) => {
    const newTickers = tickers.filter(t => t.symbol !== symbol);
    updateMutation.mutate(newTickers, {
      onSuccess: () => {
        toast({
          title: "Ticker Removed",
          description: `Removed ${symbol} from watchlist.`,
        });
      }
    });
  };

  const toggleTickerStatus = (symbol: string) => {
    const newTickers = tickers.map(t => {
      if (t.symbol === symbol) {
        return { ...t, status: t.status === "Active" ? "Inactive" as const : "Active" as const };
      }
      return t;
    });
    updateMutation.mutate(newTickers);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL first.",
        variant: "destructive"
      });
      return;
    }

    setIsTestingWebhook(true);
    try {
      await testWebhook(webhookUrl);
      toast({
        title: "Test Successful",
        description: "Test message sent to Slack successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test message",
        variant: "destructive"
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSaveWebhook = async () => {
    try {
      const updatedTickers = watchlist?.tickers || [];
      await updateWatchlist(updatedTickers, webhookUrl || null);
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast({
        title: "Webhook Saved",
        description: "Your Slack webhook URL has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save webhook URL. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div>
          <h1 className="text-3xl font-bold font-serif">System Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage your watchlist, notifications, and system health.</p>
        </div>

        <div className="grid gap-6">
          
          {/* Watchlist Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Watchlist</CardTitle>
                  <CardDescription>Tickers currently being monitored by the agent.</CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => refetch()}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Sync
                  </Button>
                  
                  <Dialog open={isAddTickerOpen} onOpenChange={setIsAddTickerOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Add Ticker
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Ticker</DialogTitle>
                        <DialogDescription>
                          Enter the ticker symbol and company name to start monitoring.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="symbol" className="text-right">
                            Symbol
                          </Label>
                          <Input
                            id="symbol"
                            data-testid="input-ticker-symbol"
                            value={newTickerSymbol}
                            onChange={(e) => setNewTickerSymbol(e.target.value.toUpperCase())}
                            placeholder="e.g. AMD"
                            className="col-span-3"
                            maxLength={5}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            data-testid="input-ticker-name"
                            value={newTickerName}
                            onChange={(e) => setNewTickerName(e.target.value)}
                            placeholder="e.g. Advanced Micro Devices"
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          data-testid="button-add-ticker"
                          onClick={handleAddTicker}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Add to Watchlist
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <Skeleton key={`ticker-skeleton-${i}`} className="h-16" />
                  ))
                ) : tickers.length > 0 ? (
                  tickers.filter(ticker => ticker && ticker.symbol).map((ticker) => (
                    <div key={ticker.symbol} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors group" data-testid={`ticker-row-${ticker.symbol}`}>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {ticker.symbol?.[0] || '?'}
                        </div>
                        <div>
                          <div className="font-bold" data-testid={`text-ticker-symbol-${ticker.symbol}`}>{ticker.symbol}</div>
                          <div className="text-xs text-muted-foreground">{ticker.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant="secondary" 
                          className={`cursor-pointer transition-colors ${
                            ticker.status === "Active" 
                              ? "bg-success/10 text-success hover:bg-success/20 border-success/20" 
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                          onClick={() => toggleTickerStatus(ticker.symbol)}
                          data-testid={`badge-status-${ticker.symbol}`}
                        >
                          {ticker.status}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteTicker(ticker.symbol)}
                          disabled={updateMutation.isPending}
                          data-testid={`button-delete-${ticker.symbol}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                    No tickers in watchlist. Add one to start monitoring.
                  </div>
                )}
                
                {watchlist?.updated_at && (
                  <div className="text-xs text-muted-foreground text-right pt-2">
                    Last synced: {new Date(watchlist.updated_at).toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure your personal Slack webhook to receive real-time alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Slack Webhook URL</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="webhook-url"
                      type={showWebhookUrl ? "text" : "password"}
                      placeholder="https://hooks.slack.com/services/..."
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="pr-10"
                    />
                    {webhookUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowWebhookUrl(!showWebhookUrl)}
                        aria-label={showWebhookUrl ? "Hide webhook URL" : "Show webhook URL"}
                      >
                        {showWebhookUrl ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTestWebhook}
                    disabled={isTestingWebhook || !webhookUrl}
                  >
                    {isTestingWebhook ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test"
                    )}
                  </Button>
                  <Button
                    onClick={handleSaveWebhook}
                    disabled={!webhookUrl && !watchlist?.webhook_url}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to use system default webhook.{" "}
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Learn how to create a webhook
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card/50">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Database className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">DynamoDB Status</span>
                  </div>
                  <div className="text-xl font-bold text-success flex items-center gap-2">
                    Operational
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border bg-card/50">
                   <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">Last Detection Run</span>
                  </div>
                  <div className="text-xl font-bold">
                    2 min ago
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border bg-card/50">
                   <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">API Latency</span>
                  </div>
                  <div className="text-xl font-bold text-success">
                    45ms
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
}
