import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/lib/types";

export type DeleteMenuItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  onConfirm: (id: string) => void;
};

export function DeleteMenuItemDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
}: DeleteMenuItemDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {item?.name ?? "this item"} from the menu?</AlertDialogTitle>
          <AlertDialogDescription>
            It will no longer appear on the customer menu. If it has been part of past orders,
            those records are kept intact — the item is archived rather than erased.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={() => {
              if (item) onConfirm(item.id);
            }}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
