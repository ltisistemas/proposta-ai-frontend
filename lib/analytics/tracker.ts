/**
 * Utilitário Unificado para Rastreamento de Eventos (Meta Pixel & Google Analytics)
 * Opera de forma resiliente e compatível com SSR e AdBlockers.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export interface InitiateCheckoutParams {
  value: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
}

export interface PurchaseParams {
  transaction_id: string;
  value: number;
  currency?: string;
  content_name?: string;
}

export interface CompleteRegistrationParams {
  method?: string;
  user_id?: string;
}

export const tracker = {
  /**
   * Dispara visualização de página para pixels ativos
   */
  pageView: (url?: string): void => {
    if (typeof window === "undefined") return;
    try {
      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView");
      }
      if (typeof window.gtag === "function") {
        window.gtag("event", "page_view", {
          page_location: url || window.location.href,
          page_path: url || window.location.pathname,
        });
      }
    } catch (err) {
      console.warn("Aviso ao rastrear PageView:", err);
    }
  },

  /**
   * Dispara evento de início de checkout
   */
  initiateCheckout: (params: InitiateCheckoutParams): void => {
    if (typeof window === "undefined") return;
    try {
      const currency = params.currency || "BRL";
      if (typeof window.fbq === "function") {
        window.fbq("track", "InitiateCheckout", {
          value: params.value,
          currency,
          content_name: params.content_name || "Assinatura Plano Pro",
          content_category: params.content_category || "Subscription",
        });
      }
      if (typeof window.gtag === "function") {
        window.gtag("event", "begin_checkout", {
          value: params.value,
          currency,
          items: [
            {
              item_name: params.content_name || "Assinatura Plano Pro",
              price: params.value,
              quantity: 1,
            },
          ],
        });
      }
    } catch (err) {
      console.warn("Aviso ao rastrear InitiateCheckout:", err);
    }
  },

  /**
   * Dispara evento de compra confirmada (Assinatura ativada)
   */
  purchase: (params: PurchaseParams): void => {
    if (typeof window === "undefined") return;
    try {
      const currency = params.currency || "BRL";
      if (typeof window.fbq === "function") {
        window.fbq("track", "Purchase", {
          value: params.value,
          currency,
          content_name: params.content_name || "Assinatura Plano Pro",
          transaction_id: params.transaction_id,
        });
      }
      if (typeof window.gtag === "function") {
        window.gtag("event", "purchase", {
          transaction_id: params.transaction_id,
          value: params.value,
          currency,
          items: [
            {
              item_name: params.content_name || "Assinatura Plano Pro",
              price: params.value,
              quantity: 1,
            },
          ],
        });
      }
    } catch (err) {
      console.warn("Aviso ao rastrear Purchase:", err);
    }
  },

  /**
   * Dispara evento de cadastro de novo usuário
   */
  completeRegistration: (params?: CompleteRegistrationParams): void => {
    if (typeof window === "undefined") return;
    try {
      if (typeof window.fbq === "function") {
        window.fbq("track", "CompleteRegistration", {
          status: "success",
          method: params?.method || "email",
        });
      }
      if (typeof window.gtag === "function") {
        window.gtag("event", "sign_up", {
          method: params?.method || "email",
        });
      }
    } catch (err) {
      console.warn("Aviso ao rastrear CompleteRegistration:", err);
    }
  },

  /**
   * Dispara evento customizado
   */
  customEvent: (eventName: string, params?: Record<string, any>): void => {
    if (typeof window === "undefined") return;
    try {
      if (typeof window.fbq === "function") {
        window.fbq("trackCustom", eventName, params || {});
      }
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params || {});
      }
    } catch (err) {
      console.warn(`Aviso ao rastrear evento customizado ${eventName}:`, err);
    }
  },
};
