import { useState, useEffect } from "react";
import { api } from "../api";
import { User, Scale, Calendar, ChevronRight, Check, Trash2, Leaf, AlertCircle, Utensils, Zap, Activity as ActivityIcon, Target, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ACTIVITY_OPTIONS = [
  { value: "sedentary",          label: "Sedentary — desk life, no exercise" },
  { value: "lightly_active",     label: "Light — 1–3 sessions / week" },
  { value: "moderately_active",  label: "Moderate — 3–5 sessions / week" },
  { value: "very_active",        label: "Very active — 6–7 sessions / week" },
  { value: "extremely_active",   label: "Athlete — 2 × day training" },
];

const GOAL_OPTIONS = [
  { value: "weight_loss",          label: "Weight Loss",          icon: <ChevronRight size={14} /> },
  { value: "cutting",              label: "Cutting",              icon: <Zap size={14} /> },
  { value: "maintenance",          label: "Maintenance",          icon: <Target size={14} /> },
  { value: "bulking",              label: "Bulking",              icon: <ChevronRight size={14} style={{ transform: 'rotate(-90deg)' }} /> },
  { value: "athletic_performance", label: "Athletic Performance", icon: <ActivityIcon size={14} /> },
];

const DIETARY   = ["vegetarian","vegan","gluten-free","dairy-free","keto","paleo","halal","kosher","low-carb","low-fat"];
const ALLERGENS = ["peanuts","tree nuts","dairy","eggs","wheat","soy","fish","shellfish","sesame"];
const CUISINES  = ["Italian","Indian","Mexican","Chinese","Japanese","Thai","Mediterranean","American","French","Middle Eastern","Korean","Greek"];

function Section({ title, children, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      className="card glass-premium" 
      style={{ marginBottom: 18 }}
    >
      <div className="card-title">{title}</div>
      {children}
    </motion.div>
  );
}

export default function ProfilePage({ profile, onSave }) {
  const [form, setForm] = useState(profile || {
    height_cm: "", weight_kg: "", age: "", gender: "male",
    activity_level: "moderately_active", goal: "maintenance",
    dietary_restrictions: [], allergens_to_avoid: [], cuisine_preferences: [],
    region: "global",
  });

  // Sync form with profile prop changes (e.g., when loaded from backend)
  useEffect(() => {
    if (profile) {
      setForm(p => ({ ...p, ...profile }));
    }
  }, [profile]);
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState("");

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v],
  }));

  const submit = async e => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const p = { ...form, height_cm: +form.height_cm, weight_kg: +form.weight_kg, age: +form.age };
      const nutr = await api.getNutrition(p);
      setNutrition(nutr);
      onSave(p, nutr);
    } catch (err) {
      setError(err.message);
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
      <div className="page-eyebrow">Personal Architecture</div>
      <motion.h2 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="page-title"
      >
        Your <em>Biology</em>
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="page-sub"
      >
        Quantify your body and objectives. Our engine synchronizes these metrics to calculate precise metabolic thresholds.
      </motion.p>

      <form onSubmit={submit}>
        <Section title="Body Metrics" delay={0.4}>
          <div className="form-grid">
            <div className="fg">
              <label>Height (cm)</label>
              <input type="number" placeholder="175" value={form.height_cm}
                onChange={e => set("height_cm", e.target.value)} required min={50} max={250} />
            </div>
            <div className="fg">
              <label>Weight (kg)</label>
              <input type="number" placeholder="70" value={form.weight_kg}
                onChange={e => set("weight_kg", e.target.value)} required min={20} max={400} />
            </div>
            <div className="fg">
              <label>Age</label>
              <input type="number" placeholder="25" value={form.age}
                onChange={e => set("age", e.target.value)} required min={10} max={120} />
            </div>
            <div className="fg">
              <label>Biological sex</label>
              <select value={form.gender} onChange={e => set("gender", e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / prefer not to say</option>
              </select>
            </div>
            <div className="fg" style={{ gridColumn: "1 / -1" }}>
              <label>Activity level</label>
              <select value={form.activity_level} onChange={e => set("activity_level", e.target.value)}>
                {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section title="Your Goal" delay={0.5}>
          <div className="chips stagger">
            {GOAL_OPTIONS.map(g => (
              <button key={g.value} type="button"
                className={`chip ${form.goal === g.value ? "on-brand" : ""}`}
                onClick={() => set("goal", g.value)}
              >
                <span style={{ marginRight: 6, display: 'inline-flex', alignItems: 'center' }}>{g.icon}</span>{g.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Dietary Restrictions" delay={0.6}>
          <div className="chips stagger">
            {DIETARY.map(d => (
              <button key={d} type="button"
                className={`chip ${form.dietary_restrictions.includes(d) ? "on-mint" : ""}`}
                onClick={() => toggle("dietary_restrictions", d)}
              >{d}</button>
            ))}
          </div>
        </Section>

        <Section title="Allergens to Avoid" delay={0.7}>
          <div className="chips stagger">
            {ALLERGENS.map(a => (
              <button key={a} type="button"
                className={`chip ${form.allergens_to_avoid.includes(a) ? "on-peach" : ""}`}
                onClick={() => toggle("allergens_to_avoid", a)}
              >{a}</button>
            ))}
          </div>
        </Section>

        <Section title="Cuisine Preferences" delay={0.8}>
          <div className="chips stagger">
            {CUISINES.map(c => (
              <button key={c} type="button"
                className={`chip ${form.cuisine_preferences.includes(c) ? "on-brand" : ""}`}
                onClick={() => toggle("cuisine_preferences", c)}
              >{c}</button>
            ))}
          </div>
        </Section>

        {error && <div className="alert alert-warn">⚠ {error}</div>}

        <motion.button 
          whileHover={{ scale: 1.02, boxShadow: "var(--shadow-glow)" }}
          whileTap={{ scale: 0.98 }}
          type="submit" 
          className="btn btn-primary" 
          disabled={loading} 
          style={{ minWidth: 200, marginTop: 24 }}
        >
          {loading ? "Calculating…" : "Analyze Metabolic Baseline"}
        </motion.button>
      </form>

      {nutrition && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card glass-premium" 
          style={{ marginTop: 40 }}
        >
          <div className="card-title">Daily Nutrition Targets</div>
          <div className="macro-strip stagger">
            <div className="macro-pill pill-kcal">
              <span className="macro-val">{Math.round(nutrition.target_calories)}</span>
              <span className="macro-lbl">kcal / day</span>
            </div>
            <div className="macro-pill pill-prot">
              <span className="macro-val">{nutrition.protein_g}<span style={{fontSize:"0.85rem"}}>g</span></span>
              <span className="macro-lbl">protein</span>
            </div>
            <div className="macro-pill pill-carb">
              <span className="macro-val">{nutrition.carbs_g}<span style={{fontSize:"0.85rem"}}>g</span></span>
              <span className="macro-lbl">carbs</span>
            </div>
            <div className="macro-pill pill-fat">
              <span className="macro-val">{nutrition.fat_g}<span style={{fontSize:"0.85rem"}}>g</span></span>
              <span className="macro-lbl">fat</span>
            </div>
          </div>
          <div style={{ marginTop: 20, fontSize: "0.85rem", color: "var(--muted)", display: "flex", gap: 32, fontFamily: "'DM Mono', monospace" }}>
            <span>BMR <strong style={{ color: "var(--accent-light)" }}>{nutrition.bmr}</strong> kcal</span>
            <span>TDEE <strong style={{ color: "var(--accent-light)" }}>{nutrition.tdee}</strong> kcal</span>
            <span>Goal <strong style={{ color: "var(--amber)" }}>{form.goal.replace(/_/g, " ")}</strong></span>
          </div>
          <div className="divider" style={{ margin: "24px 0" }} />
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="btn btn-primary" 
            onClick={() => onSave({ ...form, height_cm: +form.height_cm, weight_kg: +form.weight_kg, age: +form.age }, nutrition)}
            style={{ width: "100%", height: 48 }}
          >
            Deploy Profile to Cloud →
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
