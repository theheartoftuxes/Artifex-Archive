"use client";

import Link from "next/link";
import Image from "next/image";
import { MediaType } from "@prisma/client";
import { Heart, Video, Music, Gamepad2, FileText, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToggleSave } from "@/lib/trpc/client-hooks";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  mediaUrl: string;
  mediaType: MediaType;
  creator: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  avgRating: number | null;
  saveCount: number;
  viewCount?: number;
  tags: Array<{ id: string; name: string }>;
}

const getMediaTypeIcon = (mediaType: MediaType) => {
  switch (mediaType) {
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

export function MediaCard({
  id,
  title,
  thumbnailUrl,
  mediaUrl,
  mediaType,
  creator,
  avgRating,
  saveCount,
  viewCount,
  tags,
}: MediaCardProps) {
  const { isSaved, saveCount: currentSaveCount, toggle, isLoading: isSaving } = useToggleSave(id);
  const displayImage = thumbnailUrl || mediaUrl;
  const creatorName = creator.name || creator.username || "Unknown";

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  return (
    <Link 
      href={`/item/${id}`}
      className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
      aria-label={`View ${title}`}
    >
      <Card className="group h-full flex flex-col cursor-pointer overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {mediaType === MediaType.IMAGE ? (
            <Image
              src={displayImage}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : mediaType === MediaType.VIDEO ? (
            <div className="relative w-full h-full">
              <Image
                src={displayImage}
                alt={title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-black ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <div className="text-center">
                {getMediaTypeIcon(mediaType)}
                <p className="text-sm font-medium text-muted-foreground mt-2">
                  {mediaType}
                </p>
              </div>
            </div>
          )}
          
          {/* Media Type Badge */}
          <Badge
            variant="secondary"
            className="absolute right-2 top-2 flex items-center gap-1"
          >
            {getMediaTypeIcon(mediaType)}
            <span className="text-xs">{mediaType}</span>
          </Badge>
        </div>

        {/* Content */}
        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Creator */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={creator.image || undefined} />
              <AvatarFallback className="text-xs">
                {creator.name?.[0] || creator.username?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground line-clamp-1">
              {creatorName}
            </span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs"
                >
                  {tag.name}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Stats and Actions */}
          <div className="mt-auto space-y-3">
            {/* Rating */}
            {avgRating !== null && avgRating > 0 && (
              <div className="flex items-center gap-2">
                <Rating value={Math.max(1, Math.min(5, Math.round(avgRating)))} readonly size="sm" />
                <span className="text-sm font-medium text-muted-foreground">
                  {avgRating.toFixed(1)}
                </span>
              </div>
            )}

            {/* Save Button and Count */}
            <div className="flex items-center justify-between">
              <Button
                variant={isSaved ? "default" : "outline"}
                size="sm"
                className={cn(
                  "flex items-center gap-2",
                  isSaved && "bg-primary text-primary-foreground"
                )}
                onClick={handleSaveClick}
                disabled={isSaving}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isSaved ? "fill-current" : "fill-none"
                  )}
                />
                <span className="text-sm">
                  {isSaved ? "Saved" : "Save"}
                </span>
              </Button>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>{currentSaveCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

