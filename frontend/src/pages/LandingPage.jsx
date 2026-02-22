import { motion } from "framer-motion";
import { Leaf, Search, Activity, Sparkles, ChevronRight, Check } from "lucide-react";

import heroImg from "../assets/hero-culinary.jpg";
import featDiscovery from "../assets/feat-discovery.jpg";
import featBalance from "../assets/feat-balance.jpg";
import featLogic from "../assets/feat-logic.jpg";

import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="landing-wrap">
      {/* Background Mesh */}
      <div className="landing-mesh" />
      
      {/* Header */}
      <nav className="landing-nav">
        <div className="auth-logo">
          <Leaf size={24} className="accent-text" />
          <span>FitFork</span>
        </div>
        <div className="nav-links">
          <span>Vision</span>
          <span>Science</span>
          <button className="btn-text" onClick={() => navigate("/login")}>Sign In</button>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        variants={container}
        initial="hidden"
        animate="show"
        className="hero"
      >
        <motion.div variants={item} className="pill-eyebrow">
          <motion.div initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
            <Sparkles size={12} />
          </motion.div>
          <span>AI-Driven Metabolic Intelligence</span>
        </motion.div>
        
        <motion.h1 variants={item} className="hero-title">
          Culinary Intelligence, <em>Harmonized</em> with Your Biology
        </motion.h1>
        
        <motion.p variants={item} className="hero-sub">
          FitFork uses advanced RAG-engine semantic retrieval to align thousands of professional recipes 
          with your unique metabolic profile. Precision meal planning, reimagined for the modern kitchen.
        </motion.p>
        
        <motion.div variants={item} className="hero-btns">
          <button className="btn btn-amber btn-lg" onClick={() => navigate("/login")}>
            Get Started
            <ChevronRight size={18} />
          </button>
          <button className="btn btn-outline btn-lg">Explore Science</button>
        </motion.div>

        <motion.div variants={item} className="hero-visual glass-premium">
          <img src={heroImg} alt="Botanical Culinary" />
          <div className="glass-overlay" />
        </motion.div>
      </motion.section>

      {/* Features */}
      <motion.section 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="features-section"
      >
        <div className="features-grid">
          <motion.div variants={item} whileHover={{ y: -10 }} className="feat-card glass-premium">
            <div className="feat-img">
              <img src={featDiscovery} alt="Semantic Discovery" />
            </div>
            <Search size={32} className="accent-text" />
            <h3>Semantic Discovery</h3>
            <p>Our AI understands flavor profiles and textures, not just keywords.</p>
          </motion.div>
          
          <motion.div variants={item} whileHover={{ y: -10 }} className="feat-card glass-premium">
            <div className="feat-img">
              <img src={featBalance} alt="Auto-Balanced" />
            </div>
            <Activity size={32} className="accent-text" />
            <h3>Auto-Balanced Plans</h3>
            <p>Every day is macro-optimized automatically based on your TDEE and BMR.</p>
          </motion.div>
          
          <motion.div variants={item} whileHover={{ y: -10 }} className="feat-card glass-premium">
            <div className="feat-img">
              <img src={featLogic} alt="Metabolic Logic" />
            </div>
            <Leaf size={32} className="accent-text" />
            <h3>Metabolic Logic</h3>
            <p>Context-aware insights that adapt to your progress and biological feedback.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Comparison */}
      <section className="comp-section">
        <div className="comp-card glass">
          <h2 className="serif">Why FitFork?</h2>
          <div className="comp-table">
            <div className="comp-row head">
              <div className="comp-label">Feature</div>
              <div className="comp-val">Generic Trackers</div>
              <div className="comp-val highlight">FitFork AI</div>
            </div>
            {[
              { label: "Recipe Retrieval", old: "Keyword Search", new: "Semantic RAG Engine" },
              { label: "Metabolic Alignment", old: "Fixed Targets", new: "Dynamic Biological Harmonics" },
              { label: "Meal Context", old: "Isolated Items", new: "Holistic Daily Balance" },
              { label: "Data Privacy", old: "Cloud Siphoning", new: "Local-First Calculations" },
            ].map((r, i) => (
              <div key={i} className="comp-row">
                <div className="comp-label">{r.label}</div>
                <div className="comp-val">{r.old}</div>
                <div className="comp-val highlight"><Check size={14} /> {r.new}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 FitFork. Forging the future of metabolic culinary intelligence.</p>
      </footer>
    </div>
  );
}
