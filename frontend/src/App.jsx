import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import { User, BarChart3, Search, Calendar as CalendarIcon, LogOut, MessageSquare } from "lucide-react";
import "./index.css";
import ProfilePage  from "./pages/ProfilePage";
import SearchPage   from "./pages/SearchPage";
import MealPlanPage from "./pages/MealPlanPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChefPage      from "./pages/ChefPage";
import LandingPage  from "./pages/LandingPage";
import AuthPage     from "./pages/AuthPage";
import { AuthProvider, useAuth } from "./context/AuthContext";

const NAV = [
  { to: "/profile",   icon: <User size={18} />,         label: "My Profile"   },
  { to: "/analytics", icon: <BarChart3 size={18} />,     label: "Insights"     },
  { to: "/chef",      icon: <MessageSquare size={18} />, label: "Talk to Chef" },
  { to: "/search",    icon: <Search size={18} />,        label: "Find Recipes" },
  { to: "/mealplan",  icon: <CalendarIcon size={18} />,  label: "Meal Plan"    },
];

/* ── Protected layout with sidebar ── */
function DashboardLayout() {
  const { user, logout, profile, setProfile, nutrition, setNutrition } = useAuth();
  const navigate = useNavigate();

  const handleSaveProfile = (p, n) => {
    setProfile(p);
    localStorage.setItem("ff_profile", JSON.stringify(p));
    if (n) {
      setNutrition(n);
      localStorage.setItem("ff_nutrition", JSON.stringify(n));
    }
    navigate("/analytics");
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">FitFork</div>
          <div className="sidebar-sub">Personal Meal Planner</div>
        </div>

        <nav>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {profile && (
            <div className="sidebar-profile">
              <div className="sp-label">Active profile</div>
              <div className="sp-goal">{profile.goal.replace(/_/g, " ")}</div>
              <div className="sp-stats">
                {profile.weight_kg} kg · {profile.height_cm} cm
              </div>
            </div>
          )}
          <button className="nav-btn logout-btn" onClick={logout}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main className="main">
        <Routes>
          <Route path="/profile"   element={<ProfilePage profile={profile} onSave={handleSaveProfile} />} />
          <Route path="/analytics" element={<AnalyticsPage profile={profile} nutritionData={nutrition} onNavigate={(p) => navigate(`/${p}`)} />} />
          <Route path="/chef"      element={<ChefPage />} />
          <Route path="/search"    element={<SearchPage profile={profile} />} />
          <Route path="/mealplan"  element={<MealPlanPage profile={profile} onNavigate={(p) => navigate(`/${p}`)} />} />
          <Route path="*"          element={<Navigate to="/profile" replace />} />
        </Routes>
      </main>
    </div>
  );
}

/* ── Public routes ── */
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          user
            ? <Navigate to="/profile" replace />
            : <LandingPage />
        }
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/profile" replace /> : <AuthPage />}
      />
      <Route path="/*" element={<DashboardLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
