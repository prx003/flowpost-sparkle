import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth, useAuth } from "@/lib/auth";
import { CONTENT_SELECT, fetchMyReactions, type Content } from "@/lib/content";
import { ContentCard } from "@/components/ContentCard";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Favourites · SAC Community" },
      { name: "description", content: "Everything you saved on SAC Community: posts, reels, events, tickets and news." },
      { property: "og:title", content: "Your Favourites · SAC Community" },
      { property: "og:description", content: "Everything you saved on SAC Community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RequireAuth><Saved /></RequireAuth>,
});

function Saved() {
  const { userId } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["savedContent", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("saves")
        .select("content_id, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (rows ?? []).map((r) => r.content_id);
      if (!ids.length) return [] as Content[];
      const { data: items, error: contentError } = await supabase.from("content").select(CONTENT_SELECT).in("id", ids);
      if (contentError) throw contentError;
      const order = new Map(ids.map((id, i) => [id, i]));
      return ((items ?? []) as unknown as Content[]).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    },
  });
  const { data: r } = useQuery({ queryKey: ["reactions", userId], queryFn: () => fetchMyReactions(userId) });

  return (
    <div className="mx-auto max-w-[540px] space-y-4 px-3 py-4 sm:px-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary"><Heart className="h-5 w-5 fill-primary text-primary" /></span>
        <div>
          <h1 className="text-lg font-bold leading-tight">Favourites</h1>
          <p className="text-xs text-muted-foreground">Things you saved{data?.length ? ` · ${data.length}` : ""}</p>
        </div>
      </div>

      {isLoading && Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-card" />)}

      {!isLoading && !data?.length && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Heart className="h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 text-xl font-bold">Nothing saved yet</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Tap the bookmark on any post, reel or event and it lands here.</p>
          <Link to="/explore" className="mt-4 rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Find something to save</Link>
        </div>
      )}

      {data?.map((c) => <ContentCard key={c.id} c={c} liked={!!r?.liked.has(c.id)} saved={!!r?.saved.has(c.id)} />)}
    </div>
  );
}
