"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/profile";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX = 5 * 1024 * 1024;

/**
 * One form for two moments. "edit" is the profile page. "setup" is the step
 * right after a Google sign-in: the same sections, started from what Google
 * sent (photo, first and last name), which the user keeps or changes.
 */
export function ProfileForm({ profile, mode = "edit" }: { profile: Profile; mode?: "edit" | "setup" }) {
  const router = useRouter();
  const setup = mode === "setup";
  const fileRef = useRef<HTMLInputElement>(null);
  const [first, setFirst] = useState(profile.first_name ?? "");
  const [last, setLast] = useState(profile.last_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [joke, setJoke] = useState(profile.favorite_joke ?? "");
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [pick, setPick] = useState<{ url: string; file: File } | null>(null);
  const [removed, setRemoved] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function choose(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!TYPES.includes(f.type)) return setStatus({ kind: "err", text: "That file type won't work. Use JPG, PNG, WebP, or GIF." });
    if (f.size > MAX) return setStatus({ kind: "err", text: "That photo is over 5 MB. Pick a smaller one." });
    setStatus(null);
    setRemoved(false);
    setPick({ url: URL.createObjectURL(f), file: f });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const supabase = createClient();

    let avatar_url = removed ? null : avatar;
    if (pick) {
      // The image goes to Supabase Storage. Only its URL is stored in the table.
      const ext = pick.file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, pick.file, { upsert: true, contentType: pick.file.type });
      if (upErr) {
        setStatus({ kind: "err", text: `Upload failed: ${upErr.message}` });
        setBusy(false);
        return;
      }
      avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: first.trim() || null,
        last_name: last.trim() || null,
        bio: bio.trim() || null,
        favorite_joke: joke.trim() || null,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) setStatus({ kind: "err", text: `Save failed: ${error.message}` });
    else if (setup) {
      router.refresh();
      router.push("/members");
      return;
    } else {
      setAvatar(avatar_url);
      setPick(null);
      setRemoved(false);
      if (fileRef.current) fileRef.current.value = "";
      setStatus({ kind: "ok", text: "Saved." });
      router.refresh();
    }
    setBusy(false);
  }

  const shown = removed ? null : pick?.url ?? avatar;
  const initial = (first.trim()[0] ?? profile.email?.[0] ?? "?").toUpperCase();
  const named = Boolean(first.trim() && last.trim());
  const dirty =
    setup ||
    first !== (profile.first_name ?? "") ||
    last !== (profile.last_name ?? "") ||
    bio !== (profile.bio ?? "") ||
    joke !== (profile.favorite_joke ?? "") ||
    Boolean(pick) ||
    removed;

  return (
    <form onSubmit={save} className="mt-10 flex flex-col">
      {/* ---- photo ---------------------------------------------------------- */}
      <Section title="Photo" hint={setup && shown ? "This one came from Google. Keep it or pick another." : "Shown next to your name on every joke you write."}>
        <div className="flex flex-wrap items-center gap-6">
          <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-paper shadow-[var(--shadow-card)]">
            {shown ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shown} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-jak text-[31px] font-semibold">{initial}</span>
            )}
          </span>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="btn btn-paper cursor-pointer">
                {shown ? "Change photo" : "Upload photo"}
                <input ref={fileRef} type="file" accept={TYPES.join(",")} className="sr-only" onChange={choose} />
              </label>
              {shown && (
                <button
                  type="button"
                  onClick={() => {
                    setPick(null);
                    setRemoved(true);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="btn btn-ghost"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="t-sm text-[color:var(--ink-60)]">JPG, PNG, WebP, or GIF, up to 5 MB.</p>
          </div>
        </div>
      </Section>

      {/* ---- name ----------------------------------------------------------- */}
      <Section title="Name" hint={setup ? "Google suggested these. Your byline can be anything you like." : "Your byline. Both are required to write jokes."}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>First name</span>
            <input value={first} onChange={(e) => setFirst(e.target.value)} className="input" autoComplete="given-name" />
          </label>
          <label className="field">
            <span>Last name</span>
            <input value={last} onChange={(e) => setLast(e.target.value)} className="input" autoComplete="family-name" />
          </label>
        </div>
      </Section>

      {/* ---- about ---------------------------------------------------------- */}
      <Section title="About" hint="Optional. A line about you, and the joke you'd defend.">
        <div className="flex flex-col gap-4">
          <label className="field">
            <span className="flex justify-between">
              <span>Bio</span>
              <span className="tabular-nums text-[color:var(--ink-40)]">{bio.length} / 160</span>
            </span>
            <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))} className="input" rows={2} placeholder="CC '27. Butler basement resident." />
          </label>
          <label className="field">
            <span>Favorite Columbia joke</span>
            <textarea value={joke} onChange={(e) => setJoke(e.target.value)} className="input" rows={2} />
          </label>
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-4 pt-8">
        <button disabled={busy || !dirty || (setup && !named)} className="btn btn-ink">
          {busy ? "Saving…" : setup ? "Continue" : "Save changes"}
        </button>
        {setup && !named && <p className="t-sm text-[color:var(--ink-60)]">Both names are needed to continue.</p>}
        {status && <p className={`t-sm ${status.kind === "err" ? "text-oxblood" : "text-[color:var(--ink-60)]"}`}>{status.text}</p>}
      </div>
    </form>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-[color:var(--ink-12)] py-10 md:grid-cols-[220px_1fr] md:gap-12">
      <div>
        <h2 className="font-jak text-[16px] font-semibold">{title}</h2>
        <p className="t-sm mt-1 text-[color:var(--ink-60)]">{hint}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
