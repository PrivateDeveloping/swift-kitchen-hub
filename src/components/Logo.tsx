import { ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Swift Kitchen brand mark — a chef's hat in a rounded brand-colored badge.
 * Sized by the passed className (e.g. h-8 w-8); the glyph scales to fit, so it
 * stays legible both in the sidebar header and in the collapsed icon rail.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden
    >
      <ChefHat className="h-[58%] w-[58%]" strokeWidth={2.25} />
    </div>
  );
}
