import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-amber-500",
  scheduled: "bg-blue-500",
  published: "bg-emerald-500",
  failed: "bg-red-500",
};

const platformIcons: Record<string, string> = {
  twitter: "X",
  instagram: "IG",
  facebook: "f",
  linkedin: "in",
  tiktok: "TT",
  threads: "@",
};

export default function Calendar() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: posts, isLoading } = trpc.post.list.useQuery();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getPostsForDay = (date: Date) => {
    if (!posts) return [];
    return posts.filter((post) => {
      const postDate = post.scheduledAt || post.createdAt;
      return postDate && isSameDay(new Date(postDate), date);
    });
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Content Calendar</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and manage all your scheduled posts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button variant="ghost" size="sm" className="h-8 px-2 rounded-none border-r" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-4 text-sm font-semibold min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button variant="ghost" size="sm" className="h-8 px-2 rounded-none border-l" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" onClick={() => navigate("/composer")}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Post
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Draft</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Published</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Failed</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((wd) => (
              <div key={wd} className="py-2.5 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0 bg-muted/30">
                {wd}
              </div>
            ))}
          </div>

          {/* Days */}
          {isLoading ? (
            <div className="grid grid-cols-7">
              {Array(35).fill(0).map((_, i) => (
                <div key={i} className="min-h-[100px] border-r border-b p-2">
                  <Skeleton className="h-4 w-6" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map((date, idx) => {
                const dayPosts = getPostsForDay(date);
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isTodayDate = isToday(date);

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] border-r border-b p-1.5 transition-colors ${
                      isCurrentMonth ? "bg-background" : "bg-muted/20"
                    } ${isTodayDate ? "bg-primary/5" : ""} hover:bg-accent/30 cursor-pointer`}
                    onClick={() => {
                      if (dayPosts.length > 0) {
                        navigate(`/composer/${dayPosts[0].id}`);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full ${
                        isTodayDate ? "bg-primary text-primary-foreground" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {format(date, "d")}
                      </span>
                      {dayPosts.length > 0 && (
                        <span className="text-[9px] text-muted-foreground font-medium">
                          {dayPosts.length} post{dayPosts.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 3).map((post) => (
                        <div
                          key={post.id}
                          className="flex items-center gap-1 rounded px-1.5 py-0.5 bg-muted/60 hover:bg-muted transition-colors"
                        >
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusColors[post.status]}`} />
                          <span className="text-[10px] truncate flex-1">{post.content.slice(0, 30)}...</span>
                          <div className="flex gap-0.5 shrink-0">
                            {post.postAccounts.slice(0, 2).map((pa) => (
                              <span key={pa.id} className="text-[7px] font-bold text-muted-foreground">
                                {platformIcons[pa.account.platform]}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <span className="text-[9px] text-muted-foreground pl-1">+{dayPosts.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Posts List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Upcoming Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-0">
              {(posts || [])
                .filter((p) => p.status === "scheduled")
                .sort((a, b) => {
                  const aDate = a.scheduledAt ? new Date(a.scheduledAt) : new Date(0);
                  const bDate = b.scheduledAt ? new Date(b.scheduledAt) : new Date(0);
                  return aDate.getTime() - bDate.getTime();
                })
                .slice(0, 8)
                .map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 py-3 border-b border-border/40 last:border-0 group cursor-pointer hover:bg-accent/20 rounded-lg px-2 -mx-2 transition-colors"
                    onClick={() => navigate(`/composer/${post.id}`)}
                  >
                    <div className="shrink-0 text-center min-w-[60px]">
                      <div className="text-xs font-bold text-primary">
                        {post.scheduledAt ? format(new Date(post.scheduledAt), "MMM d") : "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {post.scheduledAt ? format(new Date(post.scheduledAt), "h:mm a") : ""}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{post.content}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {post.postAccounts.map((pa) => (
                          <span key={pa.id} className="text-[9px] font-medium text-muted-foreground">
                            {pa.account.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {post.status}
                    </Badge>
                  </div>
                ))}
              {(posts || []).filter((p) => p.status === "scheduled").length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No scheduled posts</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/composer")}>
                    <Plus className="mr-1 h-3 w-3" />
                    Create Post
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
