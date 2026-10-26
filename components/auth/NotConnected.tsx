import Button from "@/components/ui/Button";

// Shown on data pages until the Supabase keys are added to .env.local.
export default function NotConnected() {
  return (
    <div className="container-page py-20">
      <div className="card mx-auto max-w-xl p-8 text-center">
        <div className="eyebrow">Setup needed</div>
        <h1 className="mt-3 text-3xl font-extrabold">Connect Supabase to continue</h1>
        <p className="mt-3 text-muted">
          This page reads live data. Copy <code className="rounded bg-mist px-1.5 py-0.5">.env.example</code> to{" "}
          <code className="rounded bg-mist px-1.5 py-0.5">.env.local</code>, add your Supabase project URL and anon key, and restart the dev server.
        </p>
        <Button href="/" variant="secondary" className="mt-6">
          Back to homepage
        </Button>
      </div>
    </div>
  );
}
