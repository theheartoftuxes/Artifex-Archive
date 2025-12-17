import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl">404</CardTitle>
          <CardDescription className="text-lg">
            Media type not found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The media type you're looking for doesn't exist. Available types:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              <Link href="/library/images" className="text-primary hover:underline">
                Images
              </Link>
            </li>
            <li>
              <Link href="/library/music" className="text-primary hover:underline">
                Music
              </Link>
            </li>
            <li>
              <Link href="/library/videos" className="text-primary hover:underline">
                Videos
              </Link>
            </li>
            <li>
              <Link href="/library/games" className="text-primary hover:underline">
                Games
              </Link>
            </li>
            <li>
              <Link href="/library/text" className="text-primary hover:underline">
                Text
              </Link>
            </li>
          </ul>
          <div className="flex gap-4 pt-4">
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

