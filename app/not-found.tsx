import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EmptyState from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="container-page flex flex-1 items-center justify-center py-20">
        <EmptyState title="We couldn’t find that page" description="It may have moved, or the link might be mistyped." actionHref="/" actionLabel="Back to homepage" />
      </main>
      <Footer />
    </>
  );
}
