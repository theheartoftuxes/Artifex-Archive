"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { MediaCard } from "@/components/media/media-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { MediaGridSkeleton } from "@/components/ui/media-grid-skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UploadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.media.getMyUploads.useQuery(
    {
      limit: 50,
    },
    {
      enabled: !!session?.user,
    }
  );

  const deleteMutation = trpc.media.delete.useMutation({
    onSuccess: () => {
      utils.media.getMyUploads.invalidate();
      setDeleteItemId(null);
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleDelete = () => {
    if (deleteItemId) {
      deleteMutation.mutate(deleteItemId);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Your Uploads</h1>
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
              Error loading your uploads. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Your Uploads</h1>
          <p className="text-muted-foreground mt-2">
            {data?.length ? `${data.length} uploaded item${data.length !== 1 ? "s" : ""}` : "No uploads yet"}
          </p>
        </div>

        {!data || data.length === 0 ? (
          <EmptyState
            icon={Upload}
            title="No uploads yet"
            description="Explore and save what inspires you."
            action={{
              label: "Upload Your First Item",
              href: "/upload",
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((item) => (
              <div key={item.id} className="relative group">
                <MediaCard
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
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/upload?edit=${item.id}`);
                    }}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteItemId(item.id);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This will hide it from public view.
              You can undo this action later by editing the item.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteItemId(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              variant="destructive"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

