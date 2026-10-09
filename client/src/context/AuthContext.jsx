import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/api";
import { supabase, isSupabaseConfigured } from "../services/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth (supports both Supabase Auth & Express JWT backend)
  useEffect(() => {
    let authListener = null;

    const initAuth = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const userData = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email.split("@")[0],
            };
            setUser(userData);
            setToken(session.access_token);
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("token", session.access_token);
          } else {
            // Check if there was local auth
            const storedToken = localStorage.getItem("token");
            if (storedToken && !storedToken.startsWith("eyJ")) {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            }
          }

          // Listen to Supabase auth events (e.g. Email verification link click)
          const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
              const userData = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email.split("@")[0],
              };
              setUser(userData);
              setToken(session.access_token);
              localStorage.setItem("user", JSON.stringify(userData));
              localStorage.setItem("token", session.access_token);
            } else if (event === "SIGNED_OUT") {
              setUser(null);
              setToken(null);
              localStorage.removeItem("user");
              localStorage.removeItem("token");
            }
          });
          authListener = listener;
        } catch (err) {
          console.warn("Supabase auth session restore error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Express backend JWT session restoration
        const storedToken = localStorage.getItem("token");
        if (!storedToken) {
          setLoading(false);
          return;
        }

        try {
          const res = await authApi.getMe();
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setToken(null);
        } finally {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Register function
  const register = async (name, email, password) => {
    if (isSupabaseConfigured && supabase) {
      // Supabase Auth Signup with Email Verification
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: window.location.origin + "/templates",
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        return {
          emailConfirmationRequired: true,
          email: data.user.email,
          message: "A verification email has been sent to your address. Please verify your email before logging in.",
        };
      }

      if (data?.session) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || name,
        };
        setUser(userData);
        setToken(data.session.access_token);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", data.session.access_token);
        return { user: userData, token: data.session.access_token };
      }
    }

    // Default backend auth
    const res = await authApi.register({ name, email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem("token", receivedToken);
    localStorage.setItem("user", JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return res.data;
  };

  // Login function
  const login = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          const customErr = new Error("Email address has not been confirmed. Please check your inbox for the Supabase verification link.");
          customErr.isEmailNotConfirmed = true;
          customErr.email = email;
          throw customErr;
        }
        throw new Error(error.message);
      }

      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email.split("@")[0],
      };
      setUser(userData);
      setToken(data.session.access_token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.session.access_token);
      return { user: userData, token: data.session.access_token };
    }

    // Default backend auth
    const res = await authApi.login({ email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem("token", receivedToken);
    localStorage.setItem("user", JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return res.data;
  };

  // Resend Supabase verification email
  const resendVerificationEmail = async (email) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: window.location.origin + "/templates",
        },
      });
      if (error) throw new Error(error.message);
      return true;
    }
    return false;
  };

  // Logout function
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase sign out error:", err);
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    isSupabaseMode: isSupabaseConfigured,
    login,
    register,
    resendVerificationEmail,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
