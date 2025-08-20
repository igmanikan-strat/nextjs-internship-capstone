// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/", 
    "/sign-in", 
    "/sign-up", 
    "/api/webhook/clerk" // ✅ allow Clerk to POST to this route
  ],
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/dashboard(.*)",
    "/projects(.*)",
  ],
};
