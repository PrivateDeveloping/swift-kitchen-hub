import { useEffect, useState } from "react";
import { createFileRoute, redirect, Outlet, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getToken, getUser, type User } from "@/lib/auth";
import { connectSocket } from "@/lib/socket";

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

    // Ensure the realtime socket is open for any logged-in session.
    // This matters on page refresh — the user is still authenticated via
    // localStorage but the in-memory socket variable was wiped.
    connectSocket();
  }, [navigate]);

  if (!hydrated || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
