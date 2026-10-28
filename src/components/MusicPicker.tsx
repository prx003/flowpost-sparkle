import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Check, ChevronLeft, Music, Pause, Play, Search, X } from "lucide-react";
import { TRACKS } from "@/lib/composer";
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type MusicSelection = { title: string; artist: string };
type Song = { title: string; artist: string; art?: string; previewUrl?: string; duration?: number };
type ItunesSong = { trackName: string; artistName: string; artworkUrl100?: string; previewUrl?: string; trackTimeMillis?: number };

const time = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const SAVED_KEY = "sac:saved-music";
const toSong = (r: ItunesSong): Song => ({ title: r.trackName, artist: r.artistName, art: r.artworkUrl100?.replace("100x100", "300x300"), previewUrl: r.previewUrl, duration: r.trackTimeMillis ? r.trackTimeMillis / 1000 : undefined });

async function itunes(term: string, limit: number, signal?: AbortSignal): Promise<Song[]> {
  const res = await fetch(`https://itunes.apple.com/search?${new URLSearchParams({ term, entity: "song", limit: String(limit) })}`, { signal });
  if (!res.ok) throw new Error("Music unavailable");
  const data: { results: ItunesSong[] } = await res.json();
  return data.results.filter((r) => r.previewUrl).map(toSong);
}

function Equalizer({ small }: { small?: boolean }) {
  return <span className={cn("flex items-end gap-[2px]", small ? "h-3" : "h-4")} aria-hidden="true">
    {[0, 1, 2, 3].map((i) => <span key={i} className="eq-bar w-[3px] rounded-full bg-social-action" style={{ animationDelay: `${i * 0.15}s` }} />)}
  </span>;
}

function Art({ song, size = 48, playing }: { song: Song; size?: number; playing?: boolean }) {
  return <span className="relative grid shrink-0 place-items-center overflow-hidden rounded-md bg-secondary" style={{ width: size, height: size }}>
    {song.art ? <img src={song.art} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Music className="h-5 w-5 text-muted-foreground" />}
    {playing && <span className="absolute inset-0 grid place-items-center bg-background/50"><Equalizer small /></span>}
  </span>;
}

