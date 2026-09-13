import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { PixelTracker } from "@/components/Analytics/PixelTracker";
import LandingPage from "@/app/page";

vi.mock("@/lib/auth/useAuthStore", () => ({
  useAuthStore: vi.fn().mockReturnValue({
    user: null,
    token: null,
    isAuthenticated: false,
  }),
}));

describe("SEO, Sitemap, Robots and Structured Data", () => {
  it("should generate valid sitemap entries with priority and changeFrequency", () => {
    const entries = sitemap();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThanOrEqual(5);

    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/signup"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/login"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/termos"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/privacidade"))).toBe(true);

    const rootEntry = entries.find((e) => !e.url.includes("/signup") && !e.url.includes("/login") && !e.url.includes("/termos") && !e.url.includes("/privacidade"));
    expect(rootEntry).toBeDefined();
    expect(rootEntry?.priority).toBe(1.0);
    expect(rootEntry?.changeFrequency).toBe("daily");
  });

  it("should generate valid robots rules protecting restricted paths", () => {
    const rules = robots();
    expect(rules.sitemap).toContain("/sitemap.xml");
    expect(rules.rules).toBeDefined();

    const mainRule = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
    expect(mainRule.userAgent).toBe("*");
    expect(mainRule.allow).toContain("/");
    expect(mainRule.disallow).toContain("/dashboard");
    expect(mainRule.disallow).toContain("/config");
    expect(mainRule.disallow).toContain("/api/");
  });

  it("should render PixelTracker component without crashing", () => {
    const { container } = render(<PixelTracker />);
    expect(container).toBeDefined();
  });

  it("should render JSON-LD structured data on LandingPage", () => {
    const { container } = render(<LandingPage />);
    const jsonLdScript = container.querySelector('script[type="application/ld+json"]');
    expect(jsonLdScript).not.toBeNull();

    if (jsonLdScript) {
      const parsed = JSON.parse(jsonLdScript.innerHTML);
      expect(parsed["@context"]).toBe("https://schema.org");
      expect(parsed["@graph"]).toBeDefined();
      expect(parsed["@graph"].some((item: any) => item["@type"] === "SoftwareApplication")).toBe(true);
      expect(parsed["@graph"].some((item: any) => item["@type"] === "Organization")).toBe(true);
      expect(parsed["@graph"].some((item: any) => item["@type"] === "FAQPage")).toBe(true);
    }
  });
});
