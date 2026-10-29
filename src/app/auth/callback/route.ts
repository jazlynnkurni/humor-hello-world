import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google sends the user back here with a ?code. We trade it for a session,
// then send them to onboarding if their name is missing, else to /members.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        /* the signup gate: allowed domains and whitelisted addresses, kept in the admin area */
        const { data: allowed } = await supabase.rpc("signup_allowed", { addr: user.email ?? "" });
        if (allowed === false) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=domain`);
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();
        const complete = Boolean(
          profile?.first_name?.trim() && profile?.last_name?.trim(),
        );
        return NextResponse.redirect(
          `${origin}${complete ? "/members" : "/onboarding"}`,
        );
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
