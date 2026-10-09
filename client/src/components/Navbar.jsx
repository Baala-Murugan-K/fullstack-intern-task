import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Heart, LayoutGrid, LogIn, LogOut, User, PlusCircle } from "lucide-react";

export default function Navbar({ favoritesCount = 0 }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/templates" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              SaaS<span className="text-indigo-400">Vault</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50">
              Template Store
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/templates" className={navLinkClasses}>
            <LayoutGrid className="w-4 h-4" />
            <span>Templates</span>
          </NavLink>

          <NavLink to="/favorites" className={navLinkClasses}>
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="ml-1 text-xs px-2 py-0.5 font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {favoritesCount}
              </span>
            )}
          </NavLink>
        </nav>

        {/* Right Auth Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-semibold text-xs text-white uppercase shadow-sm">
                  {user?.name ? user.name[0] : "U"}
                </div>
                <div className="text-left text-xs leading-tight">
                  <p className="font-medium text-slate-200">{user?.name || "User"}</p>
                  <p className="text-slate-400 truncate max-w-[140px]">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-800/50 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
