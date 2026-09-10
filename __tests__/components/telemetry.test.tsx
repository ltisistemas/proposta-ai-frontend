import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/font/google", () => ({
  Inter: () => ({
    variable: "--font-inter",
  }),
  Plus_Jakarta_Sans: () => ({
    variable: "--font-jakarta",
  }),
}));

import RootLayout, { metadata, viewport } from "@/app/layout";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

describe("Telemetry & Vercel Observability Integration", () => {
  it("should render Analytics and SpeedInsights components directly without errors", () => {
    const { container: analyticsContainer } = render(<Analytics />);
    expect(analyticsContainer).toBeDefined();

    const { container: speedInsightsContainer } = render(<SpeedInsights />);
    expect(speedInsightsContainer).toBeDefined();
  });

  it("should render RootLayout with children correctly", () => {
    render(
      <RootLayout>
        <div data-testid="test-app-content">Conteúdo da Aplicação ViraPropo AI!</div>
      </RootLayout>
    );

    expect(screen.getByTestId("test-app-content")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo da Aplicação ViraPropo AI!")).toBeInTheDocument();
  });

  it("should have correct metadata and viewport configurations for production", () => {
    expect(metadata.title).toBe("ViraPropo AI! - Sua IA geradora de propostas");
    expect(metadata.description).toContain("ViraPropo AI!: gere propostas comerciais");
    expect(viewport.width).toBe("device-width");
    expect(viewport.initialScale).toBe(1);
  });
});
