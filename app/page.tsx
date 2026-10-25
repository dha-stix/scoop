import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import JourneySection from "@/components/home/JourneySection";
import HowItWorks from "@/components/home/HowItWorks";
import Features from "@/components/home/Features";
import LiveInterview from "@/components/home/LiveInterview";
import ProgressShowcase from "@/components/home/ProgressShowcase";
import Faq from "@/components/home/Faq";
import CtaBanner from "@/components/home/CtaBanner";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <JourneySection />
        <HowItWorks />
        <Features />
        <LiveInterview />
        <ProgressShowcase />
        <Faq />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
