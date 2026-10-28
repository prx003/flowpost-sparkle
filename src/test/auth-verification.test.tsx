import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

const mocks = vi.hoisted(() => ({ resend: vi.fn(), signIn: vi.fn(), toastError: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { resend: mocks.resend, signInWithPassword: mocks.signIn } } }));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ session: null }) }));
vi.mock("@/integrations/lovable/index", () => ({ lovable: { auth: {} } }));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => ({ options }), Navigate: () => null }));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError, success: vi.fn() } }));
import { Route } from "@/routes/auth";

const Page = Route.options.component as ComponentType;

describe("Sign-in verification emails", () => {
  beforeEach(() => vi.clearAllMocks());
  it("requests a signup verification link for the entered email", async () => {
    mocks.resend.mockResolvedValue({ error: null });
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "person@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Resend verification email" }));
    await waitFor(() => expect(mocks.resend).toHaveBeenCalledWith({ type: "signup", email: "person@example.com", options: { emailRedirectTo: window.location.origin } }));
    expect(await screen.findByRole("status")).toHaveTextContent("Verification email requested");
  });
  it("offers verification recovery for an unconfirmed login", async () => {
    mocks.signIn.mockResolvedValue({ error: { code: "email_not_confirmed" } });
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "person@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "test-password" } });
    fireEvent.submit(screen.getByRole("button", { name: /^Sign in$/ }).closest("form") as HTMLFormElement);
    expect(await screen.findByRole("status")).toHaveTextContent("Your email is not verified yet");
    expect(mocks.resend).not.toHaveBeenCalled();
  });
  it("shows delivery service errors instead of claiming success", async () => {
    mocks.resend.mockResolvedValue({ error: new Error("Email rate limit exceeded") });
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "person@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Resend verification email" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Email rate limit exceeded");
  });
});