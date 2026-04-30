import { createFileRoute, redirect } from "@tanstack/react-router";
import { getToken, getUser, homePathForRole } from "@/lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const user = getUser();
    if (getToken() && user) {
      throw redirect({ to: homePathForRole(user.role) });
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
