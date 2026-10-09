import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { favoritesApi } from "../services/api";
import TemplateCard from "../components/TemplateCard";
import TemplateDetailModal from "../components/TemplateDetailModal";
import { Heart, Sparkles, Loader2, AlertCircle, ArrowRight, LayoutGrid } from "lucide-react";

export default function FavoritesPage({ onFavoritesChange }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModalTemplate, setActiveModalTemplate] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "info") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await favoritesApi.getAll();
      const list = res.data?.data || [];
      setFavorites(list);
      if (onFavoritesChange) onFavoritesChange(list.length);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError("Failed to load your favorited templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleToggleFavorite = async (template) => {
    try {
      // Remove from favorites
      await favoritesApi.remove(template.id);
      const updatedList = favorites.filter((f) => f.id !== template.id);
      setFavorites(updatedList);
      if (onFavoritesChange) onFavoritesChange(updatedList.length);
      showToast(`Removed "${template.name}" from favorites`, "info");

      if (activeModalTemplate && activeModalTemplate.id === template.id) {
        setActiveModalTemplate(null);
      }
    } catch (err) {
      console.error("Remove favorite error:", err);
      showToast("Failed to remove template from favorites.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium border ${
              toastMessage.type === "error"
                ? "bg-rose-950/90 text-rose-200 border-rose-700/60"
                : "bg-indigo-950/90 text-indigo-200 border-indigo-700/60"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <section className="border-b border-slate-800/80 bg-slate-900/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Heart className="w-3.5 h-3.5 fill-rose-400" /> Bookmarked Collection
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                My Saved <span className="text-rose-400">Favorites</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                All templates you have saved for quick access and reference.
              </p>
            </div>

            <Link
              to="/templates"
              className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Explore More Templates</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading your favorites...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-center max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-rose-200 mb-1">{error}</h3>
            <button
              onClick={loadFavorites}
              className="mt-3 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Favorites Grid */}
        {!loading && !error && favorites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Showing {favorites.length} Saved {favorites.length === 1 ? "Template" : "Templates"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isFavorite={true}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(tmpl) => setActiveModalTemplate(tmpl)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty Favorites State */}
        {!loading && !error && favorites.length === 0 && (
          <div className="text-center py-24 px-4 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5 text-rose-400">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No favorites saved yet</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-sm mx-auto">
              You haven't added any templates to your favorites list. Browse the store and click the heart icon on any template card!
            </p>
            <Link
              to="/templates"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              <span>Browse Template Store</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>

      {/* Modal Preview */}
      <TemplateDetailModal
        template={activeModalTemplate}
        isOpen={Boolean(activeModalTemplate)}
        onClose={() => setActiveModalTemplate(null)}
        isFavorite={true}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
