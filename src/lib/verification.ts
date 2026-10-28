export type VerificationAccount = "personal" | "business";
export type VerificationField = { name: string; label: string; type?: "date" | "tel" | "email" | "url" | "number"; multiline?: boolean; section?: string; options?: string[]; optional?: boolean };

const idTypes = ["Aadhaar card", "PAN card", "Passport", "Driving licence", "Voter ID"];

export const verificationFields: Record<VerificationAccount, VerificationField[]> = {
  business: [
    { name: "businessName", label: "Registered business / firm name", section: "Business details" },
    { name: "businessType", label: "Type of business", options: ["Sole proprietorship", "Partnership", "LLP", "Private limited", "Public limited", "Other"] },
    { name: "category", label: "Business category", options: ["Retail shop", "Restaurant / café", "Services", "Manufacturing", "Events / entertainment", "Online store", "Other"] },
    { name: "registrationNumber", label: "Business registration number" },
    { name: "taxNumber", label: "GST / tax number" },
    { name: "yearEstablished", label: "Year established", type: "number" },
    { name: "businessEmail", label: "Business email", type: "email" },
    { name: "phone", label: "Business contact number", type: "tel" },
    { name: "website", label: "Website (optional)", type: "url", optional: true },
    { name: "description", label: "What does your business do?", multiline: true },
    { name: "shopName", label: "Shop / firm name", section: "Shop or firm details" },
    { name: "premises", label: "Premises", options: ["Owned", "Rented / leased", "Home-based", "Online only"] },
    { name: "shopAddress", label: "Shop / firm address", multiline: true },
    { name: "contactName", label: "Owner / authorised representative full legal name", section: "Owner / authorised representative KYC" },
    { name: "role", label: "Role in business", options: ["Owner", "Partner", "Director", "Authorised representative"] },
    { name: "birthDate", label: "Date of birth", type: "date" },
    { name: "idType", label: "Identity document type", options: idTypes },
    { name: "idNumber", label: "Identity document number" },
    { name: "address", label: "Residential address", multiline: true },
  ],
  personal: [
    { name: "legalName", label: "Full legal name" },
    { name: "birthDate", label: "Date of birth", type: "date" },
    { name: "idType", label: "Identity document type", options: idTypes },
    { name: "idNumber", label: "Identity document number" },
    { name: "address", label: "Residential address", multiline: true },
  ],
};

export const verificationDocuments: Record<VerificationAccount, { name: string; label: string }[]> = {
  business: [
    { name: "registration", label: "Business registration document" },
    { name: "taxCertificate", label: "GST / tax certificate" },
    { name: "shopProof", label: "Shop / firm proof (licence, lease or utility bill)" },
    { name: "identity", label: "Owner / authorised representative government-issued identity document" },
    { name: "selfie", label: "Selfie of owner / representative holding the identity document" },
  ],
  personal: [
    { name: "identity", label: "Government-issued identity document" },
    { name: "selfie", label: "Selfie holding your identity document" },
  ],
};

export function hasVerificationDetails(account: VerificationAccount, values: Record<string, string>, documents: Record<string, File | undefined>) {
  return verificationFields[account].every((field) => field.optional || Boolean(values[field.name]?.trim()))
    && verificationDocuments[account].every((document) => Boolean(documents[document.name]));
}
