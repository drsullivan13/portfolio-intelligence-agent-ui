import { Link } from "wouter";
import { LogOut, Menu, LayoutDashboard, Settings as SettingsIcon, TrendingUp } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location === path;
  const userInitials = user?.username?.slice(0, 2).toUpperCase() || "??";
  const displayName = user?.username || "User";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4 space-y-6 fixed h-full inset-y-0 z-50">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
            P
          </div>
          <span className="font-bold text-lg tracking-tight">Portfolio Intel</span>
        </div>

        <nav className="flex-1 space-y-1">
          <Link href="/">
            <Button variant={isActive("/") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/ticker/NVDA">
            <Button variant={location.startsWith("/ticker") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
              <TrendingUp className="h-4 w-4" />
              Ticker View
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant={isActive("/settings") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </nav>

        <div className="mt-auto pt-4 border-t border-border space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">{userInitials}</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{displayName}</span>
              <span className="text-xs text-muted-foreground">Portfolio Manager</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between border-b border-border bg-card p-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
            P
          </div>
          <span className="font-bold text-lg">Portfolio Intel</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-card border-r border-border p-4">
            <div className="flex items-center gap-2 px-2 py-4 mb-6">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
                P
              </div>
              <span className="font-bold text-lg">Portfolio Intel</span>
            </div>
            <nav className="flex flex-col space-y-2">
              <Link href="/">
                <Button variant={isActive("/") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/ticker/NVDA">
                <Button variant={location.startsWith("/ticker") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
                  <TrendingUp className="h-4 w-4" />
                  Ticker View
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant={isActive("/settings") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </nav>
            <div className="mt-auto pt-4 border-t border-border">
              <div className="flex items-center gap-3 px-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">{userInitials}</span>
                </div>
                <span className="text-sm font-medium">{displayName}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
