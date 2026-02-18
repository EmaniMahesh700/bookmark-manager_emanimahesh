"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  user_id: string;
}

const supabase = createClient();

export default function BookmarkPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from("bookmarks")
          .select("*")
          .order("created_at", { ascending: false });
        setBookmarks(data || []);
      }
    };
    initialize();
  }, []);

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("bookmarks")
        .insert([{ title, url, user_id: user.id }]);

      if (error) throw error;
      window.location.reload();
    } catch (err) {
      console.error("Error:", err);
      setIsSubmitting(false);
    }
  };

  const deleteBookmark = async (id: string) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (!error) window.location.reload();
  };

  const login = () => supabase.auth.signInWithOAuth({ 
    provider: "google",
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin : "" } 
  });

  const logout = () => supabase.auth.signOut().then(() => window.location.reload());

  return (
    
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        
        {!user ? (
          
          <div className="flex flex-col items-center justify-center py-24 bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] border border-white/10 px-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-violet-400 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
            </div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Vault</h1>
            <p className="text-slate-400 text-lg mb-10 max-w-sm">Securely store and organize your most important web links.</p>
            <button 
              onClick={login} 
              className="w-full py-4 px-8 bg-white hover:bg-indigo-50 text-slate-950 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            
            <div className="flex justify-between items-center px-2">
              <div>
                <h1 className="text-3xl font-black text-white tracking-tighter italic">VAULT.</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{bookmarks.length} Saved Items</p>
                </div>
              </div>
              <button onClick={logout} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-black uppercase tracking-widest transition-all border border-white/5">
                Logout
              </button>
            </div>

            
            <form onSubmit={addBookmark} className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-indigo-950/50 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Title</label>
                  <input
                    type="text"
                    placeholder="Project Inspiration"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 font-medium"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all ${
                  isSubmitting 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-xl shadow-indigo-200/20 active:scale-[0.99]'
                }`}
              >
                {isSubmitting ? "Syncing..." : "Add to Library"}
              </button>
            </form>

            
            <div className="space-y-4">
              {bookmarks.map((bm) => (
                <div key={bm.id} className="group relative flex justify-between items-center p-6 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md border border-white/5 rounded-[1.5rem] transition-all duration-300">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors truncate pr-8">
                      {bm.title}
                    </h3>
                    <a 
                      href={bm.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-slate-500 text-sm font-medium hover:text-slate-300 transition-colors truncate block mt-1"
                    >
                      {bm.url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                  
                  
                  <button 
                    onClick={() => deleteBookmark(bm.id)} 
                    className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {bookmarks.length === 0 && (
                <div className="text-center py-20 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[2rem]">
                  <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Library is empty</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}