import { createContext, useEffect, useState } from "react";
import { storage } from "../utils/storage";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);  // { id, email } or null
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

// Load token & user from storage on startup
useEffect(() => {
  const loadAuth = async () => {
    try {
      const savedToken = await storage.getItem("token");
      const savedUser = await storage.getItem("user");

      if (savedToken) setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      }
    } catch (e) {
      console.log("Auth load error:", e);
    } finally {
      setLoading(false);
    }
  };

  loadAuth();
}, []);



  const login = async (newToken, userData) => {
    setToken(newToken);
    setUser(userData);

    await storage.setItem("token", newToken);
    await storage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);

    await storage.removeItem("token");
    await storage.removeItem("user");
  };

  const handleInvalidToken = async () => {
  console.log("AUTO-LOGOUT: Invalid or expired token");

  setToken(null);
  setUser(null);

  await storage.removeItem("token");
  await storage.removeItem("user");
};


  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, handleInvalidToken }}>
      {children}
    </AuthContext.Provider>
  );
}
