"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Visibility } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminItemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cursor, setCursor] = useState(0);
  const limit = 50;
  
  const { data: isAdmin } = trpc.admin.isAdmin.useQuery(undefined, {
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && isAdmin === false) {
      router.push("/");
    }
  }, [status, isAdmin, router]);

  const { data, isLoading, refetch } = trpc.admin.getAllMediaItems.useQuery(
    { cursor, limit },
    { enabled: isAdmin === true }
  );

  const toggleVisibilityMutation = trpc.admin.toggleVisibility.useMutation({
    onSuccess: () => {
      toast.success("Visibility updated");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update visibility", {
        description: error.message,
      });
    },
  });

  const deleteMutation = trpc.admin.deleteMediaItem.useMutation({
    onSuccess: () => {
      toast.success("Item deleted");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete item", {
        description: error.message,
      });
    },
  });

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleToggleVisibility = (itemId: string, currentVisibility: Visibility) => {
    const newVisibility =
      currentVisibility === Visibility.PUBLIC
        ? Visibility.UNLISTED
        : Visibility.PUBLIC;
    toggleVisibilityMutation.mutate({
      mediaItemId: itemId,
      visibility: newVisibility,
    });
  };

  const handleDelete = (itemId: string) => {
    if (confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      deleteMutation.mutate(itemId);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Media Items Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all media items in the archive
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {data?.items.length ?? 0} of {data?.total ?? 0} items
          </div>

          <div className="space-y-4">
            {data?.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <Badge variant="secondary">{item.mediaType}</Badge>
                        <Badge
                          variant={
                            item.visibility === Visibility.PUBLIC
                              ? "default"
                              : item.visibility === Visibility.UNLISTED
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {item.visibility}
                        </Badge>
                        {item.deletedAt && (
                          <Badge variant="destructive">Deleted</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>By: {item.creator.name || item.creator.username || "Unknown"}</span>
                        <span>•</span>
                        <span>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{item.viewCount} views</span>
                        <span>•</span>
                        <span>{item.saveCount} saves</span>
                      </div>
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Select
                        value={item.visibility}
                        onValueChange={(value) =>
                          toggleVisibilityMutation.mutate({
                            mediaItemId: item.id,
                            visibility: value as Visibility,
                          })
                        }
                        disabled={toggleVisibilityMutation.isPending}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Visibility.PUBLIC}>Public</SelectItem>
                          <SelectItem value={Visibility.UNLISTED}>Unlisted</SelectItem>
                          <SelectItem value={Visibility.HIDDEN}>Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending || !!item.deletedAt}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/item/${item.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={() => setCursor(Math.max(0, cursor - limit))}
              disabled={cursor === 0 || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {Math.floor(cursor / limit) + 1}
            </span>
            <Button
              variant="outline"
              onClick={() => setCursor(cursor + limit)}
              disabled={!data?.hasMore || isLoading}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

