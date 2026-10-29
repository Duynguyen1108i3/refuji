import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hero } from './components/Hero';
import { LiquidNavbar } from './components/LiquidNavbar';
import { AvailabilityExplorer } from './components/AvailabilityExplorer';
import { FeaturedCamera } from './components/FeaturedCamera';
import { FeaturedLens } from './components/FeaturedLens';
import { BookingModal } from './components/BookingModal';
import { AccountModal, MembershipTierType } from './components/AccountModal';
import { ScrollFadeSection } from './components/ScrollFadeSection';
import { Footer } from './components/Footer';
import { CAMERAS, LENSES } from './data/mockData';
import { CameraModel, LensModel } from './types';

export const App: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [selectedItem, setSelectedItem] = useState<CameraModel | LensModel | null>(null);
  const [searchNotification, setSearchNotification] = useState<string | null>(null);
  const [membershipTier, setMembershipTier] = useState<MembershipTierType>('GOLD');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const isManualScrolling = useRef(false);
  const scrollTimeout = useRef<number | null>(null);

  // Scroll Trigger & Active Section Detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Toggle navbar visibility past 120px
      setIsScrolled(scrollY > 120);

      // If user clicked/dragged a tab to scroll, don't jitter during smooth scroll animation
      if (isManualScrolling.current) return;

      // Determine active section based on scroll offset
      const sections = ['policies', 'lenses', 'cameras', 'explore', 'hero'];
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 260) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    isManualScrolling.current = true;

    if (scrollTimeout.current) {
      window.clearTimeout(scrollTimeout.current);
    }

    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const elem = document.getElementById(id);
      if (elem) {
        const yOffset = -90; // offset for floating top navbar
        const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }

    // Re-enable scroll spy after smooth scroll completes
    scrollTimeout.current = window.setTimeout(() => {
      isManualScrolling.current = false;
    }, 900);
  };

  const handleSearch = (params: { category: string; mount: string; series: string; dates: string }) => {
    setSearchNotification(
      `Đã cập nhật bộ lọc: ${params.category} • ${params.mount} • ${params.dates}`
    );
    setTimeout(() => setSearchNotification(null), 4000);
  };

  return (
    <div className="relative min-h-screen bg-[#07070a] text-white overflow-x-hidden selection:bg-white/20">
      
      {/* Authentic RytoxGroup Ambient Drifting Lights (Organic Floating Fluid Behind Glass) */}
      <div 
        className="fixed top-64 -left-36 w-[520px] h-[520px] rounded-full pointer-events-none z-0 ambient-glass-drift-1 opacity-70 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(22, 101, 52, 0.28) 0%, rgba(20, 83, 45, 0.12) 45%, rgba(0, 0, 0, 0) 70%)'
        }}
      />
      <div 
        className="fixed top-96 -right-36 w-[560px] h-[560px] rounded-full pointer-events-none z-0 ambient-glass-drift-2 opacity-65 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.22) 0%, rgba(180, 83, 9, 0.08) 45%, rgba(0, 0, 0, 0) 70%)'
        }}
      />
      <div 
        className="fixed top-1/2 left-1/2 w-[650px] h-[650px] rounded-full pointer-events-none z-0 ambient-glass-drift-3 opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(30, 58, 138, 0.05) 50%, rgba(0, 0, 0, 0) 75%)'
        }}
      />

      {/* Floating Liquid Glass Taskbar */}
      <LiquidNavbar 
        isVisible={isScrolled} 
        activeSection={activeSection}
        onOpenAuth={() => setIsAccountModalOpen(true)}
        onNavigate={handleScrollTo}
      />

      {/* 1. Màn hình đầu tiên (Hero 100vh) - Mờ dần khi cuộn xuống sắp hết trang */}
      <div id="hero">
        <Hero onExploreClick={() => handleScrollTo('explore')} />
      </div>

      {/* Main Scrolled Section */}
      <main className="relative z-10 pt-4">
        
        {/* Search Feedback Toast with Rytox Spring Physics */}
        <AnimatePresence>
          {searchNotification && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-20 md:bottom-6 right-6 z-50 liquid-glass border border-emerald-500/40 px-5 py-3 rounded-xl text-xs sm:text-sm text-emerald-400 shadow-2xl flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 radar-pulse-green" />
              <span>{searchNotification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Phân hệ Tra cứu lịch & Availability thời gian thực chuẩn v1.1 */}
        <ScrollFadeSection id="explore">
          <AvailabilityExplorer 
            onSearch={handleSearch}
            onSelectItem={(item) => setSelectedItem(item as any)}
            membershipTier={membershipTier}
          />
        </ScrollFadeSection>

        {/* 3. Khu vực Thân máy Hot Trend (Scroll Fade Transition) */}
        <ScrollFadeSection>
          <FeaturedCamera 
            cameras={CAMERAS} 
            onSelectCamera={(cam) => setSelectedItem(cam)}
          />
        </ScrollFadeSection>

        {/* 4. Khu vực Ống kính Fujinon được săn đón (Scroll Fade Transition) */}
        <ScrollFadeSection>
          <FeaturedLens 
            lenses={LENSES} 
            onSelectLens={(lens) => setSelectedItem(lens)}
          />
        </ScrollFadeSection>

      </main>

      {/* Booking / Details Modal (15-min Reservation Hold with AnimatePresence) */}
      <AnimatePresence>
        {selectedItem && (
          <BookingModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            membershipTier={membershipTier}
          />
        )}
      </AnimatePresence>

      {/* Account Info & Membership Tier / Voucher Modal */}
      <AnimatePresence>
        {isAccountModalOpen && (
          <AccountModal
            isOpen={isAccountModalOpen}
            onClose={() => setIsAccountModalOpen(false)}
            currentTier={membershipTier}
            onChangeTier={(tier) => {
              setMembershipTier(tier);
              setSearchNotification(`Đã cập nhật tài khoản: ${tier === 'PLATINUM' ? 'Bạch Kim (-15% cọc)' : tier === 'GOLD' ? 'Hạng Vàng (-10% cọc)' : tier === 'SILVER' ? 'Hạng Bạc (-5% cọc)' : 'Hạng Đồng'}`);
              setTimeout(() => setSearchNotification(null), 4000);
            }}
          />
        )}
      </AnimatePresence>

      {/* Footer / Chính sách (Scroll Fade Transition) */}
      <ScrollFadeSection>
        <Footer />
      </ScrollFadeSection>

    </div>
  );
};

export default App;
