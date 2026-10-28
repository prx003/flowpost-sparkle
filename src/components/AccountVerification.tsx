import { Fragment, useState } from "react";
import { BadgeCheck, LockKeyhole, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { verificationFields, verificationDocuments } from "@/lib/verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AccountVerification() {
  const { profile } = useAuth();
  if (!profile) return <p role="status" className="text-sm text-muted-foreground">Loading account details…</p>;
  const account = profile.account_type === "business" ? "business" : "personal";
  return <VerificationForm key={`${profile.id}:${account}`} account={account} />;
}

function VerificationForm({ account }: { account: "business" | "personal" }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<Record<string, File | undefined>>({});
  const business = account === "business";

  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <BadgeCheck className="h-7 w-7 shrink-0 text-primary" />
        <div>
          <h2 className="font-bold">{business ? "Business verification" : "Personal KYC verification"}</h2>
          <p className="text-sm text-muted-foreground">{business ? "Business, shop or firm details and representative KYC" : "Identity and residential details"}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {verificationFields[account].map((field) => (
          <Fragment key={field.name}>
          {field.section && <h3 className="border-b border-border pb-2 font-semibold sm:col-span-2">{field.section}</h3>}
          <div className={`min-w-0 space-y-2 ${field.multiline ? "sm:col-span-2" : ""}`}>
            <Label htmlFor={`verify-${field.name}`}>{field.label}</Label>
            {field.options ? (
              <select id={`verify-${field.name}`} required={!field.optional} value={values[field.name] ?? ""} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="" disabled>Select…</option>
                {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : field.multiline ? (
              <Textarea id={`verify-${field.name}`} required={!field.optional} rows={3} maxLength={500} value={values[field.name] ?? ""} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} />
            ) : (
              <Input id={`verify-${field.name}`} required={!field.optional} type={field.type ?? "text"} maxLength={150} value={values[field.name] ?? ""} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} />
            )}
          </div>
          </Fragment>
        ))}
      </div>
      <section className="space-y-4 border-t border-border pt-4">
        <h3 className="font-semibold">Supporting documents</h3>
        {verificationDocuments[account].map((document) => (
          <div key={document.name} className="min-w-0 space-y-2">
            <Label htmlFor={`verify-${document.name}`} className="flex items-center gap-2 leading-snug"><Upload className="h-4 w-4 shrink-0 text-muted-foreground" />{document.label}</Label>
            <Input id={`verify-${document.name}`} required type="file" accept="image/jpeg,image/png,application/pdf" className="h-auto min-h-10 py-2" onChange={(event) => setDocuments({ ...documents, [document.name]: event.target.files?.[0] })} />
            {documents[document.name] && <p className="break-all text-xs text-muted-foreground">{documents[document.name]?.name} · Selected, not uploaded</p>}
          </div>
        ))}
        <p className="text-xs text-muted-foreground">JPG, PNG or PDF</p>
      </section>
      <div role="status" className="flex items-start gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Verification submission is not available yet. Your details and selected documents are not saved or uploaded.</p>
      </div>
      <Button type="submit" disabled className="w-full sm:w-auto">Submit verification</Button>
    </form>
  );
}