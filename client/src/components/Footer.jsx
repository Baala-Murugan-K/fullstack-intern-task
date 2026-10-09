import React from "react";
import { Sparkles, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="font-semibold text-slate-300">SaaS Vault</span>
          <span>— Full Stack Technical Task</span>
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          <span>using React, Tailwind CSS, Express & Supabase / Knex</span>
        </div>
      </div>
    </footer>
  );
}
