import { describe, expect, it } from "vitest";
import { hasVerificationDetails } from "@/lib/verification";

describe("Account-specific verification requirements", () => {
  const document = new File(["test"], "proof.pdf", { type: "application/pdf" });
  const businessDetails = { businessName: "Test business", registrationNumber: "REG123", contactName: "Test owner", phone: "123456789", shopName: "Test shop", shopAddress: "Test address", birthDate: "1990-01-01", address: "Test residential address" };
  const businessDocuments = { registration: document, shopProof: document, identity: document };
  it("requires business and shop or firm details plus supporting documents", () => {
    const details = businessDetails;
    expect(hasVerificationDetails("business", details, { registration: document })).toBe(false);
    expect(hasVerificationDetails("business", details, businessDocuments)).toBe(true);
    expect(hasVerificationDetails("business", { ...details, shopName: "" }, businessDocuments)).toBe(false);
    expect(hasVerificationDetails("business", { ...details, shopAddress: "" }, businessDocuments)).toBe(false);
  });
  it("requires owner or representative KYC for business accounts", () => {
    expect(hasVerificationDetails("business", businessDetails, { registration: document, shopProof: document })).toBe(false);
    expect(hasVerificationDetails("business", { ...businessDetails, contactName: "" }, businessDocuments)).toBe(false);
    expect(hasVerificationDetails("business", { ...businessDetails, birthDate: "" }, businessDocuments)).toBe(false);
    expect(hasVerificationDetails("business", { ...businessDetails, address: "" }, businessDocuments)).toBe(false);
    expect(hasVerificationDetails("business", businessDetails, businessDocuments)).toBe(true);
  });
  it("requires personal KYC details and an identity document, not business documents", () => {
    const details = { legalName: "Test person", birthDate: "1990-01-01", address: "Test address" };
    expect(hasVerificationDetails("personal", details, {})).toBe(false);
    expect(hasVerificationDetails("personal", details, { identity: document })).toBe(true);
    expect(hasVerificationDetails("personal", { ...details, birthDate: "" }, { identity: document })).toBe(false);
  });
});