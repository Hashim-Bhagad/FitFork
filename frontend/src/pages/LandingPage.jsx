import { motion } from "framer-motion";
import { Leaf, Search, Activity, Sparkles, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

import heroImg from "../assets/hero-metabolic.png";
import featDiscovery from "../assets/feat-discovery.jpg";
import foodMoody from "../assets/food-moody.png";
import featLogic from "../assets/feat-logic.jpg";

import AnimatedCard from "../components/AnimatedCard";
import GlowBackground from "../components/GlowBackground";

export default function LandingPage() {
  const navigate = useNavigate();
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 40 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <div className="landing-wrap relative min-h-screen bg-[--bg]">
      <GlowBackground />
      
      {/* Header */}
      <nav className="flex justify-between items-center p-8 px-16 relative z-10">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Leaf size={28} className="text-[--brand]" />
          <span>FitFork</span>
        </div>
        <div className="flex items-center gap-8 text-sm font-medium text-[--muted]">
          <span className="hover:text-[--text] cursor-pointer transition-colors">Vision</span>
          <span className="hover:text-[--text] cursor-pointer transition-colors">Science</span>
          <button className="btn btn-outline" onClick={() => navigate("/login")}>Sign In</button>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 max-w-5xl mx-auto relative z-10"
      >
        <motion.div variants={item} className="page-eyebrow flex items-center gap-2">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={14} />
          </motion.div>
          AI-Driven Metabolic Intelligence
        </motion.div>
        
        <motion.h1 variants={item} className="page-title leading-tight">
          Culinary Intelligence, <br /><em>Harmonized</em> with Your Biology
        </motion.h1>
        
        <motion.p variants={item} className="page-sub mx-auto">
          FitFork uses advanced RAG-engine semantic retrieval to align thousands of professional recipes 
          with your unique metabolic profile. Precision meal planning, reimagined.
        </motion.p>
        
        <motion.div variants={item} className="flex gap-4 mt-4">
          <button className="btn btn-primary px-10 py-4 text-lg" onClick={() => navigate("/login")}>
            Get Started
            <ChevronRight size={20} />
          </button>
          <button className="btn btn-outline px-10 py-4 text-lg">Explore Science</button>
        </motion.div>

        <motion.div 
          variants={item} 
          className="mt-20 w-full glass-premium rounded-3xl overflow-hidden shadow-2xl"
          style={{ height: '500px' }}
        >
          <img src={heroImg} alt="Botanical Culinary" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[--bg] opacity-40 pointer-events-none" />
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <section className="px-16 py-32 bg-gradient-to-b from-transparent to-[--bg2] relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <AnimatedCard delay={0.1} className="feat-card glass-premium p-10 flex flex-col gap-6">
            <div className="h-48 rounded-xl overflow-hidden border border-[--border]">
              <img src={featDiscovery} alt="Discovery" className="w-full h-full object-cover" />
            </div>
            <Search size={32} className="text-[--brand]" />
            <h3 className="text-2xl">Semantic Discovery</h3>
            <p className="text-[--muted]">Our AI understands flavor profiles and textures, not just keywords.</p>
          </AnimatedCard>
          
          <AnimatedCard delay={0.2} className="feat-card glass-premium p-10 flex flex-col gap-6">
            <div className="h-48 rounded-xl overflow-hidden border border-[--border]">
              <img src={foodMoody} alt="Macros" className="w-full h-full object-cover" />
            </div>
            <Activity size={32} className="text-[--brand]" />
            <h3 className="text-2xl">Auto-Balanced Plans</h3>
            <p className="text-[--muted]">Every day is macro-optimized automatically based on your TDEE and BMR.</p>
          </AnimatedCard>
          
          <AnimatedCard delay={0.3} className="feat-card glass-premium p-10 flex flex-col gap-6">
            <div className="h-48 rounded-xl overflow-hidden border border-[--border]">
              <img src={featLogic} alt="Logic" className="w-full h-full object-cover" />
            </div>
            <Leaf size={32} className="text-[--brand]" />
            <h3 className="text-2xl">Metabolic Logic</h3>
            <p className="text-[--muted]">Context-aware insights that adapt to your progress and biological feedback.</p>
          </AnimatedCard>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="px-16 py-32 bg-[--bg2] relative z-10">
        <AnimatedCard className="max-w-4xl mx-auto glass-premium p-16">
          <h2 className="text-4xl mb-12 text-center">Why FitFork?</h2>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 pb-6 border-b-2 border-[--border] text-xs uppercase tracking-widest text-[--muted] font-bold">
              <div>Feature</div>
              <div>Generic Trackers</div>
              <div className="text-[--brand]">FitFork AI</div>
            </div>
            {[
              { label: "Recipe Retrieval", old: "Keyword Search", new: "Semantic RAG Engine" },
              { label: "Metabolic Alignment", old: "Fixed Targets", new: "Biological Harmonics" },
              { label: "Meal Context", old: "Isolated Items", new: "Holistic Daily Balance" },
              { label: "Data Privacy", old: "Cloud Siphoning", new: "Local-First AI" },
            ].map((r, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="grid grid-cols-3 py-4 border-b border-[--border] items-center text-sm"
              >
                <div className="font-semibold">{r.label}</div>
                <div className="text-[--muted]">{r.old}</div>
                <div className="text-[--brand] flex items-center gap-2 font-bold">
                  <Check size={16} /> {r.new}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedCard>
      </section>

      <footer className="p-16 text-center text-sm text-[--muted] border-t border-[--border] relative z-10">
        <p>© 2026 FitFork. Forging the future of metabolic culinary intelligence.</p>
      </footer>
    </div>
  );
}
