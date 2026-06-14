import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequireRole } from "@/components/RequireRole";
import { StaffTable } from "@/components/admin/StaffTable";
import { StaffFormDialog } from "@/components/admin/StaffFormDialog";
import { ResetPasswordDialog } from "@/components/admin/ResetPasswordDialog";
import { DeleteUserDialog } from "@/components/admin/DeleteUserDialog";
import { OnlyAdminError, useUsers } from "@/hooks/useUsers";
import type { StaffUser, UserRole } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/admin")({
  component: () => (
    <RequireRole route="admin">
      <AdminDashboard />
    </RequireRole>
  ),
});

type DialogState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; user: StaffUser }
  | { kind: "reset"; user: StaffUser }
  | { kind: "delete"; user: StaffUser };

function AdminDashboard() {
  const { users, createUser, updateUser, deleteUser, resetPassword } = useUsers();
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput), 200);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  const close = () => setDialog({ kind: "none" });

  const handleCreate = (values: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
  }) => {
    const created = createUser(values);
    toast.success(`Account created for ${created.name}`);
  };

  const handleUpdate = (
    id: string,
    values: { name: string; email: string; role: UserRole },
  ) => {
    updateUser(id, values);
    toast.success("Account updated");
  };

  const handleReset = (id: string, newPassword: string) => {
    resetPassword(id, newPassword);
    toast.success("Password reset");
  };

  const handleDelete = (id: string) => {
    try {
      deleteUser(id);
      toast.success("Account deleted.");
      close();
    } catch (err) {
      if (err instanceof OnlyAdminError) {
        toast.error("Cannot delete the only admin account.");
        close();
        return;
      }
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage who can access Swift Kitchen and what they can do.
          </p>
        </div>
        <Button onClick={() => setDialog({ kind: "create" })}>
          <Plus className="h-4 w-4" />
          Add staff
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState onAdd={() => setDialog({ kind: "create" })} />
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email"
              className="pl-9"
              aria-label="Search staff"
            />
          </div>

          <StaffTable
            users={filtered}
            onEdit={(u) => setDialog({ kind: "edit", user: u })}
            onResetPassword={(u) => setDialog({ kind: "reset", user: u })}
            onDelete={(u) => setDialog({ kind: "delete", user: u })}
          />

          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No staff match "{search}".
            </p>
          )}
        </>
      )}

      <StaffFormDialog
        mode={dialog.kind === "edit" ? "edit" : "create"}
        open={dialog.kind === "create" || dialog.kind === "edit"}
        onOpenChange={(v) => !v && close()}
        user={dialog.kind === "edit" ? dialog.user : null}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
      <ResetPasswordDialog
        open={dialog.kind === "reset"}
        onOpenChange={(v) => !v && close()}
        user={dialog.kind === "reset" ? dialog.user : null}
        onConfirm={handleReset}
      />
      <DeleteUserDialog
        open={dialog.kind === "delete"}
        onOpenChange={(v) => !v && close()}
        user={dialog.kind === "delete" ? dialog.user : null}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Users className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">No staff accounts yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your first account to get started.
      </p>
      <Button className="mt-4" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Add staff
      </Button>
    </div>
  );
}
