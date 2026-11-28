import { afterEach, describe, expect, it, vi } from "vitest";
import { request } from "@/lib/api/client";
import { confirmSale } from "@/features/leads/api";
import { getPublicComplexes } from "@/features/public-catalog/api";

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { "Content-Type": "application/json" },
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});

describe("API client and feature routes", () => {
  it("calls the public catalog without attaching a bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([]));
    vi.stubGlobal("fetch", fetchMock);

    await getPublicComplexes();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/companies/sinov-qurilish/majmualar");
    expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBeNull();
  });

  it("refreshes an expired access token and retries once", async () => {
    window.sessionStorage.setItem("construction-crm.access", "expired");
    window.sessionStorage.setItem("construction-crm.refresh", "refresh-old");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ detail: "expired" }, 401))
      .mockResolvedValueOnce(json({ access_token: "fresh", refresh_token: "refresh-new", token_type: "bearer" }))
      .mockResolvedValueOnce(json({ id: 8 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(request<{ id: number }>("/auth/me")).resolves.toEqual({ id: 8 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][1].headers.get("Authorization")).toBe("Bearer fresh");
    expect(window.sessionStorage.getItem("construction-crm.refresh")).toBe("refresh-new");
  });

  it("posts expected version to the atomic sale-confirm endpoint", async () => {
    window.sessionStorage.setItem("construction-crm.access", "access");
    const fetchMock = vi.fn().mockResolvedValue(json({ lead: { id: 5 }, apartment: { id: 9 } }));
    vi.stubGlobal("fetch", fetchMock);

    await confirmSale(5, 7);

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/crm/arizalar/5/sale/confirm");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ expected_version: 7 }));
  });
});
