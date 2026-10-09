import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2, Sparkles, AlertCircle, Send, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { login, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState("");

  const redirectMessage = location.state?.message;
  const from = location.state?.from?.pathname || "/templates";

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrorMessage("");
    setUnconfirmedEmail(null);
    setResendNotice("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setUnconfirmedEmail(null);
    setResendNotice("");

    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      if (err.isEmailNotConfirmed) {
        setUnconfirmedEmail(err.email || formData.email);
        setErrorMessage("Your email address has not been verified yet.");
      } else {
        const msg = err.message || err.response?.data?.message || "Invalid credentials. Please verify your email and password.";
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unconfirmedEmail) return;
    setResending(true);
    try {
      await resendVerificationEmail(unconfirmedEmail);
      setResendNotice("Verification email re-sent! Please check your inbox.");
    } catch (err) {
      setResendNotice("Could not resend email: " + (err.message || "Please try again later."));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-950/20 backdrop-blur-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Log in to manage your templates and saved favorites
          </p>
        </div>

        {/* Redirect notice if triggered by protected route */}
        {redirectMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-300">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{redirectMessage}</span>
          </div>
        )}

        {/* Error alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              {unconfirmedEmail && (
                <div className="mt-2 pt-2 border-t border-rose-500/20 flex flex-col gap-2">
                  <p className="text-[11px] text-rose-200/90">
                    Did not receive the verification email?
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-rose-600/80 hover:bg-rose-600 px-3 py-1 rounded-lg self-start transition-colors cursor-pointer"
                  >
                    {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    <span>Resend Verification Email</span>
                  </button>
                  {resendNotice && (
                    <p className="text-[11px] text-emerald-300 font-medium">{resendNotice}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="developer@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In to Account</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account yet?{" "}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
