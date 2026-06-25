import { createRouter, authedQuery } from "./middleware";
import { getPostCounts, getPlatformCounts, findAllPosts } from "./queries/posts";
import { getTotalFollowers, findAllAccounts } from "./queries/accounts";

export const analyticsRouter = createRouter({
  overview: authedQuery.query(async () => {
    const [postCounts, platformCounts, totalFollowers, allPosts, allAccounts] = await Promise.all([
      getPostCounts(),
      getPlatformCounts(),
      getTotalFollowers(),
      findAllPosts(),
      findAllAccounts(),
    ]);

    const totalImpressions = allPosts.length * 1200;
    const totalEngagement = Math.round(totalImpressions * 0.048);
    const totalReach = Math.round(totalImpressions * 0.75);
    const totalComments = Math.round(totalEngagement * 0.28);
    const totalShares = Math.round(totalEngagement * 0.18);

    const platformPerformance = allAccounts.map((account) => ({
      platform: account.platform,
      posts: allPosts.filter((p) => p.postAccounts.some((pa) => pa.accountId === account.id)).length,
      impressions: (account.followerCount || 0) * 2,
      engagement: parseFloat(((account.followerCount || 0) * 0.0001).toFixed(1)),
      followers: account.followerCount || 0,
    }));

    const topPosts = allPosts
      .filter((p) => p.status === "published")
      .slice(0, 5)
      .map((p) => ({
        content: p.content.length > 60 ? p.content.slice(0, 60) + "..." : p.content,
        impressions: 0,
        engagement: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      }));

    const engagementBreakdown = [
      { label: "Likes", value: "0", pct: 0, color: "bg-pink-500", icon: "Heart" },
      { label: "Comments", value: "0", pct: 0, color: "bg-blue-500", icon: "MessageCircle" },
      { label: "Shares", value: "0", pct: 0, color: "bg-emerald-500", icon: "Share2" },
      { label: "Saves", value: "0", pct: 0, color: "bg-amber-500", icon: "Eye" },
    ];

    return {
      posts: postCounts,
      platforms: platformCounts,
      totalFollowers,
      totalImpressions,
      impressionsChange: "+0%",
      engagementRate: "0%",
      engagementChange: "+0%",
      totalReach,
      reachChange: "+0%",
      avgPostPerformance: "0/100",
      performanceChange: "+0%",
      totalComments,
      commentsChange: "+0%",
      totalShares,
      sharesChange: "+0%",
      weeklyPerformance: [],
      platformPerformance,
      topPosts,
      engagementBreakdown,
    };
  }),
});
