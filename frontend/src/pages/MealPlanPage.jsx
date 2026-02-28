import { useState, useEffect } from "react";
import { api } from "../api";
import { Calendar as CalendarIcon, Zap, Info, AlertCircle, ChefHat, Sparkles, CheckCircle2, ExternalLink, Unlink } from "lucide-react";
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

  // Google Calendar state
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });

  const hasProfile = profile?.height_cm;

  // Handle OAuth callback query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleStatus = params.get("google");
    if (googleStatus === "connected") {
      setGoogleConnected(true);
      toast({ title: "Google Calendar Connected!", description: "You can now sync your meal plans.", variant: "default" });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (googleStatus === "error") {
      toast({ title: "Connection Failed", description: params.get("detail") || "Could not connect to Google.", variant: "destructive" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Check Google Calendar connection status
  useEffect(() => {
    api.getCalendarStatus()
      .then(res => setGoogleConnected(res.connected))
      .catch(() => setGoogleConnected(false));
  }, []);

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

  const handleConnectGoogle = async () => {
    try {
      const res = await api.getGoogleAuthUrl();
      window.location.href = res.auth_url;
    } catch (err) {
      toast({ title: "Error", description: "Could not start Google connection.", variant: "destructive" });
    }
  };

  const handleSyncToCalendar = async () => {
    if (!startDate) {
      toast({ title: "Select a Date", description: "Choose a start date for your plan.", variant: "destructive" });
      return;
    }
    setSyncing(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
      const result = await api.syncToCalendar(startDate, tz);
      toast({
        title: "Synced to Google Calendar!",
        description: result.message,
        variant: "default",
      });
    } catch (err) {
      toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.disconnectCalendar();
      setGoogleConnected(false);
      toast({ title: "Disconnected", description: "Google Calendar has been unlinked.", variant: "default" });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
        style={{ marginBottom: 24, display:"flex", gap:18, alignItems:"center", flexWrap:"wrap", padding: '12px 24px' }}
      >
        <div className="fg" style={{ minWidth: 110 }}>
          <label className="text-[10px] uppercase tracking-widest text-muted mb-1 block">Timeline</label>
          <select value={days} onChange={e => setDays(+e.target.value)} className="bg-transparent border-none text-cream focus:ring-0 cursor-pointer">
            {[1,3,5,7,14].map(d => <option key={d} value={d} className="bg-bg">{d} day{d > 1 ? "s" : ""}</option>)}
          </select>
        </div>
        <div className="fg" style={{ minWidth: 140 }}>
          <label className="text-[10px] uppercase tracking-widest text-muted mb-1 block">Frequency</label>
          <select value={mpd} onChange={e => setMpd(+e.target.value)} className="bg-transparent border-none text-cream focus:ring-0 cursor-pointer">
            {[1,2,3,4].map(m => (
              <option key={m} value={m} className="bg-bg">{m} meal{m > 1 ? "s" : ""}{m === 4 ? " + snack" : ""}</option>
            ))}
          </select>
        </div>
        <div className="flex-1" />
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "var(--shadow-glow)" }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary"
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
              <Sparkles size={14} /> Optimize Plan
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
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card glass-premium mb-6 border-brand/10 relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-3 opacity-10"><ChefHat size={40} /></div>
               <div className="card-title flex items-center gap-2 mb-2 text-brand/80">
                 <Sparkles size={14} className="text-peach" /> Chef's Note
               </div>
               <p className="text-sm leading-relaxed text-cream/90 italic">
                 "{plan_overview}"
               </p>
            </motion.div>
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
                      <span className="day-kcal mono text-brand">≈ {Math.round(dayKcal)} kcal</span>
                    )}
                  </div>
                  <div className="meals-strip">
                    {dayPlan.meals.map((meal, mi) => (
                      <motion.div 
                        key={mi} 
                        whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.02)' }}
                        className="meal-slot border-l-2 border-brand/20 hover:border-brand transition-colors"
                      >
                        <div className="ms-type text-[10px] uppercase tracking-wider text-muted mb-1 flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-brand" /> {meal.meal_type}
                        </div>
                        {meal.recipe_title ? (
                          <>
                            <div className="ms-title font-semibold text-cream group-hover:text-brand">{meal.recipe_title}</div>
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

          {/* ── Google Calendar Sync ── */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card glass-premium"
            style={{ marginTop: 28 }}
          >
            <div className="card-title flex items-center gap-2" style={{ marginBottom: 12 }}>
              <CalendarIcon size={16} className="text-brand" /> Google Calendar
            </div>

            {!googleConnected ? (
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-sm text-muted flex-1" style={{ minWidth: 200 }}>
                  Connect your Google Calendar to automatically add your meals as events.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn btn-primary flex items-center gap-2"
                  onClick={handleConnectGoogle}
                  style={{ minWidth: 200 }}
                >
                  <ExternalLink size={14} /> Connect Google Calendar
                </motion.button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={14} className="text-brand" />
                  <span className="text-sm text-brand font-medium">Connected</span>
                  <button 
                    className="text-[10px] text-muted hover:text-coral transition-colors ml-auto flex items-center gap-1 cursor-pointer"
                    onClick={handleDisconnect}
                  >
                    <Unlink size={10} /> Disconnect
                  </button>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="fg">
                    <label className="text-[10px] uppercase tracking-widest text-muted mb-1 block">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)}
                      className="bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-cream text-sm focus:outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                  <div className="flex-1" />
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: "var(--shadow-glow)" }}
                    whileTap={{ scale: 0.97 }}
                    className="btn btn-primary flex items-center gap-2"
                    onClick={handleSyncToCalendar}
                    disabled={syncing}
                    style={{ minWidth: 220 }}
                  >
                    {syncing ? (
                      <><Zap size={14} className="animate-pulse" /> Syncing…</>
                    ) : (
                      <><CalendarIcon size={14} /> Sync to Google Calendar</>
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
