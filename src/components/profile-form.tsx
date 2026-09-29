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
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
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
      if (fileRef.current) fileRef.current.value = "";
      setStatus("Saved.");
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="mt-8 flex flex-col gap-5">
      <div className="flex items-center gap-4">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-800 text-2xl">
            {(first[0] ?? profile.email?.[0] ?? "?").toUpperCase()}
          </div>
        )}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-neutral-400">Photo</span>
          <input ref={fileRef} type="file" accept="image/*" className="text-sm text-neutral-300" />
        </label>
      </div>
      <Input label="First name" value={first} onChange={setFirst} />
      <Input label="Last name" value={last} onChange={setLast} />
      <Input label="Favorite Columbia joke" value={joke} onChange={setJoke} />
      <div className="flex items-center gap-4">
        <button
          disabled={busy}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
        {status && <p className="text-sm text-neutral-400">{status}</p>}
      </div>
    </form>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-neutral-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-base outline-none focus:border-neutral-500"
      />
    </label>
  );
}
