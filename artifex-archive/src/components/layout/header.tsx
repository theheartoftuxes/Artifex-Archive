"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Menu, User, LogOut, Heart, Upload, X, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc/client";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === "loading";
  const [searchQuery, setSearchQuery] = useState("");
  
  // Check if user is admin
  const { data: isAdmin } = trpc.admin.isAdmin.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 text-xl font-light tracking-tight hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
          aria-label="Artifex Archive Home"
        >
          <span>Artifex Archive</span>
        </Link>

        {/* Search Bar - Hidden on mobile */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-md mx-8"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search titles, descriptions, models, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 bg-muted/50 border-border"
              aria-label="Search the archive"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu - Mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            disabled
            aria-label="Menu"
            tabIndex={-1}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Auth Section */}
          {isLoading ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name || "User"}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {getInitials(session.user.name, session.user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name || "User"}
                    </p>
                    {session.user.email && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => router.push("/account")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/account/saved")}
                  className="cursor-pointer"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  <span>Saved</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/account/uploads")}
                  className="cursor-pointer"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Uploads</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push("/admin")}
                      className="cursor-pointer"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/login")}
              className="h-9"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
