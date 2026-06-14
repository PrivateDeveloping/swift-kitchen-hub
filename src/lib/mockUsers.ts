import type { StaffUser } from "./types";

const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();

export const initialMockUsers: StaffUser[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    email: "admin@test.com",
    name: "Avery Admin",
    role: "admin",
    createdAt: weekAgo,
    updatedAt: weekAgo,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    email: "accept@test.com",
    name: "Alex Accept",
    role: "acceptance",
    createdAt: sixDaysAgo,
    updatedAt: sixDaysAgo,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    email: "kitchen@test.com",
    name: "Kim Kitchen",
    role: "kitchen",
    createdAt: fiveDaysAgo,
    updatedAt: fiveDaysAgo,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    email: "driver@test.com",
    name: "Dani Driver",
    role: "driver",
    createdAt: fourDaysAgo,
    updatedAt: fourDaysAgo,
  },
];
