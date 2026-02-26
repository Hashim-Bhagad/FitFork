import { useState, useEffect } from "react";
import { api } from "../api";
import { Calendar as CalendarIcon, Zap, Info, AlertCircle, ChefHat, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MealPlanPage({ profile }) {
  const [plan,      setPlan]      = useState(null);
  const [nutrition, setNutrition] = useState(null);
  const [plan_overview, setPlanOverview] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error,     setError]     = useState("");
  const [days,      setDays]      = useState(7);
  const [mpd,       setMpd]       = useState(3);
  const { toast } = useToast();

  const hasProfile = profile?.height_cm;

  // Fetch latest plan on mount
  useEffect(() => {
    const fetchLatest = async () => {
      setInitLoading(true);
      try {
        const res = await api.getLatestMealPlan();
        if (res) {
          setPlan(res.days);
          setNutrition(res.nutrition_targets);
          setPlanOverview(res.overview || "");
        }
      } catch (err) {
        console.error("Failed to fetch latest plan:", err);
        // Only set error message if it's not a 404/Null response
        if (err.message && !err.message.includes("404")) {
          setError("Could not retrieve your saved meal plan.");
        }
      } finally {
        setInitLoading(false);
      }
    };

    fetchLatest();
  }, []);

  const generate = async () => {
    if (!hasProfile) return;
    setError(""); setLoading(true); setPlan(null);
    try {
      const res = await api.getMealPlan(profile, days, mpd);
      if (!res || !res.days) {
        throw new Error("Invalid response format from server.");
      }
      setPlan(res.days);
      setNutrition(res.nutrition_targets);
      setPlanOverview(res.overview || "");
      
      toast({
        title: "Plan Generated!",
        description: `Your custom ${days}-day plan is ready.`,
        variant: "default",
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: "Generation Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page"
    >
      <div className="page-eyebrow">AI Planner</div>
      <motion.h2 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="page-title"
      >
        Your <em>meal plan</em>
      </motion.h2>
      <p className="page-sub">
        Generate a personalised plan matched to your calorie and macro targets.
      </p>

      {/* Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card glass-premium" 
        style={{ marginBottom: 24, display:"flex", gap:18, alignItems:"flex-end", flexWrap:"wrap" }}
      >
        <div className="fg" style={{ minWidth: 110 }}>
          <label>Days</label>
          <select value={days} onChange={e => setDays(+e.target.value)}>
            {[1,3,5,7,14].map(d => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
          </select>
        </div>
        <div className="fg" style={{ minWidth: 140 }}>
          <label>Meals / day</label>
          <select value={mpd} onChange={e => setMpd(+e.target.value)}>
            {[1,2,3,4].map(m => (
              <option key={m} value={m}>{m} meal{m > 1 ? "s" : ""}{m === 4 ? " + snack" : ""}</option>
            ))}
          </select>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "var(--glow-amber)" }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-amber"
          onClick={generate}
          disabled={loading || !hasProfile}
          style={{ minWidth: 160 }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Zap size={14} className="animate-pulse" /> Generating…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles size={14} /> Generate Plan
            </span>
          )}
        </motion.button>
      </motion.div>

      {!hasProfile && (
        <div className="alert alert-warn glass-premium border-amber/30"><AlertCircle size={16} /> Complete your profile first.</div>
      )}
      {error && <div className="alert alert-warn glass-premium border-coral/30"><AlertCircle size={16} /> {error}</div>}

      <AnimatePresence mode="wait">
        {initLoading ? (
          <motion.div 
            key="init"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign:"center", padding:"80px 0" }}
          >
            <div className="spinner" style={{ borderColor: "var(--olive) transparent var(--olive) transparent" }} />
            <p style={{ color:"var(--muted)", fontFamily:"'DM Mono', monospace", fontSize:"0.75rem", marginTop:12 }}>
              SYNCING YOUR SAVED PLANS…
            </p>
          </motion.div>
        ) : loading && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign:"center", padding:"48px 0" }}
          >
            <div className="spinner" style={{ borderColor: "var(--amber) transparent var(--amber) transparent" }} />
            <p style={{ color:"var(--muted)", fontFamily:"'DM Mono', monospace", fontSize:"0.75rem", marginTop:8, letterSpacing:"0.06em" }}>
              CRAFTING YOUR BIOLOGY-ALIGNED PLAN…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && plan && Array.isArray(plan) && plan.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* AI Overview */}
          {plan_overview && (
            <div className="card glass-premium mb-6 border-sage/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-10"><ChefHat size={40} /></div>
               <div className="card-title flex items-center gap-2 mb-2 text-sage/80">
                 <Sparkles size={14} className="text-amber" /> Chef's Note
               </div>
               <p className="text-sm leading-relaxed text-cream/90 italic">
                 "{plan_overview}"
               </p>
            </div>
          )}

          {/* Nutrition strip */}
          {nutrition && (
            <div className="card glass-premium" style={{ marginBottom: 22 }}>
              <div className="card-header-flex">
                <div className="card-title">⟡ Daily Targets</div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="muted-icon cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="glass-premium border-none text-cream text-[10px] p-2">
                      <p>Aggregated daily targets based on your metabolic resting rate and goal.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="macro-strip stagger">
                <div className="macro-pill pill-kcal glass-premium border-none">
                  <span className="macro-val">{Math.round(nutrition.target_calories)}</span>
                  <span className="macro-lbl">kcal</span>
                </div>
                <div className="macro-pill pill-prot glass-premium border-none">
                  <span className="macro-val">{nutrition.protein_g}<span style={{fontSize:"0.8rem"}}>g</span></span>
                  <span className="macro-lbl">protein</span>
                </div>
                <div className="macro-pill pill-carb glass-premium border-none">
                  <span className="macro-val">{nutrition.carbs_g}<span style={{fontSize:"0.8rem"}}>g</span></span>
                  <span className="macro-lbl">carbs</span>
                </div>
                <div className="macro-pill pill-fat glass-premium border-none">
                  <span className="macro-val">{nutrition.fat_g}<span style={{fontSize:"0.8rem"}}>g</span></span>
                  <span className="macro-lbl">fat</span>
                </div>
              </div>
            </div>
          )}

          {/* Day rows */}
          <div className="mp-grid">
            {plan.map((dayPlan, di) => {
              const dayKcal = dayPlan.total_calories || 0;
              return (
                <motion.div 
                  key={dayPlan.day_number} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: di * 0.05 }}
                  className="day-row glass-premium"
                >
                  <div className="day-header">
                    <span className="day-name">Day {dayPlan.day_number}</span>
                    {dayKcal > 0 && (
                      <span className="day-kcal mono text-amber">≈ {Math.round(dayKcal)} kcal</span>
                    )}
                  </div>
                  <div className="meals-strip">
                    {dayPlan.meals.map((meal, mi) => (
                      <motion.div 
                        key={mi} 
                        whileHover={{ x: 5 }}
                        className="meal-slot border-l-2 border-sage/20 hover:border-amber/50 transition-colors"
                      >
                        <div className="ms-type text-[10px] uppercase tracking-wider text-muted mb-1 flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-sage" /> {meal.meal_type}
                        </div>
                        {meal.recipe_title ? (
                          <>
                            <div className="ms-title font-semibold text-cream group-hover:text-amber">{meal.recipe_title}</div>
                            <div className="ms-cal mono text-[10px] mt-1 opacity-70">
                              {meal.calories ? `${Math.round(meal.calories)} kcal` : ""}
                              {meal.protein_g ? ` · ${meal.protein_g}g prot` : ""}
                            </div>
                          </>
                        ) : (
                          <div className="ms-title" style={{ opacity:0.35, fontStyle:"italic" }}>Recipe pending…</div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
