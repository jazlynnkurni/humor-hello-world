"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/profile";

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [first, setFirst] = useState(profile.first_name ?? "");
  const [last, setLast] = useState(profile.last_name ?? "");
  const [joke, setJoke] = useState(profile.favorite_joke ?? "");
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [pick, setPick] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const supabase = createClient();

    let avatar_url = avatar;
    const file = fileRef.current?.files?.[0];
    if (file) {
      // The image goes to Supabase Storage. Only its URL is stored in the table.
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) {
        setStatus(`Upload failed: ${upErr.message}`);
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
        favorite_joke: joke.trim() || null,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) setStatus(`Save failed: ${error.message}`);
    else {
      setAvatar(avatar_url);
      setPick(null);
      if (fileRef.current) fileRef.current.value = "";
      setStatus("Saved.");
      router.refresh();
    }
    setBusy(false);
  }

  const shown = pick ?? avatar;
  const initial = (first[0] ?? profile.email?.[0] ?? "?").toUpperCase();

  return (
    <form onSubmit={save} className="mt-8 flex flex-col gap-6">
      <div className="flex items-center gap-5">
        <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-plate shadow-[var(--shadow-card)]">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-jak text-[25px] font-semibold">{initial}</span>
          )}
        </span>
        <label className="btn btn-paper cursor-pointer">
          {shown ? "Change photo" : "Add a photo"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPick(f ? URL.createObjectURL(f) : null);
            }}
          />
        </label>
      </div>
      <div className="flex flex-col gap-5">
        <label className="field">
          <span>First name</span>
          <input value={first} onChange={(e) => setFirst(e.target.value)} className="input" />
        </label>
        <label className="field">
          <span>Last name</span>
          <input value={last} onChange={(e) => setLast(e.target.value)} className="input" />
        </label>
        <label className="field">
          <span>Favorite Columbia joke</span>
          <textarea value={joke} onChange={(e) => setJoke(e.target.value)} className="input" rows={3} />
        </label>
        <div className="mt-2 flex items-center gap-4">
          <button disabled={busy} className="btn btn-ink">
            {busy ? "Saving…" : "Save changes"}
          </button>
          {status && <p className="t-sm text-[color:var(--ink-60)]">{status}</p>}
        </div>
      </div>

    </form>
  );
}
