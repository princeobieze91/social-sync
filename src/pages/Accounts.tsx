import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Unlink,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
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

  const toggleConnection = (id: number, currentlyConnected: string) => {
    updateAccount.mutate({
      id,
      isConnected: currentlyConnected === "true" ? "false" : "true",
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
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Connect Account
        </Button>
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

      {/* Add Account Form */}
      {showAddForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Connect New Account</CardTitle>
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
            return (
              <Card key={account.id} className="group overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${config?.gradient || "from-muted to-muted"}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${config?.color || "bg-muted"}`}>
                        {config?.icon || "?"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{account.name}</h3>
                        <p className="text-xs text-muted-foreground">{account.handle}</p>
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
