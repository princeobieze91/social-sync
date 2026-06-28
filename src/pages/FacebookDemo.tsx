import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Facebook,
  Instagram,
  Users,
  FileText,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  RefreshCw,
  ExternalLink,
  Image,
  Video,
  Calendar,
  BarChart3,
} from "lucide-react";

interface FacebookUser {
  name: string;
  id: string;
}

interface FacebookPage {
  name: string;
  id: string;
  access_token: string;
  category?: string;
  fan_count?: number;
  followers_count?: number;
  picture?: { data: { url: string } };
}

interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  type: string;
  likes?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number } };
  shares?: { count: number };
  full_picture?: string;
}

export default function FacebookDemo() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<FacebookUser | null>(null);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "pages" | "posts">("idle");

  const API_BASE = "";

  const fetchPages = async () => {
    setLoading(true);
    setStep("idle");
    try {
      const res = await fetch(`${API_BASE}/api/facebook/pages`);
      if (!res.ok) throw new Error("Failed to fetch pages");
      const data = await res.json();
      setUser(data.user);
      setPages(data.pages || []);
      setStep("pages");
      toast.success(`Found ${(data.pages || []).length} pages`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (page: FacebookPage) => {
    setSelectedPage(page);
    setPostsLoading(true);
    setStep("posts");
    try {
      const res = await fetch(`${API_BASE}/api/facebook/posts?pageId=${page.id}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data.posts || []);
      toast.success(`Loaded ${(data.posts || []).length} posts`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPostsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCount = (count?: number) => {
    if (!count) return "0";
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case "photo": return <Image className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      case "status": return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Facebook className="h-6 w-6 text-[#1877F2]" />
            Facebook Pages Demo
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Demo showing how SocialSync reads Facebook Page data using the Graph API
          </p>
        </div>
        <Button onClick={fetchPages} disabled={loading} size="sm">
          {loading ? (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          {step === "idle" ? "Fetch Pages" : "Refresh"}
        </Button>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step !== "idle" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step !== "idle" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {step !== "idle" ? "✓" : "1"}
              </div>
              <span className="text-sm font-medium">Connect</span>
            </div>
            <div className={`h-0.5 flex-1 ${step === "pages" || step === "posts" ? "bg-primary" : "bg-muted"}`} />
            <div className={`flex items-center gap-2 ${step === "pages" || step === "posts" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "pages" || step === "posts" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {step === "posts" ? "✓" : "2"}
              </div>
              <span className="text-sm font-medium">Pages</span>
            </div>
            <div className={`h-0.5 flex-1 ${step === "posts" ? "bg-primary" : "bg-muted"}`} />
            <div className={`flex items-center gap-2 ${step === "posts" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "posts" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                3
              </div>
              <span className="text-sm font-medium">Posts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Info */}
      {user && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">Facebook ID: {user.id}</p>
              </div>
              <Badge className="ml-auto">Connected</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pages List */}
      {step === "pages" && pages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Your Facebook Pages ({pages.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.map((page) => (
              <Card key={page.id} className="overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-[#1877F2] to-blue-400" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-[#1877F2] flex items-center justify-center text-white font-bold text-lg">
                        {page.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{page.name}</h4>
                        <p className="text-xs text-muted-foreground">ID: {page.id}</p>
                        {page.category && (
                          <Badge variant="secondary" className="mt-1 text-[10px]">
                            {page.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => fetchPosts(page)}>
                      View Posts
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-lg font-bold">{formatCount(page.fan_count || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">Likes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{formatCount(page.followers_count || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">Followers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Posts List */}
      {step === "posts" && selectedPage && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Posts from {selectedPage.name}
            </h3>
            <Button variant="outline" size="sm" onClick={() => setStep("pages")}>
              ← Back to Pages
            </Button>
          </div>

          {postsLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-4" />
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No posts found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {getPostIcon(post.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">
                            {post.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.created_time)}
                          </span>
                        </div>
                        {post.message && (
                          <p className="text-sm mt-2 line-clamp-3">{post.message}</p>
                        )}
                        {post.full_picture && (
                          <div className="mt-3">
                            <img
                              src={post.full_picture}
                              alt="Post"
                              className="rounded-lg max-h-48 object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-6 mt-3 pt-3 border-t">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Heart className="h-3.5 w-3.5" />
                            <span>{formatCount(post.likes?.summary?.total_count || 0)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>{formatCount(post.comments?.summary?.total_count || 0)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Share2 className="h-3.5 w-3.5" />
                            <span>{formatCount(post.shares?.count || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {step === "idle" && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Facebook className="h-16 w-16 mx-auto text-[#1877F2] mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Facebook Pages</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Click "Fetch Pages" to connect your Facebook account and view your pages.
              This demonstrates how SocialSync reads Facebook Page data using the Graph API.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="p-4 rounded-lg bg-muted/50">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs font-medium">Read Posts</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs font-medium">View Analytics</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs font-medium">Manage Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
