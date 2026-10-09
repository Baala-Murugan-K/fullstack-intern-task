import React from "react";
import { X, Heart, Sparkles, CheckCircle2, ExternalLink, ShieldCheck, Zap } from "lucide-react";

export default function TemplateDetailModal({ template, isOpen, onClose, onToggleFavorite, isFavorite }) {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-60 w-full overflow-hidden bg-slate-950">
          <img
            src={template.thumbnail_url}
            alt={template.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category Pill */}
          <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/90 text-white backdrop-blur-md shadow-md">
            {template.category}
          </span>

          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              {template.name}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">About Template</h3>
            <p className="text-sm leading-relaxed text-slate-300">
              {template.description}
            </p>
          </div>

          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">Included Capabilities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                "Production-ready responsive layouts",
                "JWT authentication & session security",
                "RESTful backend API integration",
                "Tailwind CSS theme tokens & dark styling",
                "Mobile-first responsive optimization",
                "Clean modular architecture",
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/40 text-xs text-indigo-200">
            <Zap className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>Ready for full-stack deployment on Vercel and Render with Supabase PostgreSQL!</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Back to Catalog
          </button>

          <button
            onClick={() => onToggleFavorite(template)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md ${
              isFavorite
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isFavorite ? "fill-rose-400 text-rose-400 scale-110" : "text-white"
              }`}
            />
            <span>{isFavorite ? "Favorited" : "Add to Favorites"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
