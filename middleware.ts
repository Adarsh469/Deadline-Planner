import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";

const publicRoutes = ["/"];

export default withAuth(
  function middleware(_req: NextRequest) {
    // withAuth handles redirects for protected routes
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (publicRoutes.includes(pathname)) return true;
        if (pathname.startsWith("/api/auth")) return true;
        return !!token;
      },
    },
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
