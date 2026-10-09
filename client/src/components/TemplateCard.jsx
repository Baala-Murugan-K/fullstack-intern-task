import React, { useState } from "react";
import { Heart, Eye, Sparkles } from "lucide-react";

export default function TemplateCard({ template, isFavorite, onToggleFavorite, onOpenDetails }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
    >
      {/* Thumbnail Banner */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        <img
          src={template.thumbnail_url}
          alt={template.name}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-slate-600 animate-spin" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Category Badge */}
        <span className="absolute top-3 left-3 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30 shadow-sm">
          {template.category}
        </span>

        {/* Favorite Button on Card Banner */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(template);
          }}
          title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 border cursor-pointer ${
            isFavorite
              ? "bg-rose-500/90 border-rose-400 text-white shadow-lg shadow-rose-500/30 scale-105"
              : "bg-slate-900/70 hover:bg-slate-900 text-slate-300 hover:text-white border-slate-700/70"
          }`}
          aria-label={isFavorite ? "Unfavorite" : "Favorite"}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${
              isFavorite ? "fill-white text-white scale-110" : "text-slate-300"
            }`}
          />
        </button>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-semibold text-lg text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-2">
          {template.name}
        </h3>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-2 mb-4 flex-1">
          {template.description}
        </p>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2 mt-auto">
          <button
            onClick={() => onOpenDetails(template)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>

          <button
            onClick={() => onToggleFavorite(template)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isFavorite
                ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30"
                : "bg-indigo-600/90 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isFavorite ? "fill-rose-400 text-rose-400" : "text-white"
              }`}
            />
            <span>{isFavorite ? "Favorited" : "Favorite"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
