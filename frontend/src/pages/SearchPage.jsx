import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Utensils, AlertCircle } from "lucide-react";
import { api } from "../api";
import RecipeCard from "../components/RecipeCard";

const QUICK = [
  "High protein breakfast",
  "Light vegetarian dinner",
  "Quick 15-minute lunch",
  "Muscle-building meals",
  "Low-calorie snacks",
  "Comfort food makeover",
];

export default function SearchPage({ profile }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [touched, setTouched] = useState(false);
  const [lastQ,   setLastQ]   = useState("");

  const hasProfile = profile?.height_cm;

  const search = async q => {
    if (!q.trim() || !hasProfile) return;
    setError(""); setLoading(true); setTouched(true); setLastQ(q);
    try {
      const data = await api.searchRecipes(q, profile, 9);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-eyebrow">Recipe Discovery</div>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="page-title">Find <em>recipes</em></motion.h2>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="page-sub">
        Ask in plain English — we'll rank results using your nutrition profile, allergens, and cuisine preferences.
      </motion.p>

      {/* Search bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="search-wrap glass">
        <Search size={18} className="text-muted" />
        <input
          type="text"
          placeholder="e.g. high protein breakfast under 500 calories…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search(query)}
        />
        <button
          className="btn btn-primary"
          style={{ borderRadius: "var(--r-pill)", padding: "9px 24px" }}
          onClick={() => search(query)}
          disabled={loading || !hasProfile}
        >
          Explore
        </button>
      </motion.div>

      {/* Profile warning */}
      {!hasProfile && (
        <div className="alert alert-warn">
          ⚠ Set up your profile first so we can personalise the results.
        </div>
      )}

      {/* Quick searches */}
      {!touched && hasProfile && (
        <>
          <div className="section-label">Quick searches</div>
          <div className="chips stagger" style={{ marginBottom: 28 }}>
            {QUICK.map(q => (
              <button key={q} className="chip"
                onClick={() => { setQuery(q); search(q); }}
              >{q}</button>
            ))}
          </div>
        </>
      )}

      {error && <div className="alert alert-warn">⚠ {error}</div>}

      {loading && <div className="spinner" />}

      {!loading && touched && results.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign:"center", padding:"64px 0", color:"var(--muted)" }}
        >
          <div style={{ fontSize:"3rem", marginBottom:12 }}><Utensils size={48} className="mx-auto" /></div>
          <p className="font-heading text-xl">No recipes found</p>
          <p style={{ fontSize:"0.83rem", marginTop:6 }}>
            Try different keywords, or check that the backend is running and data has been ingested.
          </p>
        </motion.div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <div className="section-label" style={{ margin:0 }}>
              {results.length} results for
            </div>
            <span className="font-heading italic font-normal text-brand text-lg">
              "{lastQ}"
            </span>
          </div>
          <div className="recipe-grid">
            {results.map((r, i) => <RecipeCard key={r.id} recipe={r} index={i} />)}
          </div>
        </>
      )}
    </div>
  );
}