export function MusicPicker({ value, onPick, kind = "post" }: { value: MusicSelection | null; onPick: (music: MusicSelection | null) => void; kind?: string }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [tab, setTab] = useState<"foryou" | "trending" | "saved">("foryou");
  const [saved, setSaved] = useState<Song[]>([]);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Song | null>(null);
  const [clipLen, setClipLen] = useState(kind === "post" ? 30 : 15);
  const [start, setStart] = useState(0);
  const [pos, setPos] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]")); } catch { /* ignore */ } }, []);
  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => () => { audio.current?.pause(); }, []);

  const forYou = useQuery({
    queryKey: ["music-foryou"], staleTime: 30 * 60 * 1000, retry: false,
    queryFn: async ({ signal }) => (await Promise.all(TRACKS.map((t) => itunes(`${t.title} ${t.artist}`, 1, signal).catch(() => [])))).map((r, i) => r[0] ?? { ...TRACKS[i] }),
  });
  const trending = useQuery({ queryKey: ["music-trending"], staleTime: 30 * 60 * 1000, retry: false, enabled: tab === "trending", queryFn: ({ signal }) => itunes("top hits 2026", 25, signal) });
  const search = useQuery({ queryKey: ["music-search", debounced], enabled: !!debounced, retry: false, queryFn: ({ signal }) => itunes(debounced, 25, signal) });

  const keyOf = (s: Song) => `${s.title}|${s.artist}`;
  const isSaved = (s: Song) => saved.some((x) => keyOf(x) === keyOf(s));
  const toggleSave = (s: Song) => {
    const next = isSaved(s) ? saved.filter((x) => keyOf(x) !== keyOf(s)) : [s, ...saved];
    setSaved(next); localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  const play = (s: Song, from = 0) => {
    if (!s.previewUrl) return;
    if (!audio.current) audio.current = new Audio();
    const a = audio.current;
    if (playingKey === keyOf(s) && !a.paused && from === 0 && !chosen) { a.pause(); setPlayingKey(null); return; }
    if (a.src !== s.previewUrl) a.src = s.previewUrl;
    a.currentTime = from;
    a.ontimeupdate = () => setPos(a.currentTime);
    a.onended = () => setPlayingKey(null);
    a.play().then(() => setPlayingKey(keyOf(s))).catch(() => setPlayingKey(null));
  };
  const stop = () => { audio.current?.pause(); setPlayingKey(null); };

  const choose = (s: Song) => { setChosen(s); setStart(0); play(s, 0); };

  // keep clip looping inside the selected window
  useEffect(() => {
    if (!chosen || !audio.current) return;
    if (pos >= start + Math.min(clipLen, 30) || pos < start - 0.5) { audio.current.currentTime = start; }
  }, [pos, start, clipLen, chosen]);

  const list: Song[] = debounced ? search.data ?? [] : tab === "foryou" ? forYou.data ?? TRACKS : tab === "trending" ? trending.data ?? [] : saved;
  const loading = debounced ? search.isFetching : tab === "foryou" ? forYou.isLoading : tab === "trending" ? trending.isLoading : false;
  const bars = useMemo(() => Array.from({ length: 60 }, (_, i) => 25 + Math.abs(Math.sin(i * 1.7) * 50 + Math.cos(i * 0.6) * 25)), []);
  const previewLen = 30;

  if (chosen) {
    const windowPct = Math.min(1, Math.min(clipLen, previewLen) / previewLen);
    const startPct = start / previewLen;
    const progressPct = Math.max(0, Math.min(1, (pos - start) / Math.min(clipLen, previewLen)));
    return <div className="flex h-full flex-col bg-background animate-in slide-in-from-right duration-300">
      <SheetHeader className="sr-only"><SheetTitle>Edit music</SheetTitle></SheetHeader>
      <div className="flex items-center justify-between px-3 py-3">
        <Button variant="ghost" size="icon" aria-label="Back to songs" onClick={() => { stop(); setChosen(null); }}><ChevronLeft /></Button>
        <p className="font-semibold">Edit music</p>
        <Button variant="ghost" className="font-semibold text-social-action" onClick={() => { stop(); onPick({ title: chosen.title, artist: chosen.artist }); }}>Done</Button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <div className={cn("overflow-hidden rounded-2xl shadow-media transition-transform duration-500", playingKey ? "scale-100" : "scale-95")}>
          <Art song={chosen} size={180} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">{chosen.title}</p>
          <p className="text-sm text-muted-foreground">{chosen.artist}</p>
        </div>
        {kind !== "post" && <div className="flex gap-2">{[15, 30, 60].map((n) => <button key={n} onClick={() => { setClipLen(n); setStart(0); }} className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition", clipLen === n ? "bg-foreground text-background" : "bg-secondary text-muted-foreground")}>{n}s</button>)}</div>}
      </div>
      <div className="space-y-3 px-5 pb-8">
        <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground"><span>{time(start)}</span><span>{clipLen}s clip</span></div>
        <div className="relative h-16 select-none">
          <div className="absolute inset-0 flex items-center gap-[3px]">
            {bars.map((h, i) => <span key={i} className="flex-1 rounded-full bg-muted-foreground/40" style={{ height: `${h}%` }} />)}
          </div>
          <div className="pointer-events-none absolute inset-y-0 rounded-xl border-2 border-foreground bg-foreground/5 transition-[left] duration-150" style={{ left: `${startPct * 100}%`, width: `${windowPct * 100}%` }}>
            <div className="h-full overflow-hidden rounded-[10px]">
              <div className="h-full bg-social-action/30" style={{ width: `${progressPct * 100}%` }} />
            </div>
          </div>
          <input type="range" aria-label="Choose song part" min={0} max={Math.max(0, previewLen - Math.min(clipLen, previewLen))} step={0.5} value={start}
            onChange={(e) => { const v = Number(e.target.value); setStart(v); if (audio.current) audio.current.currentTime = v; }}
            className="absolute inset-0 h-full w-full cursor-grab opacity-0" />
        </div>
        <p className="text-center text-xs text-muted-foreground">Drag to choose the part of the song</p>
        <div className="flex justify-center">
          <Button variant="social" size="icon" className="h-12 w-12 rounded-full" aria-label={playingKey ? "Pause" : "Play"} onClick={() => playingKey ? stop() : play(chosen, start)}>{playingKey ? <Pause /> : <Play />}</Button>
        </div>
      </div>
    </div>;
  }

  return <div className="flex h-full flex-col bg-background">
    <SheetHeader className="sr-only"><SheetTitle>Add music</SheetTitle></SheetHeader>
    <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/40" />
    <div className="px-4 pb-2 pt-4">
      <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input aria-label="Search music" placeholder="Search music" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        {q && <button aria-label="Clear search" onClick={() => setQ("")}><X className="h-4 w-4 text-muted-foreground" /></button>}
      </div>
    </div>
    {!debounced && <div className="flex gap-6 border-b border-border px-5">
      {([["foryou", "For you"], ["trending", "Trending"], ["saved", "Saved"]] as const).map(([id, label]) => (
        <button key={id} onClick={() => setTab(id)} className={cn("relative py-3 text-sm font-semibold transition-colors", tab === id ? "text-foreground" : "text-muted-foreground")}>
          {label}
          <span className={cn("absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground transition-transform duration-300", tab === id ? "scale-x-100" : "scale-x-0")} />
        </button>
      ))}
    </div>}
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {loading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex items-center gap-3 px-2 py-2.5"><span className="h-12 w-12 animate-pulse rounded-md bg-secondary" /><span className="flex-1 space-y-2"><span className="block h-3 w-2/3 animate-pulse rounded bg-secondary" /><span className="block h-3 w-1/3 animate-pulse rounded bg-secondary" /></span></div>)}
      {!loading && list.map((s, i) => {
        const k = keyOf(s); const on = playingKey === k;
        return <div key={k + i} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-secondary/60 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}>
          <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => play(s)} aria-label={`Preview ${s.title}`}>
            <Art song={s} playing={on} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2"><b className="truncate text-sm">{s.title}</b>{value?.title === s.title && <Check className="h-3.5 w-3.5 shrink-0 text-social-action" />}</span>
              <span className="block truncate text-xs text-muted-foreground">{s.artist}{s.duration ? ` · ${time(s.duration)}` : ""}</span>
            </span>
          </button>
          <button aria-label={isSaved(s) ? "Unsave" : "Save"} onClick={() => toggleSave(s)} className="p-2 text-muted-foreground transition active:scale-90"><Bookmark className={cn("h-5 w-5", isSaved(s) && "fill-foreground text-foreground")} /></button>
          <button aria-label={`Use ${s.title}`} onClick={() => choose(s)} className="grid h-8 w-8 place-items-center rounded-full bg-social-action text-social-action-foreground transition active:scale-90"><ChevronLeft className="h-4 w-4 rotate-180" /></button>
        </div>;
      })}
      {!loading && !list.length && <p className="px-4 py-10 text-center text-sm text-muted-foreground">{tab === "saved" && !debounced ? "Songs you save will appear here." : "No songs found."}</p>}
      {debounced && <Button variant="secondary" className="mx-2 mt-2 h-auto w-[calc(100%-1rem)] whitespace-normal" onClick={() => { stop(); onPick({ title: debounced, artist: "Original audio" }); }}>Use “{debounced}” as original audio</Button>}
    </div>
    {value && <Button variant="ghost" className="m-2 text-destructive" onClick={() => { stop(); onPick(null); }}><X className="h-4 w-4" />Remove music</Button>}
  </div>;
}
