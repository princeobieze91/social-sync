import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { LOGIN_PATH } from "@/const";
import {
  LayoutDashboard,
  PenSquare,
  CalendarDays,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  Bell,
  Facebook,
} from "lucide-react";
import { type ReactNode } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: PenSquare, label: "Composer", path: "/composer" },
  { icon: CalendarDays, label: "Calendar", path: "/calendar" },
  { icon: Users, label: "Accounts", path: "/accounts" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Facebook, label: "Facebook Demo", path: "/facebook-demo" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading SocialSync...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SocialSync</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            Sign in to continue
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Access your social media dashboard and manage all your accounts in one place.
          </p>
          <button
            onClick={() => { window.location.href = LOGIN_PATH; }}
            className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}

function AppLayoutContent({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { data: accounts } = trpc.account.connected.useQuery();

  const activeMenuItem = menuItems.find((item) => item.path === location.pathname);
  const connectedCount = (accounts || []).filter((a) => a.isConnected === "true").length;

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border/60">
        <SidebarHeader className="h-12 justify-center px-2">
          <Link to="/" className="flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-sm tracking-tight">SocialSync</span>
            )}
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-1 py-1">
          <SidebarMenu>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => navigate(item.path)}
                    tooltip={item.label}
                    className="h-8 transition-all"
                  >
                    <item.icon
                      className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                    {isActive && !isCollapsed && (
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/60" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3 gap-2">
          <div className="px-2 py-1.5">
            {!isCollapsed && (
              <div className="rounded-lg border bg-muted/50 p-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-muted-foreground">All systems operational</span>
                </div>
                <div className="text-[10px] text-muted-foreground/60">{connectedCount} accounts connected</div>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8 border shrink-0">
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium truncate leading-none">
                    {user?.name || "User"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate mt-1">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset style={{ marginLeft: isMobile ? 0 : (isCollapsed ? "2.2rem" : "10rem"), transition: "margin 0.2s ease" }}>
        {/* Top Bar */}
        <header className="h-14 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-8 w-8 -ml-1" />
            <h1 className="text-sm font-semibold text-foreground/90">
              {activeMenuItem?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/accounts")}
              className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
            >
              <Bell className="h-[18px] w-[18px] text-muted-foreground" />
              {connectedCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-primary">{connectedCount}</Badge>
              )}
            </button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
