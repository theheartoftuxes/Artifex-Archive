"use client";

import { Suspense, useState, FormEvent, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { MediaCard } from "@/components/media/media-card";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MediaGridSkeleton } from "@/components/ui/media-grid-skeleton";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);

  // Update local state when URL query changes
  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  const { data: results, isLoading, error } = trpc.media.search.useQuery(
    { query, limit: 30 },
    {
      enabled: !!query.trim(),
      refetchOnWindowFocus: false,
    }
  );

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search the archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base bg-muted/50 border-border"
            />
          </div>
        </form>
      </div>

      {/* Results */}
      {!query.trim() ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            Enter a search query to find media in the archive
          </p>
        </div>
      ) : isLoading ? (
        <MediaGridSkeleton count={8} />
      ) : error ? (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">Error loading search results</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      ) : results && results.length > 0 ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">
              {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
            </h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((item) => (
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
        </>
      ) : (
        <EmptyState
          icon={Search}
          title="No results found"
          description="No results – try different keywords or upload something new!"
          action={{
            label: "Upload New Content",
            href: "/upload",
          }}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <div className="h-12 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
          <MediaGridSkeleton count={8} />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
