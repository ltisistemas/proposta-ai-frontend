import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  gerarToken,
  verificarToken,
  obterUserIdDoToken,
  obterTokenDoHeader,
  JWTPayload,
} from "@/lib/auth/jwt";
import { hashPassword, comparePassword } from "@/lib/auth/password";
import { useAuthStore } from "@/lib/auth/useAuthStore";

describe("lib/auth/jwt", () => {
  const samplePayload: JWTPayload = {
    userId: "user_123",
    email: "test@example.com",
    nome: "Test User",
    plano: "pro",
  };

  it("should generate a valid JWT token and verify it", () => {
    const token = gerarToken(samplePayload);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const decoded = verificarToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(samplePayload.userId);
    expect(decoded?.email).toBe(samplePayload.email);
    expect(decoded?.nome).toBe(samplePayload.nome);
    expect(decoded?.plano).toBe(samplePayload.plano);
  });

  it("should return null for invalid token in verificarToken", () => {
    const result = verificarToken("invalid.token.here");
    expect(result).toBeNull();
  });

  it("should extract userId from valid token", () => {
    const token = gerarToken(samplePayload);
    const userId = obterUserIdDoToken(token);
    expect(userId).toBe("user_123");
  });

  it("should return null for userId if token is invalid", () => {
    const userId = obterUserIdDoToken("corrupted-token");
    expect(userId).toBeNull();
  });

  it("should extract bearer token from Authorization header", () => {
    expect(obterTokenDoHeader("Bearer sample_jwt_token_123")).toBe("sample_jwt_token_123");
    expect(obterTokenDoHeader("bearer sample_jwt_token_456")).toBe("sample_jwt_token_456");
    expect(obterTokenDoHeader("Basic some_creds")).toBeNull();
    expect(obterTokenDoHeader("")).toBeNull();
    expect(obterTokenDoHeader(null)).toBeNull();
    expect(obterTokenDoHeader(undefined)).toBeNull();
  });
});

describe("lib/auth/password", () => {
  it("should hash and compare passwords accurately", async () => {
    const plain = "SuperSecret123!";
    const hashed = await hashPassword(plain);

    expect(hashed).not.toBe(plain);
    expect(hashed.length).toBeGreaterThan(20);

    const isMatch = await comparePassword(plain, hashed);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword("WrongPassword", hashed);
    expect(isWrongMatch).toBe(false);
  });
});

describe("lib/auth/useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    vi.restoreAllMocks();
  });

  it("should set authentication state and save to storage", () => {
    const mockUser = {
      id: "u1",
      email: "user@test.com",
      nome: "User",
      plano: "free" as const,
    };

    useAuthStore.getState().setAuth("tok_abc", mockUser);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe("tok_abc");
    expect(state.user?.email).toBe("user@test.com");
  });

  it("should update user fields in store", () => {
    const mockUser = {
      id: "u1",
      email: "user@test.com",
      nome: "User",
      plano: "free" as const,
    };
    useAuthStore.getState().setAuth("tok_abc", mockUser);

    useAuthStore.getState().updateUser({ plano: "pro", empresa_nome: "Empresa Nova" });

    const state = useAuthStore.getState();
    expect(state.user?.plano).toBe("pro");
    expect(state.user?.empresa_nome).toBe("Empresa Nova");
  });

  it("should clear auth on logout", () => {
    const mockUser = {
      id: "u1",
      email: "user@test.com",
      nome: "User",
      plano: "free" as const,
    };
    useAuthStore.getState().setAuth("tok_abc", mockUser);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it("should fetchMe and populate session if token is valid", async () => {
    const mockUser = {
      id: "u1",
      email: "fetchme@test.com",
      nome: "Fetch User",
      plano: "pro" as const,
    };

    useAuthStore.setState({ token: "existing_token" });

    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ sucesso: true, usuario: mockUser }),
    } as any);

    await useAuthStore.getState().fetchMe();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe("fetchme@test.com");
  });

  it("should logout if fetchMe returns unsuccessful", async () => {
    useAuthStore.setState({ token: "expired_token", isAuthenticated: true });

    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ sucesso: false }),
    } as any);

    await useAuthStore.getState().fetchMe();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it("should handle fetchMe from localStorage and handle fetch exception", async () => {
    // Empty token
    useAuthStore.setState({ token: null });
    localStorage.removeItem("proposta_ai_token");
    await useAuthStore.getState().fetchMe();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Token from localStorage
    localStorage.setItem("proposta_ai_token", "local_tok_123");
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        sucesso: true,
        usuario: { id: "u_local", email: "local@test.com", nome: "Local", plano: "free" },
      }),
    } as any);
    await useAuthStore.getState().fetchMe();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Fetch throw exception
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network Down"));
    await useAuthStore.getState().fetchMe();

    // updateUser when user is null
    useAuthStore.setState({ user: null });
    useAuthStore.getState().updateUser({ nome: "Noop" });
    expect(useAuthStore.getState().user).toBeNull();
  });
});
