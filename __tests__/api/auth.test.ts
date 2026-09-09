import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock DB and Auth dependencies
vi.mock("@/lib/db/users", () => ({
  obterUserPorEmail: vi.fn(),
  obterUserPorId: vi.fn(),
  criarUser: vi.fn(),
  atualizarUserProfile: vi.fn(),
}));

vi.mock("@/lib/auth/password", () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue("hashed_pass"),
}));

import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as signupHandler } from "@/app/api/auth/signup/route";
import { GET as meGetHandler, PUT as mePutHandler } from "@/app/api/auth/me/route";
import {
  obterUserPorEmail,
  obterUserPorId,
  criarUser,
  atualizarUserProfile,
} from "@/lib/db/users";
import { comparePassword } from "@/lib/auth/password";
import { gerarToken } from "@/lib/auth/jwt";

describe("API /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for invalid body schema", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "invalid-email" }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.sucesso).toBe(false);
  });

  it("should return 401 for non-existent email", async () => {
    vi.mocked(obterUserPorEmail).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "missing@test.com", password: "Password123" }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
  });

  it("should return 401 for wrong password", async () => {
    vi.mocked(obterUserPorEmail).mockResolvedValueOnce({
      id: "u1",
      email: "user@test.com",
      password_hash: "hashed",
      nome: "User",
      plano: "free",
      criado_em: new Date(),
      atualizado_em: new Date(),
    });
    vi.mocked(comparePassword).mockResolvedValueOnce(false);

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "user@test.com", password: "WrongPassword" }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
  });

  it("should return 200 with JWT token for valid credentials", async () => {
    vi.mocked(obterUserPorEmail).mockResolvedValueOnce({
      id: "u1",
      email: "user@test.com",
      password_hash: "hashed",
      nome: "User",
      plano: "pro",
      criado_em: new Date(),
      atualizado_em: new Date(),
    });
    vi.mocked(comparePassword).mockResolvedValueOnce(true);

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "user@test.com", password: "CorrectPassword123" }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.token).toBeDefined();
    expect(json.usuario.email).toBe("user@test.com");
  });
});

describe("API /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for short password or invalid input", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email: "valid@test.com", password: "123", nome: "A" }),
    });

    const res = await signupHandler(req);
    expect(res.status).toBe(400);
  });

  it("should return 409 if email is already registered", async () => {
    vi.mocked(obterUserPorEmail).mockResolvedValueOnce({
      id: "u1",
      email: "existing@test.com",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: "existing@test.com",
        password: "Password123",
        nome: "Existing",
      }),
    });

    const res = await signupHandler(req);
    expect(res.status).toBe(409);
  });

  it("should create user and return 201 with session token", async () => {
    vi.mocked(obterUserPorEmail).mockResolvedValueOnce(null);
    vi.mocked(criarUser).mockResolvedValueOnce({
      id: "u_new",
      email: "new@test.com",
      nome: "New User",
      plano: "free",
      criado_em: new Date(),
      atualizado_em: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: "new@test.com",
        password: "SecurePassword123",
        nome: "New User",
      }),
    });

    const res = await signupHandler(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.token).toBeDefined();
  });
});

describe("API /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if unauthenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/me");
    const res = await meGetHandler(req);
    expect(res.status).toBe(401);
  });

  it("should return user profile for authenticated session", async () => {
    const token = gerarToken({
      userId: "u123",
      email: "me@test.com",
      nome: "Me User",
      plano: "pro",
    });

    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "u123",
      email: "me@test.com",
      nome: "Me User",
      plano: "pro",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await meGetHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.usuario.id).toBe("u123");
  });

  it("should return 401 for invalid token in meGetHandler and mePutHandler", async () => {
    const reqGet = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: { Authorization: "Bearer invalid_tok" },
    });
    const resGet = await meGetHandler(reqGet);
    expect(resGet.status).toBe(401);

    const reqPut = new NextRequest("http://localhost:3000/api/auth/me", {
      method: "PUT",
      headers: { Authorization: "Bearer invalid_tok" },
      body: JSON.stringify({ nome: "Test" }),
    });
    const resPut = await mePutHandler(reqPut);
    expect(resPut.status).toBe(401);
  });

  it("should return 404 in meGetHandler if user not found", async () => {
    const token = gerarToken({
      userId: "u_missing",
      email: "missing@test.com",
      nome: "Missing",
      plano: "free",
    });
    vi.mocked(obterUserPorId).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await meGetHandler(req);
    expect(res.status).toBe(404);
  });

  it("should update user profile on PUT /api/auth/me", async () => {
    const token = gerarToken({
      userId: "u123",
      email: "me@test.com",
      nome: "Me User",
      plano: "pro",
    });

    vi.mocked(atualizarUserProfile).mockResolvedValueOnce({
      id: "u123",
      email: "me@test.com",
      nome: "Updated Name",
      plano: "pro",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/auth/me", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome: "Updated Name" }),
    });

    const res = await mePutHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.usuario.nome).toBe("Updated Name");
  });

  it("should return 500 when GET /api/auth/me or PUT /api/auth/me throws", async () => {
    const token = gerarToken({
      userId: "u123",
      email: "me@test.com",
      nome: "Me User",
      plano: "pro",
    });

    vi.mocked(obterUserPorId).mockRejectedValueOnce(new Error("DB Error"));
    const reqGet = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const resGet = await meGetHandler(reqGet);
    expect(resGet.status).toBe(500);

    vi.mocked(atualizarUserProfile).mockRejectedValueOnce(new Error("DB Error"));
    const reqPut = new NextRequest("http://localhost:3000/api/auth/me", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome: "Test" }),
    });
    const resPut = await mePutHandler(reqPut);
    expect(resPut.status).toBe(500);
  });

  it("should return 500 when loginHandler or signupHandler throws unexpected error", async () => {
    vi.mocked(obterUserPorEmail).mockRejectedValueOnce(new Error("DB Fatal"));
    const reqLogin = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "error@test.com", password: "Password123" }),
    });
    const resLogin = await loginHandler(reqLogin);
    expect(resLogin.status).toBe(500);

    vi.mocked(obterUserPorEmail).mockRejectedValueOnce(new Error("DB Fatal"));
    const reqSignup = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email: "error@test.com", password: "Password123", nome: "Err" }),
    });
    const resSignup = await signupHandler(reqSignup);
    expect(resSignup.status).toBe(500);
  });
});
