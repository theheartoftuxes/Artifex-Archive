"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { MediaCard } from "@/components/media/media-card";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { MediaGridSkeleton } from "@/components/ui/media-grid-skeleton";

export default function SavedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data, isLoading, error } = trpc.media.getSaved.useQuery(
    {
      limit: 50,
    },
    {
      enabled: !!session?.user,
    }
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Your Saved Items</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
        <MediaGridSkeleton count={8} />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Error loading saved items. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Your Saved Items</h1>
        <p className="text-muted-foreground mt-2">
          {data?.length ? `${data.length} saved item${data.length !== 1 ? "s" : ""}` : "No saved items yet"}
        </p>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved items yet"
          description="Explore and save what inspires you."
          action={{
            label: "Explore Archive",
            href: "/",
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((item) => (
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
    </div>
  );
}

