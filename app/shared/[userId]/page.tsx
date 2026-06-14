"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  category?: string;
  notes?: string;
}

const supabase = createClient();

export default function SharedLibraryPage() {
  const { userId } = useParams();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedBookmarks = async () => {
      if (!userId) return;
      
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id, title, url, category, notes")
        .eq("user_id", userId)
        .eq("is_public", true) // Only grab bookmarks marked public!
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBookmarks(data);
      }
      setLoading(false);
    };

    fetchSharedBookmarks();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
        Loading shared library...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div className="px-2">
          <h1 className="text-3xl font-black text-white tracking-tighter italic">Shared Library.</h1>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1">
            {bookmarks.length} Publicly Available Items
          </p>
        </div>

        <div className="space-y-4">
          {bookmarks.map((bm) => (
            <div key={bm.id} className="p-6 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-md">
              <h3 className="font-bold text-white text-lg">{bm.title}</h3>
              {bm.category && (
                <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mt-1">{bm.category}</p>
              )}
              {bm.notes && (
                <p className="text-slate-400 text-sm mt-2 font-medium bg-white/5 p-3 rounded-xl border border-white/5 border-dashed">
                  {bm.notes}
                </p>
              )}
              <a 
                href={bm.url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-slate-500 text-sm font-medium hover:text-slate-300 transition-colors truncate block mt-2"
              >
                {bm.url.replace(/^https?:\/\//, '')}
              </a>
            </div>
          ))}

          {bookmarks.length === 0 && (
            <div className="text-center py-20 bg-white/5 border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">No public items found in this library</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}