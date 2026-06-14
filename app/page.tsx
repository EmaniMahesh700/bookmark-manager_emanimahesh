"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  user_id: string;
  category?: string;
  notes?: string;
  is_public?: boolean;
}

const supabase = createClient();

export default function BookmarkPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
        .insert([
          {
            title,
            url,
            category,
            notes,
            user_id: user.id,
            is_public: false, // Private by default
          },
        ]);

      if (error) throw error;
      setTitle("");
      setUrl("");
      setCategory("");
      setNotes("");
      window.location.reload();
    } catch (err) {
      console.error("Error:", err);
      setIsSubmitting(false);
    }
  };

  // --- Fixed Type-Safe Toggle Public Status Function ---
  const togglePublicStatus = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    
    // 1. Instantly update the backend Supabase database
    const { error } = await supabase
      .from("bookmarks")
      .update({ is_public: nextStatus })
      .eq("id", id);
      
    if (error) {
      console.error("Failed to update status in Supabase:", error);
      alert("Error saving privacy setting to database.");
      return;
    }
    
    // 2. Reactively update the local client state arrays
    setBookmarks((prev) =>
      prev.map((bm) => (bm.id === id ? { ...bm, is_public: nextStatus } : bm))
    );
  };

  const deleteBookmark = async (id: string) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (!error) window.location.reload();
  };

  const copyShareLink = () => {
    if (!user) return;
    const shareUrl = `${window.location.origin}/shared/${user.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Copied your public profile share URL to clipboard!");
  };

  const exportBookmarks = () => {
    if (bookmarks.length === 0) {
      alert("No bookmarks available to export!");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bookmarks, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bookmarks_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsSubmitting(true);
    fileReader.readAsText(e.target.files[0], "UTF-8");
    
    fileReader.onload = async (event) => {
      try {
        const parsedData = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsedData)) {
          alert("Invalid file format.");
          setIsSubmitting(false);
          return;
        }

        const bookmarksToInsert = parsedData.map((bm: any) => ({
          title: bm.title || "Untitled Import",
          url: bm.url || "https://",
          category: bm.category || "",
          notes: bm.notes || "",
          user_id: user?.id,
          is_public: false,
        }));

        const { error } = await supabase.from("bookmarks").insert(bookmarksToInsert);
        if (error) throw error;
        window.location.reload();
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
      }
    };
  };

  const login = () => supabase.auth.signInWithOAuth({ 
    provider: "google",
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin : "" } 
  });

  const logout = () => supabase.auth.signOut().then(() => window.location.reload());

  const filteredBookmarks = bookmarks.filter((bm) => {
    const query = searchQuery.toLowerCase();
    return (
      bm.title.toLowerCase().includes(query) ||
      bm.url.toLowerCase().includes(query) ||
      (bm.category && bm.category.toLowerCase().includes(query)) ||
      (bm.notes && bm.notes.toLowerCase().includes(query))
    );
  });

  const totalCount = bookmarks.length;
  const uncategorizedCount = bookmarks.filter(bm => !bm.category || bm.category === "").length;
  const topCategory = (() => {
    if (totalCount === 0) return "None";
    const counts: { [key: string]: number } = {};
    bookmarks.forEach((bm) => {
      if (bm.category) counts[bm.category] = (counts[bm.category] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : "None";
  })();

  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        
        {!user ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 px-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-violet-400 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
            </div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Bookmarks</h1>
            <p className="text-slate-400 text-lg mb-10 max-w-sm">Securely store and organize your most important web links.</p>
            <button onClick={login} className="w-full py-4 px-8 bg-white text-slate-950 rounded-2xl font-bold transition-all shadow-xl">
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            
            <div className="flex justify-between items-center px-2">
              <div>
                <h1 className="text-3xl font-black text-white tracking-tighter italic">Bookmarks.</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{bookmarks.length} Saved Items</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={copyShareLink} className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest transition-all">
                  🔗 Share Profile
                </button>
                <button onClick={logout} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 text-xs font-black uppercase tracking-widest transition-all border border-white/5">
                  Logout
                </button>
              </div>
            </div>

            {/* Analytics Grid */}
            {bookmarks.length > 0 && (
              <div className="grid grid-cols-3 gap-4 px-2">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Total</p>
                  <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center backdrop-blur-md truncate">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Top Topic</p>
                  <p className="text-base font-black text-indigo-400 mt-2 truncate">{topCategory}</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Inbox</p>
                  <p className="text-2xl font-black text-amber-500 mt-1">{uncategorizedCount}</p>
                </div>
              </div>
            )}

            {/* Import/Export Utility buttons */}
            {bookmarks.length > 0 && (
              <div className="flex items-center gap-4 px-2">
                <button onClick={exportBookmarks} className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-bold text-xs uppercase tracking-wider transition-all">
                  📥 Export JSON
                </button>
                <label className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center">
                  📤 Import JSON
                  <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                </label>
              </div>
            )}

            <form onSubmit={addBookmark} className="bg-white p-8 rounded-3xl shadow-2xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block">Title</label>
                  <input type="text" placeholder="Project Inspiration" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-900 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block">URL</label>
                  <input type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-900 font-medium" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium outline-none">
                    <option value="">Select Category</option>
                    <option value="Programming">Programming</option>
                    <option value="AI">AI</option>
                    <option value="Research">Research</option>
                    <option value="Study">Study</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block">Notes / Description</label>
                  <textarea placeholder="Add a quick summary..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-900 font-medium resize-none" />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-white bg-slate-900 hover:bg-indigo-600 text-xs transition-all">
                {isSubmitting ? "Syncing..." : "Add Bookmark"}
              </button>
            </form>

            {/* Live Search Input Bar */}
            {bookmarks.length > 0 && (
              <div className="relative px-2">
                <input type="text" placeholder="Search parameters..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white outline-none" />
              </div>
            )}

            <div className="space-y-4">
              {filteredBookmarks.map((bm) => (
                <div key={bm.id} className="group relative flex justify-between items-start p-6 bg-white/5 border border-white/5 rounded-2xl transition-all">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-lg truncate pr-8">{bm.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider">{bm.category || "Uncategorized"}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${bm.is_public ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                        {bm.is_public ? "Public" : "Private"}
                      </span>
                    </div>
                    {bm.notes && <p className="text-slate-400 text-sm mt-2 bg-white/5 p-3 rounded-xl border border-white/5 border-dashed max-w-xl">{bm.notes}</p>}
                    <a href={bm.url} target="_blank" rel="noreferrer" className="text-slate-500 text-sm font-medium hover:text-slate-300 transition-colors truncate block mt-2">
                      {bm.url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                  
                  <div className="flex gap-1 shrink-0">
                    {/* Public/Private Status Toggle Slider Button */}
                    <button onClick={() => togglePublicStatus(bm.id, !!bm.is_public)} className={`p-3 rounded-xl transition-all ${bm.is_public ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-500 hover:text-white'}`} title={bm.is_public ? "Make Private" : "Make Public"}>
                      {bm.is_public ? "🔓" : "🔒"}
                    </button>
                    <button onClick={() => deleteBookmark(bm.id)} className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}