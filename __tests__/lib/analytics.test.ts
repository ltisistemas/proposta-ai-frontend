import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tracker } from "@/lib/analytics/tracker";

describe("lib/analytics/tracker", () => {
  const originalFbq = window.fbq;
  const originalGtag = window.gtag;

  beforeEach(() => {
    window.fbq = vi.fn();
    window.gtag = vi.fn();
  });

  afterEach(() => {
    window.fbq = originalFbq;
    window.gtag = originalGtag;
  });

  it("should trigger pageView on fbq and gtag", () => {
    tracker.pageView("https://virapropoai.com/dashboard");
    expect(window.fbq).toHaveBeenCalledWith("track", "PageView");
    expect(window.gtag).toHaveBeenCalledWith("event", "page_view", {
      page_location: "https://virapropoai.com/dashboard",
      page_path: "https://virapropoai.com/dashboard",
    });
  });

  it("should trigger initiateCheckout with correct payload", () => {
    tracker.initiateCheckout({
      value: 45.9,
      currency: "BRL",
      content_name: "Assinatura Plano Pro",
    });

    expect(window.fbq).toHaveBeenCalledWith("track", "InitiateCheckout", {
      value: 45.9,
      currency: "BRL",
      content_name: "Assinatura Plano Pro",
      content_category: "Subscription",
    });

    expect(window.gtag).toHaveBeenCalledWith("event", "begin_checkout", {
      value: 45.9,
      currency: "BRL",
      items: [
        {
          item_name: "Assinatura Plano Pro",
          price: 45.9,
          quantity: 1,
        },
      ],
    });
  });

  it("should trigger purchase with transaction_id and value", () => {
    tracker.purchase({
      transaction_id: "pay_123456",
      value: 45.9,
      currency: "BRL",
      content_name: "Assinatura Plano Pro",
    });

    expect(window.fbq).toHaveBeenCalledWith("track", "Purchase", {
      value: 45.9,
      currency: "BRL",
      content_name: "Assinatura Plano Pro",
      transaction_id: "pay_123456",
    });

    expect(window.gtag).toHaveBeenCalledWith("event", "purchase", {
      transaction_id: "pay_123456",
      value: 45.9,
      currency: "BRL",
      items: [
        {
          item_name: "Assinatura Plano Pro",
          price: 45.9,
          quantity: 1,
        },
      ],
    });
  });

  it("should trigger completeRegistration", () => {
    tracker.completeRegistration({ method: "email", user_id: "u_test" });
    expect(window.fbq).toHaveBeenCalledWith("track", "CompleteRegistration", {
      status: "success",
      method: "email",
    });
    expect(window.gtag).toHaveBeenCalledWith("event", "sign_up", {
      method: "email",
    });
  });

  it("should trigger customEvent with arbitrary payload", () => {
    tracker.customEvent("GenerateProposal", { proposta_id: "p1" });
    expect(window.fbq).toHaveBeenCalledWith("trackCustom", "GenerateProposal", {
      proposta_id: "p1",
    });
    expect(window.gtag).toHaveBeenCalledWith("event", "GenerateProposal", {
      proposta_id: "p1",
    });
  });

  it("should handle missing fbq and gtag without throwing", () => {
    delete (window as any).fbq;
    delete (window as any).gtag;

    expect(() => tracker.pageView()).not.toThrow();
    expect(() =>
      tracker.initiateCheckout({ value: 45.9, currency: "BRL" })
    ).not.toThrow();
    expect(() =>
      tracker.purchase({ transaction_id: "p1", value: 45.9, currency: "BRL" })
    ).not.toThrow();
    expect(() => tracker.completeRegistration()).not.toThrow();
    expect(() => tracker.customEvent("Test")).not.toThrow();
  });
});
