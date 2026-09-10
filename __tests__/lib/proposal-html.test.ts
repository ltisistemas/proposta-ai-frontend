import { describe, it, expect } from "vitest";
import { ajustarHtmlResponsivoProposta } from "@/lib/utils/proposal-html";

describe("ajustarHtmlResponsivoProposta", () => {
  it("should return empty or invalid input unchanged", () => {
    expect(ajustarHtmlResponsivoProposta("")).toBe("");
    expect(ajustarHtmlResponsivoProposta(null as any)).toBe(null);
    expect(ajustarHtmlResponsivoProposta(undefined as any)).toBe(undefined);
  });

  it("should remove inline overflow: hidden on table-responsive-wrapper and inject responsive enhancer", () => {
    const rawHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Test Proposal</title></head>
      <body>
        <div class="table-responsive-wrapper" style="border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0;">
          <table>
            <thead><tr><th>Item</th><th>Qtd</th><th>Unit</th><th>Total</th></tr></thead>
            <tbody><tr><td>Service 1</td><td>1</td><td>R$ 500,00</td><td>R$ 500,00</td></tr></tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    const adjusted = ajustarHtmlResponsivoProposta(rawHtml);

    expect(adjusted).not.toContain('overflow: hidden;');
    expect(adjusted).toContain('overflow-x: auto; -webkit-overflow-scrolling: touch;');
    expect(adjusted).toContain('data-proposta-responsive-enhancer="true"');
    expect(adjusted).toContain('@media (max-width: 640px)');
    expect(adjusted).toContain('tabular-nums');
  });

  it("should ensure meta viewport tag is present", () => {
    const rawHtmlWithoutViewport = `
      <!DOCTYPE html>
      <html>
      <head><title>Test</title></head>
      <body><p>Hello</p></body>
      </html>
    `;

    const adjusted = ajustarHtmlResponsivoProposta(rawHtmlWithoutViewport);
    expect(adjusted).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  });
});
