import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden border-b border-teal-500/20 bg-[#1E1E1E]">
      {/* Subtle teal particle effect background */}
      <div
        className="absolute inset-0 -z-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(0, 255, 195, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(0, 255, 195, 0.2) 0%, transparent 50%),
                            radial-gradient(circle at 40% 20%, rgba(0, 255, 195, 0.15) 0%, transparent 50%)`,
        }}
      />
      <div className="container relative z-10 mx-auto max-w-7xl px-4 py-24 sm:py-32 md:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-light tracking-tight text-[#00FFC3] sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-[0_0_10px_rgba(0,255,195,0.5)]">
            The Volosphere
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#E0E0E0] sm:text-xl md:text-2xl">
            A canonical library for AI-generated spheres — interactive worlds, images, music, video, games, and beyond.
          </p>
          <p className="mt-4 text-base text-[#E0E0E0]/80 sm:text-lg md:text-xl">
            Curated by creators. Preserved for discovery.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6 justify-center">
            <Button 
              asChild 
              size="lg" 
              className="h-12 px-8 text-base bg-[#00FFC3] text-[#1E1E1E] hover:bg-[#00FFC3]/90 hover:shadow-[0_0_15px_rgba(0,255,195,0.6)] transition-all"
            >
              <Link href="/library/images">Explore the Collection</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base border-[#00FFC3] text-[#00FFC3] hover:bg-[#00FFC3]/10 hover:shadow-[0_0_10px_rgba(0,255,195,0.4)] transition-all"
            >
              <Link href="/upload">Upload Your Creation</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
