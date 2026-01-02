import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Activity, Database, Shield, Plus, Trash2 } from "lucide-react";

export default function Settings() {
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
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Ticker
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { symbol: "NVDA", name: "NVIDIA Corporation", status: "Active" },
                  { symbol: "TSLA", name: "Tesla, Inc.", status: "Active" },
                  { symbol: "AAPL", name: "Apple Inc.", status: "Active" },
                  { symbol: "MSFT", name: "Microsoft Corporation", status: "Active" },
                  { symbol: "GOOGL", name: "Alphabet Inc.", status: "Active" },
                ].map((ticker) => (
                  <div key={ticker.symbol} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {ticker.symbol[0]}
                      </div>
                      <div>
                        <div className="font-bold">{ticker.symbol}</div>
                        <div className="text-xs text-muted-foreground">{ticker.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 border-success/20">
                        {ticker.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Slack Webhook</div>
                  <div className="text-sm text-muted-foreground">Send real-time alerts to #portfolio-intel channel</div>
                </div>
                <Switch checked={true} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Email Digest</div>
                  <div className="text-sm text-muted-foreground">Daily summary of high-impact events</div>
                </div>
                <Switch checked={false} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Confidence Threshold</div>
                  <div className="text-sm text-muted-foreground">Only alert for High confidence analysis</div>
                </div>
                <Switch checked={true} />
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
