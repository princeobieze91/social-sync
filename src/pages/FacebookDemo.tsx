import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Facebook,
  Instagram,
  Users,
  FileText,
  Heart,
  MessageCircle,
  Share2,
  RefreshCw,
  Image,
  Video,
  Calendar,
  BarChart3,
  AlertCircle,
  Send,
  Zap,
} from "lucide-react";

interface FacebookPage {
  name: string;
  id: string;
  access_token: string;
  category?: string;
  fan_count?: number;
  followers_count?: number;
}

interface InstagramAccount {
  id: string;
  name?: string;
  username?: string;
  profile_picture_url?: string;
  followers_count?: number;
  media_count?: number;
}

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
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
  const { data: accounts, isLoading: accountsLoading, refetch } = trpc.account.connected.useQuery();
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "posts">("idle");
  const [error, setError] = useState<string | null>(null);
  const [igAccount, setIgAccount] = useState<InstagramAccount | null>(null);
  const [igMedia, setIgMedia] = useState<InstagramMedia[]>([]);
  const [igLoading, setIgLoading] = useState(false);
  const [publishCaption, setPublishCaption] = useState("");
  const [publishImageUrl, setPublishImageUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);

  const fbAccounts = (accounts || []).filter((a: any) => a.platform === "facebook" && a.isConnected === "true");

  const fetchPosts = async (account: any) => {
    setSelectedPage(account);
    setPostsLoading(true);
    setIgLoading(true);
    setStep("posts");
    setIgAccount(null);
    setIgMedia([]);
    setError(null);
    try {
      const [postsRes, igRes] = await Promise.all([
        fetch(`/api/facebook/posts?pageId=${account.platformId}&pageToken=${encodeURIComponent(account.accessToken)}`),
        fetch(`/api/facebook/instagram?pageId=${account.platformId}&pageToken=${encodeURIComponent(account.accessToken)}`),
      ]);
      const postsData = await postsRes.json();
      const igData = await igRes.json();
      if (postsData.error) throw new Error(postsData.error.message || JSON.stringify(postsData.error));
      setPosts(postsData.posts || []);
      if (igData.instagram) {
        setIgAccount(igData.instagram);
        setIgMedia(igData.media || []);
      }
      toast.success(`Loaded ${(postsData.posts || []).length} posts`);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setPostsLoading(false);
      setIgLoading(false);
    }
  };

  const publishToInstagram = async () => {
    if (!igAccount || !selectedPage) return;
    if (!publishImageUrl.trim()) {
      toast.error("Image URL is required");
      return;
    }
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch(`/api/facebook/instagram/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igAccountId: igAccount.id,
          pageToken: selectedPage.accessToken,
          imageUrl: publishImageUrl,
          caption: publishCaption,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      setPublishResult(`Published! Media ID: ${data.mediaId}`);
      toast.success("Post published to Instagram!");
      setPublishCaption("");
      setPublishImageUrl("");
    } catch (err: any) {
      setPublishResult(`Error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setPublishing(false);
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
            Facebook & Instagram
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            View posts, analytics, and publish to Instagram from your connected pages
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={accountsLoading} size="sm" variant="outline">
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${accountsLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {accountsLoading && (
        <div className="space-y-4">
          {Array(2).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No accounts */}
      {!accountsLoading && fbAccounts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Facebook className="h-16 w-16 mx-auto text-[#1877F2] mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Facebook Pages Connected</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Log in with Facebook to automatically connect your pages. Your pages and their tokens will be saved so you don't need to paste tokens manually.
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
                <Send className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs font-medium">Publish to IG</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Pages */}
      {!accountsLoading && fbAccounts.length > 0 && step === "idle" && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Your Connected Pages ({fbAccounts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fbAccounts.map((account: any) => (
              <Card key={account.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1.5 bg-gradient-to-r from-[#1877F2] to-blue-400" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-[#1877F2] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                        {account.avatarUrl ? (
                          <img src={account.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          account.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">{account.name}</h4>
                        <p className="text-xs text-muted-foreground">Page ID: {account.platformId}</p>
                        {account.platformCategory && (
                          <Badge variant="secondary" className="mt-1 text-[10px]">
                            {account.platformCategory}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => fetchPosts(account)}>
                      View Posts
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-lg font-bold">{formatCount(account.followerCount || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">Followers</p>
                    </div>
                    <div className="text-center flex items-center justify-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-emerald-500" />
                      <p className="text-sm font-semibold text-emerald-600">Connected</p>
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
            <Button variant="outline" size="sm" onClick={() => setStep("idle")}>
              Back to Pages
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

      {/* Instagram Section */}
      {step === "posts" && igLoading && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Instagram className="h-4 w-4 text-[#E4405F]" />
            Loading Instagram...
          </h3>
          {Array(2).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {step === "posts" && !igLoading && igAccount && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Instagram className="h-4 w-4 text-[#E4405F]" />
            Instagram Account
          </h3>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                {igAccount.profile_picture_url && (
                  <img src={igAccount.profile_picture_url} alt="" className="h-14 w-14 rounded-full" />
                )}
                <div>
                  <p className="font-semibold">@{igAccount.username || igAccount.name}</p>
                  <p className="text-xs text-muted-foreground">IG ID: {igAccount.id}</p>
                </div>
                <div className="ml-auto flex gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold">{formatCount(igAccount.followers_count || 0)}</p>
                    <p className="text-[10px] text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{igAccount.media_count || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Posts</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {igMedia.length > 0 && (
            <>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Image className="h-4 w-4" />
                Instagram Media ({igMedia.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {igMedia.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.media_url && (
                      <div className="aspect-square bg-muted">
                        <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">{item.media_type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDate(item.timestamp)}</span>
                      </div>
                      {item.caption && (
                        <p className="text-xs line-clamp-2 mt-1">{item.caption}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {item.like_count || 0}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> {item.comments_count || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {igMedia.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Instagram className="h-10 w-10 mx-auto text-[#E4405F] mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No Instagram media found</p>
              </CardContent>
            </Card>
          )}

          {/* Publish to Instagram */}
          <h3 className="text-sm font-semibold flex items-center gap-2 mt-4">
            <Send className="h-4 w-4 text-[#E4405F]" />
            Publish to Instagram
          </h3>
          <Card>
            <CardContent className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Image URL</label>
                <input
                  type="text"
                  value={publishImageUrl}
                  onChange={(e) => setPublishImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Caption (optional)</label>
                <textarea
                  value={publishCaption}
                  onChange={(e) => setPublishCaption(e.target.value)}
                  placeholder="Write a caption for your post..."
                  className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
              <Button size="sm" onClick={publishToInstagram} disabled={publishing || !publishImageUrl.trim()}>
                {publishing ? (
                  <><RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Publishing...</>
                ) : (
                  <><Send className="mr-1.5 h-3.5 w-3.5" /> Publish Post</>
                )}
              </Button>
              {publishResult && (
                <div className={`p-3 rounded-lg text-sm ${publishResult.startsWith("Error") ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>
                  {publishResult}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === "posts" && !igLoading && !igAccount && (
        <Card>
          <CardContent className="p-6 text-center">
            <Instagram className="h-10 w-10 mx-auto text-[#E4405F] mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No Instagram Business account linked to this page</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
