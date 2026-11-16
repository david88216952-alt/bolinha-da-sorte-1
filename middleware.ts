import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Proteger rotas de API Administrativa: /api/admin/:path*
  if (pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("bs_token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Acesso restrito. Apenas administradores podem realizar esta ação." },
        { status: 401 }
      );
    }

    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(payloadStr);
        if (payload.role !== "ADMIN") {
          return NextResponse.json(
            { error: "Acesso restrito. Apenas administradores podem realizar esta ação." },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Acesso restrito. Apenas administradores podem realizar esta ação." },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Acesso restrito. Apenas administradores podem realizar esta ação." },
        { status: 401 }
      );
    }
  }

  // 2. Proteger páginas administrativas: /admin e /admin/:path*
  if (pathname.startsWith("/admin")) {
    // Permitir acesso à tela de login e à tela de acesso negado
    if (pathname === "/admin/login" || pathname === "/admin/acesso-negado") {
      return NextResponse.next();
    }

    const token = request.cookies.get("bs_token")?.value;

    // Se o usuário não está autenticado, redireciona para a tela de login administrativo (/admin/login)
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Se tiver token, prosseguir para o AdminLayout que exibirá o aviso visual de Acesso Negado caso role !== 'ADMIN'
    // garantindo que não haja redirecionamento silencioso conforme a especificação.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
