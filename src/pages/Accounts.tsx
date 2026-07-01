import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Unlink,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Facebook,
  Instagram,
  RefreshCw,
  LogIn,
} from "lucide-react";

const platformConfig: Record<string, { name: string; color: string; gradient: string; icon: string }> = {
  twitter: {
    name: "X (Twitter)",
    color: "bg-black text-white",
    gradient: "from-zinc-800 to-zinc-900",
    icon: "X",
  },
  instagram: {
    name: "Instagram",
    color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white",
    gradient: "from-purple-600 via-pink-600 to-orange-500",
    icon: "IG",
  },
  facebook: {
    name: "Facebook",
    color: "bg-[#1877F2] text-white",
    gradient: "from-blue-600 to-blue-800",
    icon: "f",
  },
  linkedin: {
    name: "LinkedIn",
    color: "bg-[#0A66C2] text-white",
    gradient: "from-sky-600 to-sky-800",
    icon: "in",
  },
  tiktok: {
    name: "TikTok",
    color: "bg-black text-white",
    gradient: "from-zinc-800 to-black",
    icon: "TT",
  },
  threads: {
    name: "Threads",
    color: "bg-zinc-900 text-white",
    gradient: "from-zinc-700 to-zinc-900",
    icon: "@",
  },
};

export default function Accounts() {
  const utils = trpc.useUtils();
  const { data: accounts, isLoading } = trpc.account.list.useQuery();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFacebookDialog, setShowFacebookDialog] = useState(false);
  const [fbToken, setFbToken] = useState("");
  const [fbLoading, setFbLoading] = useState(false);
  const [fbPages, setFbPages] = useState<Array<{
    name: string;
    id: string;
    access_token: string;
    category?: string;
    fan_count?: number;
    followers_count?: number;
  }>>([]);
  const [fbUser, setFbUser] = useState<{ name: string; id: string } | null>(null);

  // Auto-fill token from localStorage if available
  useEffect(() => {
    const stored = localStorage.getItem("fb_access_token");
    if (stored && !fbToken) {
      setFbToken(stored);
    }
  }, []);

  const updateAccount = trpc.account.update.useMutation({
    onSuccess: () => {
      utils.account.list.invalidate();
      utils.account.connected.invalidate();
      toast.success("Account updated");
    },
  });

  const deleteAccount = trpc.account.delete.useMutation({
    onSuccess: () => {
      utils.account.list.invalidate();
      utils.account.connected.invalidate();
      toast.success("Account disconnected");
    },
  });

  const createAccount = trpc.account.create.useMutation({
    onSuccess: () => {
      utils.account.list.invalidate();
      utils.account.connected.invalidate();
      toast.success("Account connected");
      setShowAddForm(false);
    },
  });

  const fetchFbPages = trpc.analytics.fetchFacebookPages.useQuery(
    { accessToken: fbToken },
    { enabled: false }
  );

  const connectFbPage = trpc.analytics.connectFacebookPage.useMutation({
    onSuccess: (data) => {
      utils.account.list.invalidate();
      utils.account.connected.invalidate();
      toast.success(`Connected: ${data.pageName}${data.instagramConnected ? " + Instagram" : ""}`);
    },
    onError: (err) => toast.error(`Failed to connect: ${err.message}`),
  });

  const toggleConnection = (id: number, currentlyConnected: string) => {
    updateAccount.mutate({
      id,
      isConnected: currentlyConnected === "true" ? "false" : "true",
    });
  };

  const handleFetchFacebookPages = async () => {
    if (!fbToken.trim()) {
      toast.error("Please enter a Facebook access token");
      return;
    }
    setFbLoading(true);
    try {
      const result = await fetchFbPages.refetch();
      if (result.data) {
        setFbUser(result.data.user);
        setFbPages(result.data.pages);
        toast.success(`Found ${result.data.pages.length} Facebook pages`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setFbLoading(false);
    }
  };

  const handleConnectPage = async (page: typeof fbPages[0]) => {
    connectFbPage.mutate({
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.access_token,
      pageCategory: page.category,
      fanCount: page.fan_count,
      followersCount: page.followers_count,
    });
  };

  const totalFollowers = (accounts || []).reduce((sum, a) => sum + (a.followerCount || 0), 0);
  const connectedCount = (accounts || []).filter((a) => a.isConnected === "true").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Social Accounts</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your connected social media profiles.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowFacebookDialog(true)}>
            <Facebook className="mr-1.5 h-3.5 w-3.5 text-[#1877F2]" />
            Connect Facebook
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Manual Connect
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Connected accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedCount}</p>
                <p className="text-xs text-muted-foreground">Active accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(totalFollowers / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-muted-foreground">Total followers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facebook Connect Dialog */}
      <Dialog open={showFacebookDialog} onOpenChange={setShowFacebookDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Facebook className="h-5 w-5 text-[#1877F2]" />
              Connect Facebook Pages
            </DialogTitle>
            <DialogDescription>
              Your Facebook token is auto-filled from your login session. Click "Fetch Pages" to discover your pages, or paste a fresh token from{" "}
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="underline text-primary">
                Graph API Explorer
              </a>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={fbToken}
                onChange={(e) => setFbToken(e.target.value)}
                placeholder="Paste Facebook access token..."
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm font-mono"
              />
              <Button size="sm" onClick={handleFetchFacebookPages} disabled={fbLoading}>
                {fbLoading ? (
                  <><RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Loading...</>
                ) : (
                  <><LogIn className="mr-1.5 h-3.5 w-3.5" /> Fetch Pages</>
                )}
              </Button>
            </div>

            {fbUser && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Facebook className="h-5 w-5 text-[#1877F2]" />
                <span className="text-sm font-medium">{fbUser.name}</span>
                <Badge className="ml-auto">Connected</Badge>
              </div>
            )}

            {fbPages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Your Pages ({fbPages.length})</p>
                {fbPages.map((page) => (
                  <div key={page.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#1877F2] flex items-center justify-center text-white font-bold text-sm">
                        {page.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{page.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {page.fan_count?.toLocaleString() || 0} followers
                          {page.category ? ` · ${page.category}` : ""}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleConnectPage(page)} disabled={connectFbPage.isPending}>
                      {connectFbPage.isPending ? "Connecting..." : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {fbPages.length === 0 && fbUser && (
              <div className="text-center py-8 text-muted-foreground">
                <Facebook className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No pages found for this account. Make sure your token has the pages_show_list permission.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Add Account Form */}
      {showAddForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Connect Account Manually</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createAccount.mutate({
                  platform: formData.get("platform") as string,
                  name: formData.get("name") as string,
                  handle: formData.get("handle") as string,
                  followerCount: parseInt(formData.get("followers") as string) || 0,
                });
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              <select
                name="platform"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">Select platform</option>
                {Object.entries(platformConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.name}</option>
                ))}
              </select>
              <input
                name="name"
                placeholder="Account name"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                required
              />
              <input
                name="handle"
                placeholder="@handle"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                required
              />
              <input
                name="followers"
                type="number"
                placeholder="Followers"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
              <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                <Button type="submit" size="sm" disabled={createAccount.isPending}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {createAccount.isPending ? "Connecting..." : "Connect"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          (accounts || []).map((account) => {
            const config = platformConfig[account.platform];
            const isFacebook = account.platform === "facebook";
            const isInstagram = account.platform === "instagram";
            return (
              <Card key={account.id} className="group overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${config?.gradient || "from-muted to-muted"}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${config?.color || "bg-muted"}`}>
                        {isFacebook ? (
                          <Facebook className="h-5 w-5" />
                        ) : isInstagram ? (
                          <Instagram className="h-5 w-5" />
                        ) : (
                          config?.icon || "?"
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{account.name}</h3>
                        <p className="text-xs text-muted-foreground">{account.handle}</p>
                        {account.platformCategory && (
                          <Badge variant="outline" className="text-[9px] mt-0.5">
                            {account.platformCategory}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={account.isConnected === "true"}
                        onCheckedChange={() => toggleConnection(account.id, account.isConnected)}
                      />
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-sm font-bold">{((account.followerCount || 0) / 1000).toFixed(1)}K</p>
                      <p className="text-[10px] text-muted-foreground">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold">
                        {((account.reach || 0) / 1000).toFixed(0)}K
                      </p>
                      <p className="text-[10px] text-muted-foreground">Reach</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold">
                        {((account.engagement || 0) / 100).toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">Engagement</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <Badge
                      variant={account.isConnected === "true" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {account.isConnected === "true" ? (
                        <><CheckCircle2 className="mr-1 h-2.5 w-2.5" /> Connected</>
                      ) : (
                        <><AlertCircle className="mr-1 h-2.5 w-2.5" /> Disconnected</>
                      )}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        if (confirm("Disconnect this account?")) {
                          deleteAccount.mutate({ id: account.id });
                        }
                      }}
                    >
                      <Unlink className="mr-1 h-3 w-3" />
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}