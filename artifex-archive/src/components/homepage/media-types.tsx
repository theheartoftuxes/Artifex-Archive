import Link from "next/link";
import { Image, Music, Video, Gamepad2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const mediaTypes = [
  {
    title: "Images",
    icon: Image,
    description: "Synthetic visuals and AI art",
    href: "/library/images",
  },
  {
    title: "Music",
    icon: Music,
    description: "Algorithmic compositions and soundscapes",
    href: "/library/music",
  },
  {
    title: "Video",
    icon: Video,
    description: "AI-generated motion and storytelling",
    href: "/library/video",
  },
  {
    title: "Games",
    icon: Gamepad2,
    description: "Procedural worlds and interactive experiments",
    href: "/library/games",
  },
];

export default function MediaTypes() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
          {mediaTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Link key={type.href} href={type.href}>
                <Card className="group h-full cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
                  <CardHeader className="flex flex-col items-center text-center pb-4">
                    <div className="mb-4 rounded-lg bg-muted p-4 transition-colors group-hover:bg-muted/80">
                      <Icon className="h-12 w-12 text-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-bold sm:text-3xl">
                      {type.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-base sm:text-lg">
                      {type.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
    </div>
  );
}
