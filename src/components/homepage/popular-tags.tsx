"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

// Hardcoded top 10 popular tags for now
const POPULAR_TAGS = [
  "cyberpunk",
  "neon",
  "abstract",
  "ambient",
  "electronic",
  "futuristic",
  "cinematic",
  "artistic",
  "nature",
  "vibrant",
];

export default function PopularTags() {
  const router = useRouter();

  const handleTagClick = (tag: string) => {
    router.push(`/search?q=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-4 bg-[#1E1E1E]">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap gap-2 justify-center">
          {POPULAR_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer bg-[#00FFC3]/30 text-[#1E1E1E] font-medium hover:bg-[#00FFC3]/40 transition-colors px-3 py-1 border border-[#00FFC3]/40"
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

