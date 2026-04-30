import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { getToken, getUser } from "@/lib/auth";

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
  const user = getUser();
  if (!user) return null;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
