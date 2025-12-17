import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden border-b border-border bg-gradient-to-b from-background via-background to-muted/20">
      <div
        className="absolute inset-0 -z-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="container relative z-10 mx-auto max-w-7xl px-4 py-24 sm:py-32 md:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-left">
          <h1 className="text-4xl font-light tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Artifex Archive
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl md:text-2xl">
            A canonical library for AI-generated media — images, music, video,
            games, and beyond.
          </p>
          <p className="mt-4 text-base text-muted-foreground/80 sm:text-lg md:text-xl">
            Curated by creators. Preserved for discovery.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/library/images">Explore the Collection</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base"
            >
              <Link href="/upload">Upload Your Creation</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
