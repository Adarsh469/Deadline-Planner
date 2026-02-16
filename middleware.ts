import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(_req: NextRequest) {
    // Only runs for protected routes via matcher.
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: ["/((?!api/auth|_next|favicon.ico).*)"],
};
