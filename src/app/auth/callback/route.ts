import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// OAuth callback — exchanges `code` param for a session
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/lobby";

  // Always use NEXT_PUBLIC_APP_URL so email/OAuth links from Supabase
  // (which may have localhost baked in) still land on the correct production URL.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${appUrl}${next}`);
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${appUrl}/login?error=auth_callback_failed`);
}
