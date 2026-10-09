import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Send, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const { register, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationPendingEmail, setVerificationPendingEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const result = await register(formData.name.trim(), formData.email.trim(), formData.password);
      
      if (result?.emailConfirmationRequired) {
        setVerificationPendingEmail(result.email || formData.email.trim());
      } else {
        navigate("/templates", { replace: true });
      }
    } catch (err) {
      console.error("Registration error:", err);
      const msg = err.message || err.response?.data?.message || "Failed to create account. Please try again.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!verificationPendingEmail) return;
    setResending(true);
    setResendStatus("");
    try {
      await resendVerificationEmail(verificationPendingEmail);
      setResendStatus("Verification email re-sent! Please check your inbox & spam folder.");
    } catch (err) {
      setResendStatus("Failed to resend: " + (err.message || "Please try again later."));
    } finally {
      setResending(false);
    }
  };

  // If Supabase Email Verification is required, show verification screen
  if (verificationPendingEmail) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-950">
        <div className="w-full max-w-md bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl shadow-indigo-950/40 backdrop-blur-md text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto mb-5 text-indigo-400 relative">
            <Mail className="w-8 h-8 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Check Your Inbox!</h2>
          <p className="text-sm text-slate-300 mb-2">
            We sent a verification link to:
          </p>
          <div className="inline-block px-3.5 py-1.5 rounded-xl bg-slate-800 text-indigo-300 font-mono text-xs mb-5 border border-slate-700">
            {verificationPendingEmail}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Please open the email from Supabase and click the confirmation link to activate your account. Once verified, you can sign in directly!
          </p>

          {resendStatus && (
            <div className="mb-4 p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-xs text-indigo-200">
              {resendStatus}
            </div>
          )}

          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Go to Sign In</span>
            </Link>

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Resend Verification Email</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-950/20 backdrop-blur-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create an Account</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Join the SaaS Template Store to favorite & save templates
          </p>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
