import React, { useState } from "react";
import { Heart, Eye, Sparkles, ExternalLink } from "lucide-react";

export default function TemplateCard({ template, isFavorite, onToggleFavorite, onOpenDetails }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [popAnim, setPopAnim] = useState(false);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setPopAnim(true);
    setTimeout(() => setPopAnim(false), 450);
    onToggleFavorite(template);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl p-[1px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/15">
      {/* Dynamic Glowing border gradient on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/40 group-hover:via-purple-500/30 group-hover:to-pink-500/20 transition-all duration-500 pointer-events-none" />

      {/* Main card body */}
      <div className="relative flex flex-col flex-1 bg-slate-900/90 border border-slate-800/80 group-hover:border-slate-700/60 rounded-2xl overflow-hidden backdrop-blur-xl">
        {/* Thumbnail Banner */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
          <img
            src={template.thumbnail_url}
            alt={template.name}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:rotate-0.5 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
          {!imgLoaded && (
            <div className="absolute inset-0 bg-slate-800/60 animate-pulse flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          )}

          {/* Vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-70 transition-opacity" />

          {/* Category Badge */}
          <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30 shadow-md">
            {template.category}
          </span>

          {/* Floating Favorite Action */}
          <button
            onClick={handleFavoriteClick}
            title={isFavorite ? "Remove from Favorites" : "Save to Favorites"}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 border cursor-pointer ${
              popAnim ? "animate-heart-pop" : ""
            } ${
              isFavorite
                ? "bg-rose-500/90 border-rose-400 text-white shadow-lg shadow-rose-500/40 scale-105"
                : "bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-white border-slate-700/80 hover:scale-105"
            }`}
            aria-label={isFavorite ? "Unfavorite" : "Favorite"}
          >
            <Heart
              className={`w-4 h-4 transition-all duration-300 ${
                isFavorite ? "fill-white text-white scale-110" : "text-slate-300"
              }`}
            />
          </button>
        </div>

        {/* Card Content */}
        <div className="flex flex-col flex-1 p-5">
          <h3 className="font-semibold text-base sm:text-lg text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1.5">
            {template.name}
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-2 mb-4 flex-1">
            {template.description}
          </p>

          {/* Card Footer Actions */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
            <button
              onClick={() => onOpenDetails(template)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 hover:border-indigo-500/40 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>

            <button
              onClick={handleFavoriteClick}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                popAnim ? "animate-heart-pop" : ""
              } ${
                isFavorite
                  ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 shadow-sm"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40"
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
    </div>
  );
}
