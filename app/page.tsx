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
  
  if (!user) {
    console.error("2. No user found!");
    return;
  }

  try {
    
    
    const { data, error } = await supabase
      .from("bookmarks")
      .insert([{ title, url, user_id: user.id }])
      .select(); // Adding .select() sometimes helps debug

    if (error) {
      console.error("4. Supabase Error:", error.message);
      alert("Database Error: " + error.message);
      return;
    }

    
    
    window.location.reload(); 
    
  } catch (err) {
    console.error("7. Script Crash:", err);
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

  return (
    <main className="p-8 max-w-2xl mx-auto font-sans">
      {!user ? (
        <div className="text-center py-20">
          <button onClick={login} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <form onSubmit={addBookmark} className="grid grid-cols-1 gap-4 p-4 border rounded-xl bg-gray-50">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="p-2 border rounded text-black"
            />
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="p-2 border rounded text-black"
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`${isSubmitting ? 'bg-gray-400' : 'bg-green-600'} text-white p-2 rounded transition`}
            >
              {isSubmitting ? "Saving..." : "Add Bookmark"}
            </button>
          </form>

          <div className="space-y-4">
            {bookmarks.map((bm) => (
              <div key={bm.id} className="flex justify-between items-center p-4 border rounded-lg bg-white">
                <div>
                  <h3 className="font-semibold">{bm.title}</h3>
                  <a href={bm.url} className="text-blue-500 text-sm">{bm.url}</a>
                </div>
                <button onClick={() => deleteBookmark(bm.id)} className="text-red-400">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}