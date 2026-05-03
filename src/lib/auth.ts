export type Role = "admin" | "acceptance" | "kitchen" | "driver";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

const TOKEN_KEY = "sk_token";
const USER_KEY = "sk_user";

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  "accept@test.com": {
    password: "password",
    user: { id: "u-accept", email: "accept@test.com", name: "Alex Accept", role: "acceptance" },
  },
  "kitchen@test.com": {
    password: "password",
    user: { id: "u-kitchen", email: "kitchen@test.com", name: "Kim Kitchen", role: "kitchen" },
  },
  "driver@test.com": {
    password: "password",
    user: { id: "u-driver", email: "driver@test.com", name: "Dani Driver", role: "driver" },
  },
  "admin@test.com": {
    password: "password",
    user: { id: "u-admin", email: "admin@test.com", name: "Avery Admin", role: "admin" },
  },
};

export function login(email: string, password: string): User | null {
  const entry = MOCK_USERS[email.toLowerCase().trim()];
  if (!entry || entry.password !== password) return null;
  const fakeJwt = `fake.${btoa(entry.user.id)}.${Date.now()}`;
  localStorage.setItem(TOKEN_KEY, fakeJwt);
  localStorage.setItem(USER_KEY, JSON.stringify(entry.user));
  return entry.user;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function homePathForRole(role: Role): string {
  switch (role) {
    case "acceptance":
      return "/acceptance";
    case "kitchen":
      return "/kitchen";
    case "driver":
      return "/driver";
    case "admin":
      return "/admin";
  }
}

export function canAccess(role: Role, route: "acceptance" | "kitchen" | "driver" | "admin"): boolean {
  if (role === "admin") return true;
  return role === route;
}
