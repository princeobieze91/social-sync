import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Send,
  Clock,
  CheckCircle2,
  FileText,
} from "lucide-react";

const platformColors: Record<string, string> = {
  twitter: "#000000",
  instagram: "#E4405F",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  tiktok: "#000000",
  threads: "#000000",
};

const platformIcons: Record<string, string> = {
  twitter: "X",
  instagram: "IG",
  facebook: "FB",
  linkedin: "LI",
  tiktok: "TT",
  threads: "TH",
};

export default function Analytics() {
  const { data: analytics, isLoading } = trpc.analytics.overview.useQuery();

  const weeklyData: Array<{ day: string; impressions: number; engagement: number }> = analytics?.weeklyPerformance || [];
  const maxImpressions = weeklyData.length > 0 ? Math.max(...weeklyData.map((d) => d.impressions)) : 0;
  const platformPerformance = analytics?.platformPerformance || [];
  const topPosts = analytics?.topPosts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your social media performance across all platforms.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <MetricCard
              title="Total Impressions"
              value={analytics?.totalImpressions?.toLocaleString() || "0"}
              change={analytics?.impressionsChange || "+0%"}
              trend={(analytics?.impressionsChange || "").includes("-") ? "down" : "up"}
              icon={Eye}
            />
            <MetricCard
              title="Engagement Rate"
              value={analytics?.engagementRate || "0%"}
              change={analytics?.engagementChange || "+0%"}
              trend={(analytics?.engagementChange || "").includes("-") ? "down" : "up"}
              icon={Heart}
            />
            <MetricCard
              title="Total Reach"
              value={analytics?.totalReach?.toLocaleString() || "0"}
              change={analytics?.reachChange || "+0%"}
              trend={(analytics?.reachChange || "").includes("-") ? "down" : "up"}
              icon={Users}
            />
            <MetricCard
              title="Avg. Post Performance"
              value={analytics?.avgPostPerformance || "0"}
              change={analytics?.performanceChange || "+0%"}
              trend={(analytics?.performanceChange || "").includes("-") ? "down" : "up"}
              icon={BarChart3}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="posts">Top Posts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Weekly Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Weekly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Impressions Bars */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Impressions</p>
                  <div className="flex items-end gap-2 h-32">
                    {weeklyData.map((d) => (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-primary/80 rounded-t-sm transition-all hover:bg-primary"
                          style={{ height: `${(d.impressions / maxImpressions) * 100}%` }}
                          title={`${d.impressions.toLocaleString()} impressions`}
                        />
                        <span className="text-[10px] text-muted-foreground">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Impressions</p>
                    <p className="text-lg font-bold">{weeklyData.reduce((s, d) => s + d.impressions, 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Engagement</p>
                    <p className="text-lg font-bold">{weeklyData.reduce((s, d) => s + d.engagement, 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Engagement Rate</p>
                    <p className="text-lg font-bold">
                      {((weeklyData.reduce((s, d) => s + d.engagement, 0) / weeklyData.reduce((s, d) => s + d.impressions, 0)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Content Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))
                ) : (
                  Object.entries(analytics?.posts || {}).filter(([k]) => k !== "total").map(([key, value]) => {
                    const total = analytics?.posts.total || 1;
                    const pct = Math.round(((value as number) / total) * 100);
                    const colors: Record<string, string> = {
                      draft: "bg-amber-500",
                      scheduled: "bg-blue-500",
                      published: "bg-emerald-500",
                      failed: "bg-red-500",
                    };
                    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
                      draft: FileText,
                      scheduled: Clock,
                      published: CheckCircle2,
                      failed: Send,
                    };
                    const Icon = icons[key];
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg ${colors[key]}/10 flex items-center justify-center`}>
                          <Icon className={`h-4 w-4 ${colors[key].replace("bg-", "text-")}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{key}</span>
                            <span className="text-sm font-bold">{value as number}</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Engagement Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(analytics?.engagementBreakdown || []).map((item: any) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg ${item.color}/10 flex items-center justify-center`}>
                      <item.icon className={`h-4 w-4 ${item.color.replace("bg-", "text-")}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-sm font-bold">{item.value}</span>
                      </div>
                      <Progress value={item.pct} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformPerformance.map((pp) => (
                  <div
                    key={pp.platform}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: platformColors[pp.platform] }}
                    >
                      {platformIcons[pp.platform]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold capitalize">{pp.platform}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{pp.posts} posts</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {pp.engagement}% engagement
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={(pp.impressions / 100000) * 100} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium min-w-[60px] text-right">
                          {(pp.impressions / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformPerformance.map((pp) => (
              <Card key={pp.platform} className="overflow-hidden">
                <div className="h-1" style={{ backgroundColor: platformColors[pp.platform] }} />
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="h-7 w-7 rounded flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: platformColors[pp.platform] }}
                    >
                      {platformIcons[pp.platform]}
                    </div>
                    <span className="font-semibold text-sm capitalize">{pp.platform}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-lg font-bold">{(pp.followers / 1000).toFixed(1)}K</p>
                      <p className="text-[10px] text-muted-foreground">Followers</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{(pp.impressions / 1000).toFixed(0)}K</p>
                      <p className="text-[10px] text-muted-foreground">Impressions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{pp.engagement}%</p>
                      <p className="text-[10px] text-muted-foreground">Engagement</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{pp.posts}</p>
                      <p className="text-[10px] text-muted-foreground">Posts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Top Posts Tab */}
        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Top Performing Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {topPosts.map((post, idx) => (
                  <div key={idx} className="flex items-start gap-4 py-4 border-b border-border/40 last:border-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate mb-2">{post.content}</p>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {(post.impressions / 1000).toFixed(0)}K
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          {(post.likes / 1000).toFixed(1)}K
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageCircle className="h-3 w-3" />
                          {post.comments}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Share2 className="h-3 w-3" />
                          {post.shares}
                        </span>
                        <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                          {post.engagement}% engagement
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" ? (
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={`text-xs font-medium ${trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
            {change}
          </span>
          <span className="text-xs text-muted-foreground">vs last week</span>
        </div>
      </CardContent>
    </Card>
  );
}
