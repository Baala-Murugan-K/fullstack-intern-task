import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { templatesApi, favoritesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import TemplateCard from "../components/TemplateCard";
import TemplateDetailModal from "../components/TemplateDetailModal";
import { Search, Filter, Sparkles, Loader2, Heart, AlertCircle, X } from "lucide-react";

const CATEGORIES = [
  "All",
  "CRM",
  "Analytics",
  "AI Tools",
  "Developer Tools",
  "E-Commerce",
  "Project Management",
  "Fintech",
  "Customer Support",
];

export default function TemplatesPage({ onFavoritesChange }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModalTemplate, setActiveModalTemplate] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Fetch templates and user favorites
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch templates
      const templatesRes = await templatesApi.getAll();
      const fetchedTemplates = templatesRes.data?.data || [];
      setTemplates(fetchedTemplates);

      // 2. If logged in, fetch user favorites
      if (isAuthenticated) {
        try {
          const favRes = await favoritesApi.getAll();
          const favList = favRes.data?.data || [];
          const ids = new Set(favList.map((f) => f.id));
          setFavoriteIds(ids);
          if (onFavoritesChange) onFavoritesChange(ids.size);
        } catch (favErr) {
          console.warn("Could not load user favorites:", favErr);
        }
      } else {
        setFavoriteIds(new Set());
        if (onFavoritesChange) onFavoritesChange(0);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
      setError("Failed to load templates. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Handle Toggle Favorite
  const handleToggleFavorite = async (template) => {
    if (!isAuthenticated) {
      showToast("Please log in to save templates to favorites", "info");
      navigate("/login", { state: { message: "Please log in to manage your favorites." } });
      return;
    }

    const isFav = favoriteIds.has(template.id);

    try {
      if (isFav) {
        // Remove from favorites
        await favoritesApi.remove(template.id);
        const nextIds = new Set(favoriteIds);
        nextIds.delete(template.id);
        setFavoriteIds(nextIds);
        if (onFavoritesChange) onFavoritesChange(nextIds.size);
        showToast(`Removed "${template.name}" from favorites`, "info");
      } else {
        // Add to favorites
        await favoritesApi.add(template.id);
        const nextIds = new Set(favoriteIds);
        nextIds.add(template.id);
        setFavoriteIds(nextIds);
        if (onFavoritesChange) onFavoritesChange(nextIds.size);
        showToast(`Added "${template.name}" to favorites!`, "success");
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
      showToast(err.response?.data?.message || "Failed to update favorites.", "error");
    }
  };

  // Filter templates locally based on search query & selected category
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesCategory =
        selectedCategory === "All" || template.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        template.name.toLowerCase().includes(q) ||
        template.description.toLowerCase().includes(q) ||
        template.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium border ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-700/60"
                : toastMessage.type === "error"
                ? "bg-rose-950/90 text-rose-200 border-rose-700/60"
                : "bg-indigo-950/90 text-indigo-200 border-indigo-700/60"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-indigo-950/20 via-slate-950 to-slate-950 pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Curated SaaS Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
            Mini SaaS <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Template Store</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Discover production-ready templates for your next software project. Browse, search, filter by category, and bookmark your favorites.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by title, description or category..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills (Bonus Feature) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Available Templates</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700/60">
              {filteredTemplates.length}
            </span>
          </div>

          {(searchQuery || selectedCategory !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading templates catalogue...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-center max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-rose-200 mb-1">Failed to load templates</h3>
            <p className="text-xs text-rose-300/80 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Templates Grid */}
        {!loading && !error && filteredTemplates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isFavorite={favoriteIds.has(template.id)}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(tmpl) => setActiveModalTemplate(tmpl)}
              />
            ))}
          </div>
        )}

        {/* Empty Search Results */}
        {!loading && !error && filteredTemplates.length === 0 && (
          <div className="text-center py-20 px-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No templates found</h3>
            <p className="text-xs text-slate-400 mb-5">
              No results match your criteria "{searchQuery || selectedCategory}". Try adjusting your query or category filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </main>

      {/* Modal Details Preview */}
      <TemplateDetailModal
        template={activeModalTemplate}
        isOpen={Boolean(activeModalTemplate)}
        onClose={() => setActiveModalTemplate(null)}
        isFavorite={activeModalTemplate ? favoriteIds.has(activeModalTemplate.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
