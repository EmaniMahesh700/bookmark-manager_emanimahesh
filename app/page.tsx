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

      // Force reload to see changes
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
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-2xl mx-auto">
        
        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-xl border border-slate-100 px-10 text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-500 mb-8">Save and organize your favorite links in one place.</p>
            <button 
              onClick={login} 
              className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-3"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Library</h1>
                <p className="text-sm text-slate-500">{bookmarks.length} saved links</p>
              </div>
              <button onClick={logout} className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors">
                Sign Out
              </button>
            </div>

            {/* Form Card */}
            <form onSubmit={addBookmark} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Supabase Documentation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-800"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-800"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl font-bold transition-all shadow-md ${
                  isSubmitting ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? "Processing..." : "Add Bookmark"}
              </button>
            </form>

            {/* List */}
            <div className="grid gap-4">
              {bookmarks.map((bm) => (
                <div key={bm.id} className="group flex justify-between items-center p-5 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 truncate pr-4">{bm.title}</h3>
                    <a href={bm.url} target="_blank" rel="noreferrer" className="text-indigo-500 text-sm font-medium hover:underline truncate block">
                      {bm.url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                  <button 
                    onClick={() => deleteBookmark(bm.id)} 
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete Bookmark"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
              {bookmarks.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                  <p className="text-slate-400 font-medium">Your library is empty. Add your first link above!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}