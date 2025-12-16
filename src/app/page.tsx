import { Suspense } from "react";
import Header from "@/components/layout/header";
import Hero from "@/components/homepage/hero";
import MediaTypes from "@/components/homepage/media-types";
import FeaturedGrid from "@/components/homepage/featured-grid";
import PopularTags from "@/components/homepage/popular-tags";
import { MediaGridSkeleton } from "@/components/ui/media-grid-skeleton";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Suspense fallback={<div className="h-16" />}>
        <PopularTags />
      </Suspense>
      <main className="flex-1">
        <Hero />
        <section className="w-full border-b border-border bg-background py-16 sm:py-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-12 text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              Browse by Category
            </h2>
            <MediaTypes />
          </div>
        </section>
        <section className="w-full border-b border-border bg-background py-16 sm:py-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-12 text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              Discover
            </h2>
            <Suspense fallback={<MediaGridSkeleton count={12} />}>
              <FeaturedGrid />
            </Suspense>
          </div>
        </section>
      </main>
      <footer className="w-full border-t border-border bg-background py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Artifex Archive • A library for the synthetic age
          </p>
        </div>
      </footer>
    </div>
  );
}
