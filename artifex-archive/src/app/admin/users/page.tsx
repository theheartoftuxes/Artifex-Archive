"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ban, UserCheck, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cursor, setCursor] = useState(0);
  const limit = 50;
  
  const { data: isAdmin } = trpc.admin.isAdmin.useQuery(undefined, {
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && isAdmin === false) {
      router.push("/");
    }
  }, [status, isAdmin, router]);

  const { data, isLoading, refetch } = trpc.admin.getAllUsers.useQuery(
    { cursor, limit },
    { enabled: isAdmin === true }
  );

  const toggleBanMutation = trpc.admin.toggleBanUser.useMutation({
    onSuccess: () => {
      toast.success("User status updated");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update user", {
        description: error.message,
      });
    },
  });

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleToggleBan = (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? "unban" : "ban";
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      toggleBanMutation.mutate({
        userId,
        isBanned: !currentStatus,
      });
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users and bans
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {data?.users.length ?? 0} of {data?.total ?? 0} users
          </div>

          <div className="space-y-4">
            {data?.users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {user.name || user.username || "Unknown User"}
                        </h3>
                        {user.isBanned && (
                          <Badge variant="destructive">Banned</Badge>
                        )}
                        {user.isAdmin && (
                          <Badge variant="default">Admin</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {user.email && <span>{user.email}</span>}
                        {user.username && (
                          <>
                            <span>•</span>
                            <span>@{user.username}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>{user._count.mediaItems} items</span>
                        <span>•</span>
                        <span>{user._count.ratings} ratings</span>
                        <span>•</span>
                        <span>{user._count.saves} saves</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant={user.isBanned ? "default" : "destructive"}
                        size="sm"
                        onClick={() => handleToggleBan(user.id, user.isBanned)}
                        disabled={toggleBanMutation.isPending}
                      >
                        {user.isBanned ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Unban
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
                            Ban
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={() => setCursor(Math.max(0, cursor - limit))}
              disabled={cursor === 0 || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {Math.floor(cursor / limit) + 1}
            </span>
            <Button
              variant="outline"
              onClick={() => setCursor(cursor + limit)}
              disabled={!data?.hasMore || isLoading}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

