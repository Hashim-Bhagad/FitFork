import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Leaf, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { login, register } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-mesh" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card glass"
      >
        <div className="auth-header">
          <div className="auth-logo">
            <Leaf size={28} className="accent-text" />
            <span>NutriMind</span>
          </div>
          <h2>{isLogin ? "Welcome back" : "Create account"}</h2>
          <p>{isLogin ? "Sign in to access your culinary insights" : "Join NutriMind for metabolic intelligence"}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="alert alert-warn border-coral/30 mb-4" style={{ fontSize: "0.8rem", padding: "8px 12px" }}>{error}</div>}
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="fg"
              >
                <label>Full Name</label>
                <div className="input-with-icon">
                  <User size={16} />
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="fg">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input 
                type="email" 
                placeholder="hello@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="fg">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-amber auth-btn" disabled={loading}>
            {loading ? "Authenticating..." : (isLogin ? "Sign In" : "Get Started")}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-footer">
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
