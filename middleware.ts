import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const devMock = process.env.DEV_MOCK === "1" && process.env.NODE_ENV !== "production";

export default devMock
  ? () => NextResponse.next()
  : withAuth({ pages: { signIn: "/login" } });

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
