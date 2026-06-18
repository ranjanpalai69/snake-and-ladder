import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/lobby";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      // Password-recovery token — always land on the reset page regardless of `next`
      if (data.session.user?.recovery_sent_at || next === "/reset-password") {
        return NextResponse.redirect(`${appUrl}/reset-password`);
      }
      return NextResponse.redirect(`${appUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${appUrl}/login?error=auth_callback_failed`);
}
