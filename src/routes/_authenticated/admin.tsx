import { createFileRoute } from "@tanstack/react-router";
import { RolePlaceholder } from "@/components/RolePlaceholder";

export const Route = createFileRoute("/_authenticated/admin")({
  component: () => <RolePlaceholder role="Admin" />,
});
