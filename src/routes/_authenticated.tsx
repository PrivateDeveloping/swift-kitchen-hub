import { useEffect, useState } from "react";
import { createFileRoute, redirect, Outlet, useNavigate } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { getToken, getUser, type User } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!getToken() || !getUser()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!getToken() || !u) {
      navigate({ to: "/login" });
      return;
    }
    setUser(u);
    setHydrated(true);
  }, [navigate]);

  if (!hydrated || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
