"use client";

import { Suspense, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { MediaGridSkeleton } from "@/components/ui/media-grid-skeleton";
import dynamic from "next/dynamic";

// Dynamically import pages to avoid SSR issues
const UploadsPage = dynamic(() => import("./uploads/page"), {
  ssr: false,
  loading: () => <MediaGridSkeleton count={8} />,
});

const SavedPage = dynamic(() => import("./saved/page"), {
  ssr: false,
  loading: () => <MediaGridSkeleton count={8} />,
});

const ProfilePage = dynamic(() => import("./profile/page"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="uploads">Uploads</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Suspense fallback={<MediaGridSkeleton count={1} />}>
            <ProfilePage />
          </Suspense>
        </TabsContent>

        <TabsContent value="uploads" className="mt-6">
          <Suspense fallback={<MediaGridSkeleton count={8} />}>
            <UploadsPage />
          </Suspense>
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <Suspense fallback={<MediaGridSkeleton count={8} />}>
            <SavedPage />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

