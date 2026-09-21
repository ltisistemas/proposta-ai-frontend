import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory store for rate limiting
const ipStore = new Map<string, RateLimitEntry>();

// Periodic memory garbage collection every 2 minutes
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of ipStore.entries()) {
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < 10 * 60 * 1000);
      if (entry.timestamps.length === 0) {
        ipStore.delete(key);
      }
    }
  }, 2 * 60 * 1000);

  if (typeof cleanupTimer.unref === "function") {
    cleanupTimer.unref();
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds: number;
}

/**
 * Obtém o endereço IP do cliente a partir dos headers padrão de proxy/CDN
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}

/**
 * Verifica o rate limit para uma chave específica usando o algoritmo Sliding Window
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = ipStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    ipStore.set(key, entry);
  }

  // Remove timestamps fora da janela atual
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= limit) {
    const oldestTimestamp = entry.timestamps[0] || windowStart;
    const resetTimeMs = oldestTimestamp + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

    return {
      success: false,
      limit,
      remaining: 0,
      resetTimeMs,
      retryAfterSeconds,
    };
  }

  // Adiciona a requisição atual
  entry.timestamps.push(now);

  const remaining = limit - entry.timestamps.length;
  const resetTimeMs = now + windowMs;
  const retryAfterSeconds = Math.ceil(windowMs / 1000);

  return {
    success: true,
    limit,
    remaining,
    resetTimeMs,
    retryAfterSeconds,
  };
}

/**
 * Cria uma resposta HTTP 429 Too Many Requests com headers RFC 6585 padronizados
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  mensagem: string = "Muitas tentativas. Por favor, aguarde antes de tentar novamente."
): NextResponse {
  return NextResponse.json(
    {
      sucesso: false,
      erro: mensagem,
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetTimeMs / 1000)),
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}

/**
 * Limpa o estado da memória (útil para testes unitários)
 */
export function _resetRateLimiterStore(): void {
  ipStore.clear();
}
