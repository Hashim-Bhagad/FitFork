import React, { createContext, useContext, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("fitfork_user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem("fitfork_user");
      }
    }
    return null;
  });
  
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem("ff_token", res.access_token);
      
      // Fetch real user info from the backend
      let userData;
      try {
        const me = await api.getMe();
        userData = { id: me.id, email: me.email, name: me.full_name || me.email.split("@")[0] };
      } catch {
        userData = { id: "current", email, name: email.split("@")[0] };
      }

      localStorage.setItem("fitfork_user", JSON.stringify(userData));
      setUser(userData);

      // Load saved profile + nutrition from MongoDB
      try {
        const saved = await api.getProfile();
        if (saved.profile) {
          localStorage.setItem("ff_profile", JSON.stringify(saved.profile));
        }
        if (saved.nutrition) {
          localStorage.setItem("ff_nutrition", JSON.stringify(saved.nutrition));
        }
      } catch {
        // Profile not saved yet - that's fine
      }

      return res;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    setLoading(true);
    try {
      await api.signup(email, password, name);
      return await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("fitfork_user");
    localStorage.removeItem("ff_token");
    localStorage.removeItem("ff_profile");
    localStorage.removeItem("ff_nutrition");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
