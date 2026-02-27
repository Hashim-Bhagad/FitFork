import React, { useMemo } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, ReferenceLine, Label
} from "recharts";
import { Activity, Zap, Target, Info, Flame, TrendingUp, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COLORS = {
  protein: "#fb7185", // coral
  carbs: "#80ed99",   // mint
  fat: "#38a3a5",     // accent-dark
  bmr: "#222832",     // surface3
  activity: "#ffb5a7", // peach
  target: "#f8f9fa",  // cream
};

export default function AnalyticsPage({ profile, nutritionData, onNavigate }) {
  const macroData = useMemo(() => {
    if (!nutritionData) return [];
    return [
      { name: "Protein", value: nutritionData.protein_g * 4, grams: nutritionData.protein_g, color: COLORS.protein },
      { name: "Carbs", value: nutritionData.carbs_g * 4, grams: nutritionData.carbs_g, color: COLORS.carbs },
      { name: "Fat", value: nutritionData.fat_g * 9, grams: nutritionData.fat_g, color: COLORS.fat },
    ];
  }, [nutritionData]);

  const energyData = useMemo(() => {
    if (!nutritionData) return [];
    return [
      { 
        name: "Metabolic Breakdown", 
        bmr: nutritionData.bmr, 
        activity: Math.max(0, nutritionData.tdee - nutritionData.bmr),
        target: nutritionData.target_calories 
      }
    ];
  }, [nutritionData]);

  if (!profile || !nutritionData) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: 100 }}>
        <div className="page-eyebrow">Insights Unavailable</div>
        <h2 className="page-title">Setup your <em>profile</em> first</h2>
        <p className="page-sub">We need your metrics to calculate your metabolic targets and visualization insights.</p>
        <button className="btn btn-amber" onClick={() => onNavigate("profile")}>
          Go to Profile
        </button>
      </div>
    );
  }

  const calorieDelta = nutritionData.target_calories - nutritionData.tdee;
  const deltaLabel = calorieDelta > 0 ? "Surplus" : "Deficit";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page"
    >
      <div className="page-eyebrow">Metabolic Intelligence</div>
      <motion.h2 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="page-title"
      >
        Personal <em>Insights</em>
      </motion.h2>
      <p className="page-sub">
        Based on your {profile.gender} biology and {profile.goal.replace(/_/g, " ")} objective.
      </p>

      <div className="analytics-grid">
        <div className="metrics-row stagger">
          <motion.div whileHover={{ y: -5 }} className="metric-card glass-premium">
            <div className="mc-icon" style={{ backgroundColor: "rgba(197, 216, 157, 0.1)" }}><Flame size={18} color="var(--accent-light)" /></div>
            <div className="mc-info">
              <span className="mc-label">Daily Target</span>
              <span className="mc-val mono">{Math.round(nutritionData.target_calories)} <small>kcal</small></span>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="metric-card glass-premium">
            <div className="mc-icon" style={{ backgroundColor: "var(--peach-glow)" }}><Activity size={18} color="var(--peach)" /></div>
            <div className="mc-info">
              <span className="mc-label">Maintenance (TDEE)</span>
              <span className="mc-val mono">{Math.round(nutritionData.tdee)} <small>kcal</small></span>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="metric-card glass-premium">
            <div className="mc-icon" style={{ backgroundColor: "rgba(251, 113, 133, 0.1)" }}><Target size={18} color="var(--coral)" /></div>
            <div className="mc-info">
              <span className="mc-label">Calorie {deltaLabel}</span>
              <span className="mc-val mono" style={{ color: calorieDelta > 0 ? "var(--accent-light)" : "var(--coral)" }}>
                {calorieDelta > 0 ? "+" : ""}{Math.round(calorieDelta)} <small>kcal</small>
              </span>
            </div>
          </motion.div>
        </div>

        <div className="charts-container">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card chart-card glass-premium"
          >
            <div className="card-header-flex">
              <div className="card-title">⟡ Macro Energy Distribution</div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={14} className="muted-icon cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="glass-premium border-none text-cream text-[10px] p-2">
                    <p>Percentage of total energy from each macronutrient.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="chart-wrapper" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip 
                    contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
                    itemStyle={{ color: "var(--cream)" }}
                  />
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <span className="dc-val mono">{Math.round(nutritionData.target_calories)}</span>
                <span className="dc-lbl">Total kcal</span>
              </div>
            </div>
            <div className="chart-legend">
              {macroData.map(m => (
                <div key={m.name} className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: m.color }} />
                  <span className="legend-name">{m.name}</span>
                  <span className="legend-val mono">{m.grams}g</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="card chart-card glass-premium"
          >
            <div className="card-header-flex">
              <div className="card-title">Energy Expenditure Logic</div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Zap size={14} className="muted-icon cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="glass-premium border-none text-cream text-[10px] p-2">
                    <p>Comparison of basal metabolic rate vs active burn.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="chart-wrapper" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={energyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide />
                  <RechartsTooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
                  />
                  <Bar dataKey="bmr" stackId="a" fill={COLORS.bmr} radius={[4, 0, 0, 4]} name="Basal Metabolic Rate" />
                  <Bar dataKey="activity" stackId="a" fill={COLORS.activity} radius={[0, 4, 4, 0]} name="Active Burn" />
                  <ReferenceLine x={nutritionData.target_calories} stroke="var(--accent-light)" strokeDasharray="3 3">
                     <Label value="Your Target" position="top" fill="var(--accent-light)" style={{ fontSize: 10, fontFamily: 'DM Mono' }} />
                  </ReferenceLine>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="exp-info">
              <p>Your body takes <strong>{nutritionData.bmr} kcal</strong> just to stay alive (BMR). With your activity level, you burn an additional <strong>{Math.round(nutritionData.tdee - nutritionData.bmr)} kcal</strong>.</p>
              <div className="goal-indicator">
                <span className="gi-text">Current Strategy:</span>
                <span className="gi-pill shadow-inner">{profile.goal.replace(/_/g, " ")}</span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="analytics-cta stagger"
        >
           <button className="cta-box glass-premium group" onClick={() => onNavigate("search")}>
              <div className="cta-icon"><TrendingUp size={24} className="group-hover:scale-110 transition-transform" /></div>
              <div className="cta-text">
                <h3 className="group-hover:text-brand transition-colors">Find Optimized Recipes</h3>
                <p>Browse meals that fit your {Math.round(nutritionData.target_calories / 3)} kcal meal target.</p>
              </div>
              <ChevronRight size={20} className="cta-arrow group-hover:translate-x-1 transition-transform" />
           </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
