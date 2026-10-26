import DoctorsSection from "@/features/home/components/DoctorsSection";
import FeaturedServicesSection from "@/features/home/components/FeaturedServicesSection";
import HeroBanner from "@/features/home/components/HeroBanner";
import HomeSwitch from "@/features/home/components/HomeSwitch";
import NewsSection from "@/features/home/components/NewsSection";
import SpecialtiesSection from "@/features/home/components/SpecialtiesSection";
import VirtualTourBanner from "@/features/home/components/VirtualTourBanner";
import AppDownloadSection from "@/features/home/components/AppDownloadSection";

export default function HomePage() {
  return (
    <HomeSwitch
      guest={
        <>
          <HeroBanner />
          <SpecialtiesSection />
          <FeaturedServicesSection />
          <DoctorsSection />
          <div className="bg-white pt-16">
            <div className="mx-auto max-w-7xl px-4">
              <VirtualTourBanner />
            </div>
          </div>
          <NewsSection />
          <AppDownloadSection />
        </>
      }
    />
  );
}