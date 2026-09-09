import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Set dummy environment variables for tests
process.env.JWT_SECRET = "test-secret-key-12345678901234567890";
process.env.ABACATE_API_KEY = "test_abacate_api_key";
process.env.ABACATE_WEBHOOK_SECRET = "test_webhook_secret";
process.env.GEMINI_API_KEY = "test_gemini_key";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/test";
