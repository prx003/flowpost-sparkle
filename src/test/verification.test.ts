import { describe, expect, it } from "vitest";
import { hasVerificationDetails } from "@/lib/verification";

describe("Account-specific verification requirements", () => {
  const document = new File(["test"], "proof.pdf", { type: "application/pdf" });
  const businessDetails = {
    businessName: "Test business",
    businessType: "Private limited",
    category: "Retail shop",
    registrationNumber: "REG123",
    taxNumber: "GST123456",
    yearEstablished: "2020",
    businessEmail: "biz@test.com",
    phone: "123456789",
    description: "We sell things",
    shopName: "Test shop",
    premises: "Owned",
    shopAddress: "Shop address",
    contactName: "Test owner",
    role: "Owner",
    birthDate: "1990-01-01",
    idType: "PAN card",
    idNumber: "ID123456",
    address: "Test residential address",
  };
  const businessDocuments = { registration: document, taxCertificate: document, shopProof: document, identity: document, selfie: document };
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
    const details = { legalName: "Test person", birthDate: "1990-01-01", idType: "Aadhaar card", idNumber: "ID123456", address: "Test address" };
    expect(hasVerificationDetails("personal", details, {})).toBe(false);
    expect(hasVerificationDetails("personal", details, { identity: document })).toBe(false);
    expect(hasVerificationDetails("personal", details, { identity: document, selfie: document })).toBe(true);
    expect(hasVerificationDetails("personal", { ...details, birthDate: "" }, { identity: document, selfie: document })).toBe(false);
  });
});
