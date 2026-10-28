import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const RUTAS_PUBLICAS = ["/login", "/registro"];

/**
 * Proxy (middleware en Next.js 16):
 *  1. Refresca la sesión de Supabase en cada petición.
 *  2. Redirige a /login si no hay sesión válida.
 *  3. Evita que un usuario ya autenticado vea /login o /registro.
 * La autorización por rol (admin) y el estado de la cuenta se verifican
 * en los layouts del servidor y, de forma definitiva, en la base de datos (RLS/RPC).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esPublica = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r));

  if (!user && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
