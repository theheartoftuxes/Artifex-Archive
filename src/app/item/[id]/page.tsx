"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { trpc } from "@/lib/trpc/client";
import { MediaType } from "@prisma/client";
import {
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Heart,
  Share2,
  Loader2,
  Clock,
  HardDrive,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Gamepad2,
  Eye,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Rating } from "@/components/ui/rating";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { useRateMedia, useToggleSave, useIncrementView } from "@/lib/trpc/client-hooks";
import { cn } from "@/lib/utils";

function MediaViewer({
  mediaType,
  mediaUrl,
  thumbnailUrl,
}: {
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl: string | null;
}) {
  switch (mediaType) {
    case MediaType.IMAGE:
      return (
        <div className="relative w-full rounded-lg" style={{ maxHeight: "80vh" }}>
          <Image
            src={mediaUrl}
            alt="Media"
            width={1920}
            height={1080}
            className="w-full h-auto rounded-lg object-contain"
            style={{ maxHeight: "80vh" }}
            loading="lazy"
            sizes="(max-width: 1024px) 100vw, 66vw"
          />
        </div>
      );
    case MediaType.VIDEO:
      return (
        <video
          src={mediaUrl}
          controls
          className="w-full h-auto rounded-lg max-h-[80vh]"
          loading="lazy"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      );
    case MediaType.MUSIC:
      return (
        <div className="w-full flex flex-col items-center justify-center p-8 bg-muted rounded-lg">
          <Music className="h-16 w-16 mb-4 text-muted-foreground" />
          <audio src={mediaUrl} controls className="w-full max-w-md" preload="metadata">
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    case MediaType.GAME:
      return (
        <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
          <iframe
            src={mediaUrl}
            className="w-full h-full rounded-lg"
            title="Game"
            allow="fullscreen"
            loading="lazy"
          />
        </div>
      );
    case MediaType.TEXT:
      return (
        <div className="w-full bg-muted rounded-lg p-6">
          <pre className="whitespace-pre-wrap font-mono text-sm overflow-auto max-h-[60vh]">
            {mediaUrl}
          </pre>
        </div>
      );
    default:
      return (
        <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Unsupported media type</p>
        </div>
      );
  }
}

function MediaItemContent({ id }: { id: string }) {
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  const { data, isLoading, error } = trpc.media.getById.useQuery(id);
  
  // Use custom hooks for interactions
  const { rate, isLoading: isRating } = useRateMedia(id);
  const { isSaved, saveCount, toggle, isLoading: isSaving } = useToggleSave(id);
  useIncrementView(id); // Automatically increments view on mount

  // Note: User rating will be tracked locally and updated optimistically
  // In a production app, you might want to add a query to fetch the user's existing rating

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !data?.mediaItem) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-muted-foreground">
              Media item not found. It may have been removed or doesn't exist.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/upload">Upload New Item</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { mediaItem, metadata } = data;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
      setTimeout(() => setIsSharing(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      setIsSharing(false);
    }
  };

  const handleRatingChange = (value: number) => {
    setUserRating(value);
    rate(value);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getMediaTypeIcon = () => {
    switch (mediaItem.mediaType) {
      case MediaType.IMAGE:
        return <ImageIcon className="h-4 w-4" />;
      case MediaType.VIDEO:
        return <Video className="h-4 w-4" />;
      case MediaType.MUSIC:
        return <Music className="h-4 w-4" />;
      case MediaType.GAME:
        return <Gamepad2 className="h-4 w-4" />;
      case MediaType.TEXT:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 pb-24 lg:pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media Viewer */}
          <Card>
            <CardContent className="p-0">
              <MediaViewer
                mediaType={mediaItem.mediaType}
                mediaUrl={mediaItem.mediaUrl}
                thumbnailUrl={mediaItem.thumbnailUrl}
              />
            </CardContent>
          </Card>

          {/* Title and Description */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getMediaTypeIcon()}
                <Badge variant="outline">{mediaItem.mediaType}</Badge>
                {mediaItem.visibility === "UNLISTED" && (
                  <Badge variant="secondary">Unlisted</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold">{mediaItem.title}</h1>
            </div>

            {mediaItem.description && (
              <p className="text-muted-foreground leading-relaxed">
                {mediaItem.description}
              </p>
            )}

            {/* Creator Info */}
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={mediaItem.creator.image || undefined} />
                <AvatarFallback>
                  {mediaItem.creator.name?.[0] || mediaItem.creator.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {mediaItem.creator.name || mediaItem.creator.username || "Unknown"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mediaItem.creator.username && `@${mediaItem.creator.username}`}
                </p>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(mediaItem.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            {/* Tags */}
            {mediaItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {mediaItem.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* AI Model & Prompt (Collapsible) */}
            {(mediaItem.aiModelUsed || mediaItem.promptSummary) && (
              <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span>AI Model & Prompt</span>
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-2">
                  {mediaItem.aiModelUsed && (
                    <div>
                      <p className="text-sm font-medium mb-1">AI Model</p>
                      <p className="text-sm text-muted-foreground">
                        {mediaItem.aiModelUsed}
                      </p>
                    </div>
                  )}
                  {mediaItem.promptSummary && (
                    <div>
                      <p className="text-sm font-medium mb-1">Prompt Summary</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {mediaItem.promptSummary}
                      </p>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <div className="hidden lg:block space-y-6">
          <div className="sticky top-4">
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Actions */}
                <div className="space-y-6">
            {/* Rating */}
            {session?.user ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Rate this item</h3>
                <div className="space-y-2">
                  <Rating
                    value={userRating || 0}
                    onChange={handleRatingChange}
                    size="lg"
                    className="justify-center"
                  />
                  {isRating && (
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Saving rating...</span>
                    </div>
                  )}
                  {mediaItem.avgRating !== null ? (
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium">
                        {mediaItem.avgRating.toFixed(1)} / 5.0
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mediaItem.ratingCount} {mediaItem.ratingCount === 1 ? "rating" : "ratings"}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Start rating to see recommendations
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Rating</h3>
                {mediaItem.avgRating !== null ? (
                  <div className="text-center space-y-1">
                    <Rating value={Math.max(1, Math.min(5, Math.round(mediaItem.avgRating)))} readonly size="lg" className="justify-center" />
                    <p className="text-sm font-medium">
                      {mediaItem.avgRating.toFixed(1)} / 5.0
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mediaItem.ratingCount} {mediaItem.ratingCount === 1 ? "rating" : "ratings"}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      No ratings yet
                    </p>
                  </div>
                )}
              </div>
            )}

                  <Separator />

                  {/* Save Button */}
                  <div className="space-y-3">
                    <Button
                      variant={isSaved ? "default" : "outline"}
                      size="lg"
                      className={cn(
                        "w-full h-auto py-6 flex flex-col items-center gap-2 transition-all duration-200",
                        isSaved && "bg-primary text-primary-foreground",
                        isSaving && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={toggle}
                      disabled={isSaving}
                    >
                      <Heart
                        className={cn(
                          "h-8 w-8 transition-all duration-200",
                          isSaved
                            ? "fill-current scale-110"
                            : "fill-none scale-100"
                        )}
                      />
                      <span className="text-base font-medium">
                        {isSaved ? "Saved" : "Save"}
                      </span>
                      <span className="text-xs opacity-75">
                        {saveCount.toLocaleString()} {saveCount === 1 ? "save" : "saves"}
                      </span>
                    </Button>
                  </div>

                  <Separator />

                  {/* View Count */}
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{mediaItem.viewCount.toLocaleString()} views</span>
                  </div>

                  <Separator />

                  {/* Share */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleShare}
                    disabled={isSharing}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    {isSharing ? "Link Copied!" : "Share"}
                  </Button>
                </div>

                {/* Metadata */}
                {metadata && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold">Metadata</h3>
                      <div className="space-y-2 text-sm">
                        {metadata.format && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Format</span>
                            <span className="font-medium uppercase">
                              {metadata.format}
                            </span>
                          </div>
                        )}
                        {metadata.dimensions && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dimensions</span>
                            <span className="font-medium">
                              {metadata.dimensions}
                            </span>
                          </div>
                        )}
                        {metadata.duration && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Duration
                            </span>
                            <span className="font-medium">
                              {formatDuration(metadata.duration)}
                            </span>
                          </div>
                        )}
                        {metadata.fileSize && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              Size
                            </span>
                            <span className="font-medium">
                              {formatFileSize(metadata.fileSize)}
                            </span>
                          </div>
                        )}
                        {metadata.bpm && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">BPM</span>
                            <span className="font-medium">{metadata.bpm}</span>
                          </div>
                        )}
                        {metadata.genre && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Genre</span>
                            <span className="font-medium">{metadata.genre}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* License */}
                {mediaItem.license && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">License</h3>
                      <p className="text-xs text-muted-foreground">
                        {mediaItem.license}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Bar - Mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50 p-4 shadow-lg">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between gap-4">
              {/* Rating - Mobile */}
              {session?.user && (
                <div className="flex-1 flex flex-col items-center gap-1">
                  <Rating
                    value={userRating || 0}
                    onChange={handleRatingChange}
                    size="sm"
                    className="justify-center"
                  />
                  {mediaItem.avgRating !== null && (
                    <span className="text-xs text-muted-foreground">
                      {mediaItem.avgRating.toFixed(1)}
                    </span>
                  )}
                  {isRating && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}

              {/* Save Button - Mobile */}
              <Button
                variant={isSaved ? "default" : "outline"}
                size="lg"
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-3 px-4 min-w-[80px] transition-all duration-200",
                  isSaved && "bg-primary text-primary-foreground",
                  isSaving && "opacity-50 cursor-not-allowed"
                )}
                onClick={toggle}
                disabled={isSaving}
              >
                <Heart
                  className={cn(
                    "h-6 w-6 transition-all duration-200",
                    isSaved
                      ? "fill-current scale-110"
                      : "fill-none scale-100"
                  )}
                />
                <span className="text-xs font-medium">
                  {isSaved ? "Saved" : "Save"}
                </span>
                <span className="text-[10px] opacity-75">
                  {saveCount.toLocaleString()}
                </span>
              </Button>

              {/* View Count - Mobile */}
              <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{mediaItem.viewCount.toLocaleString()}</span>
              </div>

              {/* Share - Mobile */}
              <Button
                variant="outline"
                size="lg"
                className="h-auto py-3 px-4"
                onClick={handleShare}
                disabled={isSharing}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MediaItemPage() {
  const params = useParams();
  const id = params.id as string;

  if (id === "new") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-muted-foreground">
              Media item not found.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/upload">Upload New Item</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <MediaItemContent id={id} />
    </Suspense>
  );
}

