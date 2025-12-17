"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { MediaType } from "@prisma/client";
import { trpc } from "@/lib/trpc/client";
import { MediaCard } from "@/components/media/media-card";
import Header from "@/components/layout/header";
import PopularTags from "@/components/homepage/popular-tags";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { MediaGridSkeleton } from "@/components/ui/media-grid-skeleton";

// Map URL paths to MediaType enum
const MEDIA_TYPE_MAP: Record<string, MediaType> = {
  images: MediaType.IMAGE,
  music: MediaType.MUSIC,
  videos: MediaType.VIDEO,
  games: MediaType.GAME,
  text: MediaType.TEXT,
};

const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  [MediaType.IMAGE]: "Images",
  [MediaType.MUSIC]: "Music",
  [MediaType.VIDEO]: "Videos",
  [MediaType.GAME]: "Games",
  [MediaType.TEXT]: "Text",
};

const SORT_OPTIONS = [
  { value: "top", label: "Top Rated" },
  { value: "new", label: "Newest" },
  { value: "trending", label: "Trending" },
] as const;

const ITEMS_PER_PAGE = 20;

export default function LibraryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mediaTypeParam = params.mediaType as string;

  // Initialize sort from URL params, default to "new"
  const sortParam = searchParams.get("sort");
  const validSorts = ["top", "new", "trending"] as const;
  const initialSort: "top" | "new" | "trending" = 
    (sortParam && validSorts.includes(sortParam as typeof validSorts[number]))
      ? (sortParam as typeof validSorts[number])
      : "new";

  const [sort, setSort] = useState<"top" | "new" | "trending">(initialSort);
  const [cursor, setCursor] = useState(0);
  const [minRating, setMinRating] = useState([0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Validate media type
  const mediaType = MEDIA_TYPE_MAP[mediaTypeParam];

  // Update URL when sort changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "new") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  const { data, isLoading, isFetching } = trpc.media.getAllByType.useQuery(
    {
      mediaType: mediaType!,
      sort,
      cursor,
      limit: ITEMS_PER_PAGE,
    },
    {
      enabled: !!mediaType, // Only run query if mediaType is valid
    }
  );

  // Extract all unique tags from the data
  const allTags = useMemo(() => {
    if (!data) return [];
    const tagSet = new Set<string>();
    data.forEach((item) => {
      item.tags.forEach((tag) => tagSet.add(tag.name));
    });
    return Array.from(tagSet).sort();
  }, [data]);

  // Filter items client-side (since backend doesn't support filters yet)
  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) => {
      // Rating filter
      if (minRating[0] > 0) {
        if (!item.avgRating || item.avgRating < minRating[0]) {
          return false;
        }
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const itemTagNames = item.tags.map((tag) => tag.name);
        const hasSelectedTag = selectedTags.some((tag) =>
          itemTagNames.includes(tag)
        );
        if (!hasSelectedTag) {
          return false;
        }
      }

      // Date range filter
      if (dateFrom || dateTo) {
        const itemDate = new Date(item.createdAt);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (itemDate < fromDate) return false;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (itemDate > toDate) return false;
        }
      }

      return true;
    });
  }, [data, minRating, selectedTags, dateFrom, dateTo]);

  // Validate media type - show 404 if invalid
  if (!mediaType) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-muted-foreground">
              Invalid media type. Available types: images, music, videos, games, text
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasMore = filteredData.length === ITEMS_PER_PAGE;
  const hasPrevious = cursor > 0;

  const handleNext = () => {
    setCursor((prev) => prev + ITEMS_PER_PAGE);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevious = () => {
    setCursor((prev) => Math.max(0, prev - ITEMS_PER_PAGE));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setCursor(0); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setMinRating([0]);
    setSelectedTags([]);
    setDateFrom("");
    setDateTo("");
    setCursor(0);
  };

  const hasActiveFilters =
    minRating[0] > 0 || selectedTags.length > 0 || dateFrom || dateTo;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PopularTags />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{MEDIA_TYPE_LABELS[mediaType]}</h1>
          <p className="text-muted-foreground mt-2">
            Browse and discover {MEDIA_TYPE_LABELS[mediaType].toLowerCase()}
          </p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filters</CardTitle>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rating Filter */}
              <div className="space-y-3">
                <Label>Minimum Rating</Label>
                <div className="px-2">
                  <Slider
                    value={minRating}
                    onValueChange={setMinRating}
                    min={0}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0</span>
                    <span className="font-medium">{minRating[0].toFixed(1)}</span>
                    <span>5.0</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div className="space-y-3">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Date Range Filter */}
              <div className="space-y-3">
                <Label>Date Range</Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="date-from" className="text-xs">
                      From
                    </Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setCursor(0);
                      }}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-to" className="text-xs">
                      To
                    </Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setCursor(0);
                      }}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sort Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select
                value={sort}
                onValueChange={(value) => {
                  const newSort = value as "top" | "new" | "trending";
                  setSort(newSort);
                  setCursor(0); // Reset to first page when sort changes
                }}
              >
                <SelectTrigger className="w-[180px]">
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

            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {filteredData.length} result{filteredData.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Results Grid */}
          {isLoading || isFetching ? (
            <MediaGridSkeleton count={8} />
          ) : filteredData.length === 0 ? (
            <EmptyState
              icon={Upload}
              title={`Be the first to upload a ${MEDIA_TYPE_LABELS[mediaType].toLowerCase()}!`}
              description={
                hasActiveFilters
                  ? "No items found matching your filters. Try adjusting your search criteria."
                  : `This category is empty. Be the first to contribute a ${MEDIA_TYPE_LABELS[mediaType].toLowerCase()} to the archive!`
              }
              action={
                !hasActiveFilters
                  ? {
                      label: "Upload Now",
                      href: "/upload",
                    }
                  : undefined
              }
            />
          ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredData.map((item) => (
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

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={!hasPrevious || isLoading}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    <span className="text-sm text-muted-foreground">
                      Page {Math.floor(cursor / ITEMS_PER_PAGE) + 1}
                    </span>

                    <Button
                      variant="outline"
                      onClick={handleNext}
                      disabled={!hasMore || isLoading}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
        </div>
      </div>
      </div>
    </div>
  );
}

