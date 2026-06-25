import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  PenSquare,
  Image,
  CalendarDays,
  Clock,
  Send,
  Save,
  X,
  Plus,
  Check,
  Wand2,
  Hash,
  AtSign,
  Rocket,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const platformConfig: Record<string, { name: string; charLimit: number; color: string; icon: string }> = {
  twitter: { name: "X (Twitter)", charLimit: 280, color: "bg-black text-white", icon: "X" },
  instagram: { name: "Instagram", charLimit: 2200, color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white", icon: "IG" },
  facebook: { name: "Facebook", charLimit: 63206, color: "bg-[#1877F2] text-white", icon: "f" },
  linkedin: { name: "LinkedIn", charLimit: 3000, color: "bg-[#0A66C2] text-white", icon: "in" },
  tiktok: { name: "TikTok", charLimit: 2200, color: "bg-black text-white", icon: "TT" },
  threads: { name: "Threads", charLimit: 500, color: "bg-zinc-900 text-white", icon: "@" },
};

export default function Composer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const postId = id ? parseInt(id) : null;

  const { data: accounts } = trpc.account.connected.useQuery();
  const { data: existingPost } = trpc.post.byId.useQuery(
    { id: postId! },
    { enabled: !!postId }
  );

  const [content, setContent] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [status, setStatus] = useState<"draft" | "scheduled">("draft");
  const [activeTab, setActiveTab] = useState("twitter");
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (existingPost) {
      setContent(existingPost.content);
      setSelectedAccounts(existingPost.postAccounts.map((pa) => pa.accountId));
      if (existingPost.scheduledAt) {
        setScheduleDate(new Date(existingPost.scheduledAt));
        setScheduleTime(format(new Date(existingPost.scheduledAt), "HH:mm"));
        setStatus("scheduled");
      }
      if (existingPost.media.length > 0) {
        setMediaFiles(existingPost.media.map((m) => m.url));
      }
    }
  }, [existingPost]);

  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      utils.post.list.invalidate();
      utils.analytics.overview.invalidate();
      toast.success("Post created successfully!");
      navigate("/");
    },
    onError: () => toast.error("Failed to create post"),
  });

  const updatePost = trpc.post.update.useMutation({
    onSuccess: () => {
      utils.post.list.invalidate();
      utils.analytics.overview.invalidate();
      toast.success("Post updated successfully!");
      navigate("/");
    },
    onError: () => toast.error("Failed to update post"),
  });

  const dispatchMutation = trpc.publish.dispatch.useMutation({
    onSuccess: () => {
      utils.post.list.invalidate();
      utils.analytics.overview.invalidate();
      toast.success("Post dispatched to platforms!");
      navigate("/");
    },
    onError: (error) => toast.error(`Dispatch failed: ${error.message}`),
  });

  const toggleAccount = useCallback((accountId: number) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  }, []);

  const handleSave = (saveStatus: "draft" | "scheduled") => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }
    if (selectedAccounts.length === 0) {
      toast.error("Please select at least one account");
      return;
    }

    let scheduledAt: Date | null = null;
    if (saveStatus === "scheduled" && scheduleDate) {
      const [hours, minutes] = scheduleTime.split(":").map(Number);
      scheduledAt = new Date(scheduleDate);
      scheduledAt.setHours(hours, minutes);
    }

    if (postId) {
      updatePost.mutate({
        id: postId,
        content,
        status: saveStatus,
        scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
        accountIds: selectedAccounts,
      });
    } else {
      createPost.mutate({
        content,
        status: saveStatus,
        scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
        accountIds: selectedAccounts,
      });
    }
  };

  const handlePublishNow = () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }
    if (selectedAccounts.length === 0) {
      toast.error("Please select at least one account");
      return;
    }

    const doPublish = (savedPostId: number) => {
      dispatchMutation.mutate({ postId: savedPostId });
    };

    if (postId) {
      updatePost.mutate(
        {
          id: postId,
          content,
          status: "draft",
          scheduledAt: null,
          accountIds: selectedAccounts,
        },
        { onSuccess: () => doPublish(postId) }
      );
    } else {
      createPost.mutate(
        {
          content,
          status: "draft",
          scheduledAt: null,
          accountIds: selectedAccounts,
        },
        {
          onSuccess: (newPost) => {
            if (newPost?.id) doPublish(newPost.id);
          },
        }
      );
    }
  };

  const generateCaption = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, platform: activeTab }),
      });
      if (response.ok) {
        const data = await response.json();
        setContent(data.caption);
        toast.success("AI caption generated!");
      } else {
        toast.error("Failed to generate caption");
      }
    } catch {
      toast.error("Failed to generate caption");
    } finally {
      setIsGenerating(false);
    }
  };

  const minCharLimit = Math.min(
    ...selectedAccounts
      .map((id) => accounts?.find((a) => a.id === id)?.platform)
      .filter(Boolean)
      .map((p) => platformConfig[p!]?.charLimit || 10000)
  ) || 10000;

  const charCount = content.length;
  const isOverLimit = charCount > minCharLimit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {postId ? "Edit Post" : "New Post"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compose and preview your post across all connected platforms.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={createPost.isPending || updatePost.isPending}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save Draft
          </Button>
          <Button size="sm" onClick={() => handleSave("scheduled")} disabled={createPost.isPending || updatePost.isPending}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Schedule Post
          </Button>
          <Button size="sm" variant="default" onClick={handlePublishNow} disabled={createPost.isPending || updatePost.isPending || dispatchMutation.isPending} className="bg-green-600 hover:bg-green-700">
            <Rocket className="mr-1.5 h-3.5 w-3.5" />
            {dispatchMutation.isPending ? "Publishing..." : "Publish Now"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left Panel - Editor */}
        <div className="xl:col-span-3 space-y-4">
          {/* Content Editor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PenSquare className="h-4 w-4 text-primary" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind? Write your post here..."
                  className="min-h-[160px] resize-none text-sm leading-relaxed pr-16"
                />
                <div className="absolute bottom-2 right-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] gap-1"
                    onClick={generateCaption}
                    disabled={isGenerating}
                  >
                    <Wand2 className="h-3 w-3" />
                    {isGenerating ? "Generating..." : "AI"}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setContent((c) => c + " #")}>
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setContent((c) => c + " @")}>
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <span className={`text-xs font-medium ${isOverLimit ? "text-red-500" : "text-muted-foreground"}`}>
                  {charCount} / {minCharLimit === 10000 ? "No limit" : minCharLimit}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Image className="h-4 w-4 text-primary" />
                Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                {mediaFiles.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt="" className="h-24 w-24 object-cover rounded-lg border" />
                    <button
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setMediaFiles((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  className="h-24 w-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files) {
                        Array.from(files).forEach((file) => {
                          const url = URL.createObjectURL(file);
                          setMediaFiles((prev) => [...prev, url]);
                        });
                      }
                    };
                    input.click();
                  }}
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-[10px]">Add</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(accounts || []).map((account) => {
                  const isSelected = selectedAccounts.includes(account.id);
                  const config = platformConfig[account.platform];
                  return (
                    <button
                      key={account.id}
                      onClick={() => toggleAccount(account.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                        isSelected
                          ? "border-primary bg-primary/5 text-foreground shadow-sm"
                          : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded text-[10px] font-bold ${config?.color || "bg-muted"}`}>
                        {config?.icon || "?"}
                      </span>
                      <span className="text-xs font-medium">{account.name}</span>
                      {isSelected && <Check className="h-3 w-3 text-primary" />}
                    </button>
                  );
                })}
              </div>
              {selectedAccounts.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">Select at least one platform to publish</p>
              )}
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="schedule"
                    checked={status === "scheduled"}
                    onCheckedChange={(checked) => setStatus(checked ? "scheduled" : "draft")}
                  />
                  <Label htmlFor="schedule" className="text-sm cursor-pointer">
                    Schedule for later
                  </Label>
                </div>
              </div>
              {status === "scheduled" && (
                <div className="flex gap-3 items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-start text-left font-normal text-sm">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={setScheduleDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-[100px]"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Preview */}
        <div className="xl:col-span-2">
          <Card className="sticky top-20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAccounts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Select platforms to see previews</p>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${selectedAccounts.length}, 1fr)` }}>
                    {selectedAccounts.map((accountId) => {
                      const account = accounts?.find((a) => a.id === accountId);
                      if (!account) return null;
                      const config = platformConfig[account.platform];
                      return (
                        <TabsTrigger key={accountId} value={account.platform} className="text-[10px] px-1">
                          <span className={`inline-flex items-center justify-center h-4 w-4 rounded text-[8px] font-bold mr-1 ${config?.color}`}>
                            {config?.icon}
                          </span>
                          {config?.name.split(" ")[0]}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  {selectedAccounts.map((accountId) => {
                    const account = accounts?.find((a) => a.id === accountId);
                    if (!account) return null;
                    return (
                      <TabsContent key={accountId} value={account.platform} className="mt-4">
                        <PlatformPreview
                          platform={account.platform}
                          content={content}
                          mediaFiles={mediaFiles}
                          accountName={account.name}
                          accountHandle={account.handle}
                          charLimit={platformConfig[account.platform]?.charLimit || 10000}
                        />
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PlatformPreview({
  platform,
  content,
  mediaFiles,
  accountName,
  accountHandle,
  charLimit,
}: {
  platform: string;
  content: string;
  mediaFiles: string[];
  accountName: string;
  accountHandle: string;
  charLimit: number;
}) {
  const isOverLimit = content.length > charLimit;
  const displayContent = isOverLimit ? content.slice(0, charLimit) + "..." : content;

  function renderStyledContent(text: string) {
    const parts = text.split(/(#[\w]+|@[\w]+)/g);
    return parts.map((part, i) => {
      if (/^#[\w]+$/.test(part) || /^@[\w]+$/.test(part)) {
        return <span key={i} className="text-blue-500 font-medium">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="space-y-3">
      {/* Platform-specific preview */}
      {platform === "twitter" && (
        <div className="border rounded-xl p-4 space-y-3 bg-white dark:bg-zinc-950">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {accountName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm">{accountName}</span>
                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                <span className="text-muted-foreground text-sm">{accountHandle}</span>
                <span className="text-muted-foreground text-sm">· {format(new Date(), "MMM d")}</span>
              </div>
              <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap">{renderStyledContent(displayContent)}</p>
            </div>
          </div>
          {mediaFiles.length > 0 && (
            <div className={`grid gap-1 rounded-xl overflow-hidden ${mediaFiles.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {mediaFiles.slice(0, 4).map((url, i) => (
                <img key={i} src={url} alt="" className="w-full h-32 object-cover" />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between text-muted-foreground pt-1">
            <MessageCircle className="h-4 w-4" />
            <Repeat2 className="h-4 w-4" />
            <Heart className="h-4 w-4" />
            <BarChart3 className="h-4 w-4" />
            <Share className="h-4 w-4" />
          </div>
        </div>
      )}

      {platform === "instagram" && (
        <div className="border rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-2 p-3 border-b">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {accountName.charAt(0)}
            </div>
            <span className="font-semibold text-sm">{accountHandle}</span>
            <span className="ml-auto">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </span>
          </div>
          {mediaFiles.length > 0 ? (
            <img src={mediaFiles[0]} alt="" className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square bg-muted flex items-center justify-center">
              <Image className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-4">
              <Heart className="h-6 w-6" />
              <MessageCircle className="h-6 w-6" />
              <Send className="h-6 w-6" />
              <Bookmark className="h-6 w-6 ml-auto" />
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderStyledContent(displayContent)}</p>
          </div>
        </div>
      )}

      {platform === "facebook" && (
        <div className="border rounded-xl p-4 space-y-3 bg-white dark:bg-zinc-950">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {accountName.charAt(0)}
            </div>
            <div>
              <span className="font-semibold text-sm">{accountName}</span>
              <p className="text-xs text-muted-foreground">{format(new Date(), "MMMM d at h:mm a")} · <span className="text-muted-foreground">Public</span></p>
            </div>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderStyledContent(displayContent)}</p>
          {mediaFiles.length > 0 && (
            <div className="rounded-lg overflow-hidden">
              <img src={mediaFiles[0]} alt="" className="w-full h-48 object-cover" />
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t text-muted-foreground text-sm">
            <span className="flex items-center gap-1.5"><ThumbsUp className="h-4 w-4" /> Like</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> Comment</span>
            <span className="flex items-center gap-1.5"><Share2 className="h-4 w-4" /> Share</span>
          </div>
        </div>
      )}

      {(platform === "linkedin" || platform === "tiktok" || platform === "threads") && (
        <div className="border rounded-xl p-4 space-y-3 bg-white dark:bg-zinc-950">
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
              platform === "linkedin" ? "bg-[#0A66C2]" : platform === "tiktok" ? "bg-black" : "bg-zinc-900"
            }`}>
              {accountName.charAt(0)}
            </div>
            <div>
              <span className="font-semibold text-sm">{accountName}</span>
              <p className="text-xs text-muted-foreground">{accountHandle}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderStyledContent(displayContent)}</p>
          {mediaFiles.length > 0 && (
            <div className="rounded-lg overflow-hidden">
              <img src={mediaFiles[0]} alt="" className="w-full h-48 object-cover" />
            </div>
          )}
          <div className="flex items-center gap-4 pt-2 text-muted-foreground text-sm">
            <ThumbsUp className="h-4 w-4" />
            <MessageCircle className="h-4 w-4" />
            <Repeat2 className="h-4 w-4" />
            <Send className="h-4 w-4" />
          </div>
        </div>
      )}

      {isOverLimit && (
        <p className="text-xs text-red-500 text-center">
          Content exceeds {charLimit} character limit for this platform
        </p>
      )}
    </div>
  );
}

// Additional icon components
function Eye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MessageCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function Heart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function Repeat2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 9 3-3 3 3" />
      <path d="M13 18H7a2 2 0 0 1-2-2V6" />
      <path d="m22 15-3 3-3-3" />
      <path d="M11 6h6a2 2 0 0 1 2 2v10" />
    </svg>
  );
}

function BarChart3({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

function Share({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  );
}

function MoreHorizontal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function Bookmark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function ThumbsUp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

function Share2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}
