import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, MenuItem } from "@/lib/types";
import type { CreateMenuItemInput } from "@/hooks/useMenuItems";

// `price` here is in EUROS (what the manager types); converted to cents on submit.
const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(1000).optional(),
  price: z.coerce
    .number({ invalid_type_error: "Enter a price" })
    .min(0, "Price can't be negative"),
  category: z.string().min(1, "Select a category"),
  imageUrl: z.string().trim().url("Enter a valid image URL").or(z.literal("")).optional(),
  available: z.boolean(),
});

type Values = z.infer<typeof schema>;

export type MenuFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  item: MenuItem | null;
  categories: Category[];
  onCreate: (values: CreateMenuItemInput) => Promise<void>;
  onUpdate: (id: string, values: CreateMenuItemInput) => Promise<void>;
};

export function MenuFormDialog({
  open,
  onOpenChange,
  mode,
  item,
  categories,
  onCreate,
  onUpdate,
}: MenuFormDialogProps) {
  const isCreate = mode === "create";

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      imageUrl: "",
      available: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (isCreate || !item) {
      form.reset({
        name: "",
        description: "",
        price: 0,
        category: categories[0]?.slug ?? "",
        imageUrl: "",
        available: true,
      });
    } else {
      form.reset({
        name: item.name,
        description: item.description ?? "",
        price: item.price / 100, // cents → euros for display
        category: item.category,
        imageUrl: item.imageUrl ?? "",
        available: item.available,
      });
    }
  }, [open, isCreate, item, categories, form]);

  const submit = async (values: Values) => {
    const payload: CreateMenuItemInput = {
      name: values.name.trim(),
      description: values.description?.trim() ? values.description.trim() : null,
      price: Math.round(values.price * 100), // euros → cents
      category: values.category,
      imageUrl: values.imageUrl?.trim() ? values.imageUrl.trim() : null,
      available: values.available,
    };
    try {
      if (isCreate) {
        await onCreate(payload);
      } else if (item) {
        await onUpdate(item.id, payload);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save menu item");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "Add menu item" : "Edit menu item"}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Add a new dish to the menu. It goes live on the customer site immediately if available."
              : "Update this dish. Past orders keep the name and price they were placed with."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://…" autoComplete="off" {...field} />
                  </FormControl>
                  <FormDescription>
                    Paste a link to a hosted image. Leave blank for no photo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="available"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Available</FormLabel>
                    <FormDescription>
                      When off, the item is hidden from the customer menu.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isCreate ? "Add item" : "Save changes"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
