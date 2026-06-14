import { useCallback, useMemo, useState } from "react";
import { initialMockUsers } from "@/lib/mockUsers";
import type { StaffUser, UserRole } from "@/lib/types";

export class DuplicateEmailError extends Error {
  constructor() {
    super("A user with this email already exists");
    this.name = "DuplicateEmailError";
  }
}

export class OnlyAdminError extends Error {
  constructor() {
    super("Cannot delete the only admin");
    this.name = "OnlyAdminError";
  }
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type CreateUserInput = {
  email: string;
  name: string;
  role: UserRole;
  password: string;
};

export type UpdateUserPatch = {
  name?: string;
  email?: string;
  role?: UserRole;
};

export function useUsers() {
  const [users, setUsers] = useState<StaffUser[]>(initialMockUsers);

  const sortedUsers = useMemo(
    () =>
      [...users].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [users],
  );

  const createUser = useCallback((input: CreateUserInput): StaffUser => {
    const email = input.email.toLowerCase().trim();
    let created: StaffUser | null = null;
    setUsers((prev) => {
      if (prev.some((u) => u.email.toLowerCase() === email)) {
        throw new DuplicateEmailError();
      }
      const now = new Date().toISOString();
      created = {
        id: uuid(),
        email,
        name: input.name.trim(),
        role: input.role,
        createdAt: now,
        updatedAt: now,
      };
      return [...prev, created];
    });
    // password intentionally unused in mock
    void input.password;
    if (!created) throw new Error("Failed to create user");
    return created;
  }, []);

  const updateUser = useCallback((id: string, patch: UpdateUserPatch): StaffUser => {
    let updated: StaffUser | null = null;
    setUsers((prev) => {
      if (patch.email) {
        const next = patch.email.toLowerCase().trim();
        if (prev.some((u) => u.id !== id && u.email.toLowerCase() === next)) {
          throw new DuplicateEmailError();
        }
      }
      return prev.map((u) => {
        if (u.id !== id) return u;
        updated = {
          ...u,
          ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
          ...(patch.email !== undefined ? { email: patch.email.toLowerCase().trim() } : {}),
          ...(patch.role !== undefined ? { role: patch.role } : {}),
          updatedAt: new Date().toISOString(),
        };
        return updated;
      });
    });
    if (!updated) throw new Error("User not found");
    return updated;
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => {
      const target = prev.find((u) => u.id === id);
      if (!target) return prev;
      if (target.role === "admin") {
        const admins = prev.filter((u) => u.role === "admin");
        if (admins.length <= 1) {
          throw new OnlyAdminError();
        }
      }
      return prev.filter((u) => u.id !== id);
    });
  }, []);

  const resetPassword = useCallback((_id: string, _newPassword: string) => {
    // Mock no-op. Swap point for real API.
    void _id;
    void _newPassword;
  }, []);

  return {
    users: sortedUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
  };
}
