"use client";

import Link from "next/link";
import Image from "next/image";
import { MediaType } from "@prisma/client";
import { Heart, Eye, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MediaItemCardProps {
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
  viewCount: number;
  tags: Array<{ id: string; name: string }>;
}

export function MediaItemCard({
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
}: MediaItemCardProps) {
  const displayImage = thumbnailUrl || mediaUrl;

  return (
    <Link href={`/item/${id}`}>
      <Card className="group hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
          {mediaType === MediaType.IMAGE ? (
            <Image
              src={displayImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : mediaType === MediaType.VIDEO ? (
            <div className="relative w-full h-full">
              <Image
                src={displayImage}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                <p className="text-sm font-medium text-muted-foreground">
                  {mediaType}
                </p>
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
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
            <span className="text-sm text-muted-foreground">
              {creator.name || creator.username || "Unknown"}
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

          {/* Stats */}
          <div className="mt-auto flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {avgRating !== null && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {avgRating.toFixed(1)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>{saveCount}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{viewCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

