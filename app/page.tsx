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

// ✅ Create client ONCE (outside component)
const supabase = createClient();

export default function BookmarkPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    let channel: any;

    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setBookmarks(data || []);
      else console.error(error.message);
    };

    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);

      if (session?.user) fetchBookmarks();
    };

    initialize();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN") fetchBookmarks();
      if (event === "SIGNED_OUT") setBookmarks([]);
    });

    // ✅ Realtime subscription (safe)
    if (typeof window !== "undefined") {
      channel = supabase
        .channel("realtime-bookmarks")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "bookmarks" },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              setBookmarks((prev) => [payload.new, ...prev]);
            }

            if (payload.eventType === "DELETE") {
              setBookmarks((prev) =>
                prev.filter((bm) => bm.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();
    }

    return () => {
      authListener.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Add bookmark
  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase
      .from("bookmarks")
      .insert([{ title, url, user_id: user.id }]);

    if (error) alert(error.message);
    else {
      setTitle("");
      setUrl("");
    }
  };

  // ✅ Delete bookmark
  const deleteBookmark = async (id: string) => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (error) console.error(error.message);
  };

  // ✅ Google login
  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

  const logout = () => supabase.auth.signOut();

  return (
    <main className="p-8 max-w-2xl mx-auto font-sans">
      {!user ? (
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Bookmark Manager
          </h1>

          <button
            onClick={login}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">
              My Bookmarks
            </h1>

            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              Logout
            </button>
          </div>

          <form
            onSubmit={addBookmark}
            className="grid grid-cols-1 gap-4 p-4 border rounded-xl bg-gray-50"
          >
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="p-2 border rounded text-gray-900 bg-white"
            />

            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="p-2 border rounded text-gray-900 bg-white"
            />

            <button
              type="submit"
              className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
            >
              Add Bookmark
            </button>
          </form>

          <div className="space-y-4">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="flex justify-between items-center p-4 border rounded-lg bg-white"
              >
                <div>
                  <h3 className="font-semibold">{bm.title}</h3>

                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 text-sm truncate block max-w-xs"
                  >
                    {bm.url}
                  </a>
                </div>

                <button
                  onClick={() => deleteBookmark(bm.id)}
                  className="text-red-400 hover:text-red-600 p-2"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}