import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  createRateLimitResponse,
  _resetRateLimiterStore,
} from "@/lib/security/rateLimiter";

describe("lib/security/rateLimiter", () => {
  beforeEach(() => {
    _resetRateLimiterStore();
  });

  describe("checkRateLimit", () => {
    it("should allow requests under the limit", () => {
      const result1 = checkRateLimit("test-ip-1", 3, 60000);
      expect(result1.success).toBe(true);
      expect(result1.limit).toBe(3);
      expect(result1.remaining).toBe(2);

      const result2 = checkRateLimit("test-ip-1", 3, 60000);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = checkRateLimit("test-ip-1", 3, 60000);
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it("should block requests when limit is exceeded", () => {
      // 3 allowed
      checkRateLimit("blocked-ip", 3, 60000);
      checkRateLimit("blocked-ip", 3, 60000);
      checkRateLimit("blocked-ip", 3, 60000);

      // 4th is blocked
      const result = checkRateLimit("blocked-ip", 3, 60000);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("should isolate limits by key", () => {
      checkRateLimit("user-a", 1, 60000);
      const blockedA = checkRateLimit("user-a", 1, 60000);
      expect(blockedA.success).toBe(false);

      // user-b should still be allowed
      const allowedB = checkRateLimit("user-b", 1, 60000);
      expect(allowedB.success).toBe(true);
    });
  });

  describe("getClientIp", () => {
    it("should extract client IP from x-forwarded-for header with multiple IPs", () => {
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
        },
      });
      expect(getClientIp(req)).toBe("203.0.113.195");
    });

    it("should extract client IP from x-real-ip header", () => {
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          "x-real-ip": "198.51.100.42",
        },
      });
      expect(getClientIp(req)).toBe("198.51.100.42");
    });

    it("should extract client IP from cf-connecting-ip header", () => {
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          "cf-connecting-ip": "192.0.2.1",
        },
      });
      expect(getClientIp(req)).toBe("192.0.2.1");
    });

    it("should fallback to 127.0.0.1 when no proxy headers exist", () => {
      const req = new NextRequest("http://localhost:3000/api/test");
      expect(getClientIp(req)).toBe("127.0.0.1");
    });
  });

  describe("createRateLimitResponse", () => {
    it("should generate a 429 response with RFC 6585 headers and message", async () => {
      const rateLimitResult = {
        success: false,
        limit: 10,
        remaining: 0,
        resetTimeMs: Date.now() + 30000,
        retryAfterSeconds: 30,
      };

      const response = createRateLimitResponse(rateLimitResult, "Muitas tentativas.");
      expect(response.status).toBe(429);
      expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("Retry-After")).toBe("30");
      expect(response.headers.get("X-RateLimit-Reset")).toBeTruthy();

      const data = await response.json();
      expect(data.sucesso).toBe(false);
      expect(data.erro).toBe("Muitas tentativas.");
      expect(data.retryAfter).toBe(30);
    });
  });
});
