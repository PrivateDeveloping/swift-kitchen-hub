import { createFileRoute } from "@tanstack/react-router";
import { RolePlaceholder } from "@/components/RolePlaceholder";
import { RequireRole } from "@/components/RequireRole";

export const Route = createFileRoute("/_authenticated/admin")({
  component: () => (
    <RequireRole route="admin">
      <RolePlaceholder role="Admin" />
    </RequireRole>
  ),
});
