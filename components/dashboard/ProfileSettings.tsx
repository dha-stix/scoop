"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field, { Alert, FormSection } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/components/auth/RequireAuth";
import PageHeader from "./PageHeader";
import { friendlyError, getCompany, updateCompany, updateUserProfile } from "@/lib/supabase-actions";
import { useAsync } from "@/lib/use-async";
import { COMPANY_SIZES } from "@/lib/constants";
import { safeHttpUrl } from "@/lib/format";
import type { Company } from "@/lib/types";

export default function ProfileSettings() {
  const profile = useProfile();
  const { refreshProfile } = useAuth();
  const { toast, showToast } = useToast();
  const [me, setMe] = useState({ name: profile.name, phone: profile.phone ?? "", location: profile.location ?? "", desiredRole: profile.desiredRole ?? "", jobTitle: profile.jobTitle ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isHr = profile.role === "hr";

  const company = useAsync(async () => (isHr ? getCompany(profile.companyId!) : null), [profile.companyId]);
  const [companyEdits, setCompanyEdits] = useState<Partial<Company>>({});
  const companyValue = { ...company.data, ...companyEdits } as Company;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (companyEdits.website && !safeHttpUrl(companyEdits.website)) return setError("The website must be a full link starting with https://");
    setSaving(true);
    setError("");
    try {
      await updateUserProfile(profile.id, isHr ? { name: me.name, jobTitle: me.jobTitle } : { name: me.name, phone: me.phone, location: me.location, desiredRole: me.desiredRole });
      if (isHr && Object.keys(companyEdits).length) await updateCompany(profile.companyId!, companyEdits);
      await refreshProfile();
      showToast("Profile saved");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  if (isHr && company.loading) return <PageLoader />;
  const setMeField = (k: keyof typeof me) => (e: { target: { value: string } }) => setMe((m) => ({ ...m, [k]: e.target.value }));
  const setCo = (k: keyof Company) => (e: { target: { value: string } }) => setCompanyEdits((c) => ({ ...c, [k]: e.target.value }));

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
      <PageHeader title={isHr ? "Company profile" : "Your profile"} subtitle={isHr ? "This is what candidates see on your job posts." : "Used to pre-fill your applications."} actions={<Button type="submit" loading={saving}>Save changes</Button>} />
      <div className="flex flex-col gap-5">
        {isHr && company.data && (
          <FormSection title="Company">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name" required value={companyValue.name ?? ""} onChange={setCo("name")} />
              <Field label="Website" type="url" value={companyValue.website ?? ""} onChange={setCo("website")} />
              <Field label="Company size" as="select" options={COMPANY_SIZES} value={companyValue.size ?? COMPANY_SIZES[0]} onChange={setCo("size")} />
              <Field label="About the company" as="textarea" className="sm:col-span-2" value={companyValue.description ?? ""} onChange={setCo("description")} placeholder="What you build, your mission and culture…" />
            </div>
          </FormSection>
        )}
        <FormSection title="You">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required value={me.name} onChange={setMeField("name")} />
            <Field label="Email" value={profile.email} disabled />
            {isHr ? (
              <Field label="Your role" value={me.jobTitle} onChange={setMeField("jobTitle")} />
            ) : (
              <>
                <Field label="Phone" type="tel" value={me.phone} onChange={setMeField("phone")} />
                <Field label="Location" value={me.location} onChange={setMeField("location")} />
                <Field label="Desired role" value={me.desiredRole} onChange={setMeField("desiredRole")} />
              </>
            )}
          </div>
        </FormSection>
        <Alert>{error}</Alert>
      </div>
      {toast}
    </form>
  );
}
