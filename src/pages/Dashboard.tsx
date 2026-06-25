import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  PenSquare,
  CalendarDays,
  Send,
  FileText,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  ArrowUpRight,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { formatDistanceToNow, format } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: analytics, isLoading: analyticsLoading } = trpc.analytics.overview.useQuery();
  const { data: recentPosts, isLoading: postsLoading } = trpc.post.list.useQuery();
  const { data: activities, isLoading: activitiesLoading } = trpc.activity.list.useQuery({ limit: 8 });

  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => {
      utils.post.list.invalidate();
      utils.analytics.overview.invalidate();
    },
  });

  const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
    draft: { color: "bg-amber-500/10 text-amber-600 border-amber-200", icon: FileText },
    scheduled: { color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: Clock },
    published: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
    failed: { color: "bg-red-500/10 text-red-600 border-red-200", icon: AlertCircle },
  };

  const platformIcons: Record<string, string> = {
    twitter: "X",
    instagram: "IG",
    facebook: "FB",
    linkedin: "LI",
    tiktok: "TT",
    threads: "TH",
  };

  const platformColors: Record<string, string> = {
    twitter: "bg-black text-white",
    instagram: "bg-gradient-to-br from-purple-500 to-pink-500 text-white",
    facebook: "bg-blue-600 text-white",
    linkedin: "bg-sky-700 text-white",
    tiktok: "bg-black text-white",
    threads: "bg-zinc-900 text-white",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of your social media presence and scheduled content.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/calendar")}>
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
            Calendar
          </Button>
          <Button size="sm" onClick={() => navigate("/composer")}>
            <PenSquare className="mr-1.5 h-3.5 w-3.5" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Total Posts"
              value={analytics?.posts.total || 0}
              icon={FileText}
              trend="+12%"
              trendUp={true}
            />
            <StatCard
              title="Scheduled"
              value={analytics?.posts.scheduled || 0}
              icon={Clock}
              trend="+3"
              trendUp={true}
            />
            <StatCard
              title="Published"
              value={analytics?.posts.published || 0}
              icon={Send}
              trend="+28%"
              trendUp={true}
            />
            <StatCard
              title="Total Followers"
              value={((analytics?.totalFollowers || 0) / 1000).toFixed(1) + "K"}
              icon={Users}
              trend="+5.2%"
              trendUp={true}
            />
          </>
        )}
      </div>

      {/* Content Distribution + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Content Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))
            ) : (
              Object.entries(analytics?.posts || {}).filter(([k]) => k !== "total").map(([key, value]) => {
                const total = analytics?.posts.total || 1;
                const pct = Math.round(((value as number) / total) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="capitalize font-medium text-muted-foreground">{key}</span>
                      <span className="font-semibold">{value as number} ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Platform Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Platform Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsLoading ? (
              Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))
            ) : (
              Object.entries(analytics?.platforms || {}).map(([platform, count]) => (
                <div key={platform} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-flex items-center justify-center h-7 w-7 rounded-md text-[10px] font-bold ${platformColors[platform] || "bg-muted"}`}>
                      {platformIcons[platform] || platform.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium capitalize">{platform}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{count as number}</span>
                    <span className="text-[10px] text-muted-foreground">posts</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {activitiesLoading ? (
              Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full mb-2" />
              ))
            ) : (
              <div className="space-y-0 max-h-[260px] overflow-y-auto pr-1">
                {(activities || []).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0"
                  >
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      activity.type === "publish" ? "bg-emerald-500" :
                      activity.type === "schedule" ? "bg-blue-500" :
                      activity.type === "create" ? "bg-amber-500" :
                      "bg-purple-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/90 leading-relaxed">{activity.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {activity.createdAt ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Recent Posts</CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/calendar")}>
            View all
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-0">
              {(recentPosts || []).slice(0, 5).map((post) => {
                const status = statusConfig[post.status] || statusConfig.draft;
                const StatusIcon = status.icon;
                return (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 py-3.5 border-b border-border/40 last:border-0 group cursor-pointer hover:bg-accent/30 rounded-lg px-2 -mx-2 transition-colors"
                    onClick={() => navigate(`/composer/${post.id}`)}
                  >
                    {/* Status */}
                    <div className="shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.color}`}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {post.status}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate font-medium">{post.content}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {post.scheduledAt ? format(new Date(post.scheduledAt), "MMM d, h:mm a") : "No schedule"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {post.postAccounts.length} platform{post.postAccounts.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Platform badges */}
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      {post.postAccounts.slice(0, 3).map((pa) => (
                        <span
                          key={pa.id}
                          className={`inline-flex items-center justify-center h-5 w-5 rounded text-[8px] font-bold ${platformColors[pa.account.platform] || "bg-muted"}`}
                          title={pa.account.name}
                        >
                          {platformIcons[pa.account.platform] || "?"}
                        </span>
                      ))}
                      {post.postAccounts.length > 3 && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          +{post.postAccounts.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          navigate(`/composer/${post.id}`);
                        }}
                      >
                        <PenSquare className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          deletePost.mutate({ id: post.id });
                        }}
                      >
                        <AlertCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Performance */}
      {analyticsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Impressions", value: analytics?.totalImpressions?.toLocaleString() || "0", change: analytics?.impressionsChange || "+0%", icon: Eye },
            { label: "Engagement Rate", value: analytics?.engagementRate || "0%", change: analytics?.engagementChange || "+0%", icon: Heart },
            { label: "Comments", value: analytics?.totalComments?.toLocaleString() || "0", change: analytics?.commentsChange || "+0%", icon: MessageCircle },
            { label: "Shares", value: analytics?.totalShares?.toLocaleString() || "0", change: analytics?.sharesChange || "+0%", icon: Share2 },
          ].map((metric) => (
            <Card key={metric.label} className="hover:shadow-md transition-shadow cursor-default">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                  <metric.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold">{metric.value}</span>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                    {metric.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            trendUp ? "text-emerald-600 bg-emerald-500/10" : "text-red-600 bg-red-500/10"
          }`}>
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
