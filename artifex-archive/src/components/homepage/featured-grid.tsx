"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MediaType } from "@prisma/client";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaCard } from "@/components/media/media-card";
import { MediaGridSkeleton } from "@/components/ui/media-grid-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Upload, Sparkles } from "lucide-react";

const SORT_OPTIONS = [
  { value: "top", label: "Top Rated" },
  { value: "trending", label: "Trending" },
  { value: "new", label: "Newest" },
] as const;

export default function FeaturedGrid() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize active tab from URL or default to "featured"
  const tabParam = searchParams.get("tab");
  const initialTab = (tabParam === "recent" ? "recent" : "featured") as "featured" | "recent";
  const [activeTab, setActiveTab] = useState<"featured" | "recent">(initialTab);

  // Initialize sort from URL params
  // Default: "top" for featured, "new" for recent
  const sortParam = searchParams.get("sort");
  const validSorts = ["top", "new", "trending"] as const;
  const getDefaultSort = (tab: "featured" | "recent") => tab === "featured" ? "top" : "new";
  const initialSort = (sortParam && validSorts.includes(sortParam as typeof validSorts[number]))
    ? (sortParam as typeof validSorts[number])
    : getDefaultSort(initialTab);
  
  const [featuredSort, setFeaturedSort] = useState<"top" | "new" | "trending">(
    initialTab === "featured" ? initialSort : "top"
  );
  const [recentSort, setRecentSort] = useState<"top" | "new" | "trending">(
    initialTab === "recent" ? initialSort : "new"
  );

  // Update URL when tab or sort changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = activeTab === "featured" ? featuredSort : recentSort;
    const defaultSort = getDefaultSort(activeTab);
    
    if (activeTab === "featured") {
      params.delete("tab");
    } else {
      params.set("tab", "recent");
    }
    
    if (currentSort === defaultSort) {
      params.delete("sort");
    } else {
      params.set("sort", currentSort);
    }
    
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [activeTab, featuredSort, recentSort, router, searchParams]);

  // Sync state with URL on mount (only once)
  useEffect(() => {
    if (tabParam === "recent") {
      setActiveTab("recent");
    }
    if (sortParam && validSorts.includes(sortParam as typeof validSorts[number])) {
      const sortValue = sortParam as typeof validSorts[number];
      if (tabParam === "recent") {
        setRecentSort(sortValue);
      } else {
        setFeaturedSort(sortValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Fetch featured items
  const featuredQueries = [
    trpc.media.getAllByType.useQuery({
      mediaType: MediaType.IMAGE,
      sort: featuredSort,
      limit: 4,
    }),
    trpc.media.getAllByType.useQuery({
      mediaType: MediaType.VIDEO,
      sort: featuredSort,
      limit: 4,
    }),
    trpc.media.getAllByType.useQuery({
      mediaType: MediaType.MUSIC,
      sort: featuredSort,
      limit: 4,
    }),
    trpc.media.getAllByType.useQuery({
      mediaType: MediaType.GAME,
      sort: featuredSort,
      limit: 4,
    }),
  ];

  // Fetch recently added items
  const recentQueries = [
    trpc.media.getAllByType.useQuery({
      mediaType: MediaType.IMAGE,
      sort: recentSort,
      limit: 4,
    }),
    trpc.media.getAllByType.useQuery({
      mediaType: MediaType.VIDEO,
      sort: recentSort,
      limit: 4,
    }),
    trpc.media.getAllByType.useQuery({
      mediaType: MediaType.MUSIC,
      sort: recentSort,
      limit: 4,
    }),
    trpc.media.getAllByType.useQuery({
      mediaType: MediaType.GAME,
      sort: recentSort,
      limit: 4,
    }),
  ];

  // Combine and limit results
  const featuredItems = featuredQueries
    .flatMap((query) => query.data || [])
    .slice(0, 12);

  const recentItems = recentQueries
    .flatMap((query) => query.data || [])
    .slice(0, 12);

  const isLoadingFeatured = featuredQueries.some((q) => q.isLoading);
  const isLoadingRecent = recentQueries.some((q) => q.isLoading);

  const currentSort = activeTab === "featured" ? featuredSort : recentSort;
  const setCurrentSort = activeTab === "featured" ? setFeaturedSort : setRecentSort;

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={(v) => {
        const newTab = v as "featured" | "recent";
        setActiveTab(newTab);
      }} 
      className="w-full"
    >
      <div className="flex items-center justify-between mb-8">
        <TabsList>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
        </TabsList>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select
            value={currentSort}
            onValueChange={(value) => {
              setCurrentSort(value as "top" | "new" | "trending");
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <TabsContent value="featured">
        {isLoadingFeatured ? (
          <MediaGridSkeleton count={12} />
        ) : featuredItems.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No featured items yet"
            description="Check back soon for featured content from the archive."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredItems.map((item) => (
              <MediaCard
                key={item.id}
                id={item.id}
                title={item.title}
                thumbnailUrl={item.thumbnailUrl}
                mediaUrl={item.mediaUrl}
                mediaType={item.mediaType}
                creator={item.creator}
                avgRating={item.avgRating}
                saveCount={item.saveCount}
                viewCount={item.viewCount}
                tags={item.tags}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="recent">
        {isLoadingRecent ? (
          <MediaGridSkeleton count={12} />
        ) : recentItems.length === 0 ? (
          <EmptyState
            icon={Upload}
            title="No recent items yet"
            description="Be the first to upload content to the archive!"
            action={{
              label: "Upload Now",
              href: "/upload",
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentItems.map((item) => (
              <MediaCard
                key={item.id}
                id={item.id}
                title={item.title}
                thumbnailUrl={item.thumbnailUrl}
                mediaUrl={item.mediaUrl}
                mediaType={item.mediaType}
                creator={item.creator}
                avgRating={item.avgRating}
                saveCount={item.saveCount}
                viewCount={item.viewCount}
                tags={item.tags}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
