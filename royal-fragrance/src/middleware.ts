import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const VENDOR_PREFIX = "/vendor";
const ADMIN_PREFIX = "/admin";
const REF_COOKIE = "rf_ref";
const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days — long enough that a
// customer clicking a vendor's link today and checking out next week still
// gets attributed correctly.

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsVendor = path.startsWith(VENDOR_PREFIX);
  const needsAdmin = path.startsWith(ADMIN_PREFIX);

  let response = NextResponse.next({ request: { headers: request.headers } });

  // Affiliate referral capture — cheap (no DB/auth call), runs on every
  // matched request. A vendor's personalized product link looks like
  // /product/oud-noir?ref=VEND-2369; whoever clicks it gets this cookie,
  // and checkout reads it later to attribute the order and commission.
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref) {
    response.cookies.set(REF_COOKIE, ref, {
      maxAge: REF_COOKIE_MAX_AGE,
      path: "/",
    });
  }

  // Only vendor/admin routes need the auth + role check below — skip the
  // Supabase round-trip entirely for every other page.
  if (!needsVendor && !needsAdmin) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  if (needsAdmin && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (needsVendor && role !== "vendor" && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  // Runs on everything except static assets and the service worker, so
  // referral links on product/shop pages are always captured, while still
  // gating /admin and /vendor as before.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js).*)"],
};
