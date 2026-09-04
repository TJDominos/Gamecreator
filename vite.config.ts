import { defineConfig, type Plugin } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

function mockApiPlugin(): Plugin {
  return {
    name: "mock-api-server",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api")) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        const pathname = url.pathname;
        const method = req.method;

        res.setHeader("Content-Type", "application/json");

        const getBody = async (): Promise<any> => {
          return new Promise((resolve) => {
            let data = "";
            req.on("data", (chunk) => {
              data += chunk;
            });
            req.on("end", () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        if (pathname === "/api/health") {
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: "ok",
              service: "randseed-gamecreator-portal",
              time: new Date().toISOString(),
            }),
          );
        }

        if (pathname === "/api/auth/sso" && method === "POST") {
          const body = await getBody();
          const ssoToken = body?.sso_token || "mock_token";
          const role = ssoToken.includes("admin")
            ? "admin"
            : ssoToken.includes("creator")
            ? "creator"
            : "player";
          const uid = `randseed:usr_${role}`;
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              success: true,
              token: `jwt_mock_${ssoToken}`,
              customToken: `jwt_mock_${ssoToken}`,
              uid,
              user: {
                principal_id: uid,
                role,
                email: `${role}@randseed.org`,
                isEmailVerified: true,
                devNotificationEmail: `${role}@randseed.org`,
                tosAcceptedVersion: "1.0",
                kycStatus: "verified",
                createdAt: Date.now(),
              },
              organization: null,
            }),
          );
        }

        if (pathname === "/api/auth/me" && method === "GET") {
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              success: true,
              user: {
                principal_id: "randseed:usr_creator",
                role: "creator",
                email: "creator@randseed.org",
                isEmailVerified: true,
                devNotificationEmail: "creator@randseed.org",
                tosAcceptedVersion: "1.0",
                kycStatus: "verified",
                createdAt: Date.now(),
              },
              organization: null,
            }),
          );
        }

        if (pathname === "/api/auth/mock-login" && method === "POST") {
          const body = await getBody();
          const role = body?.role || "creator";
          const uid = `randseed:usr_${role}`;
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              success: true,
              token: `jwt_mock_${role}`,
              customToken: `jwt_mock_${role}`,
              uid,
              user: {
                principal_id: uid,
                role,
                email: `${role}@randseed.org`,
                isEmailVerified: true,
                devNotificationEmail: `${role}@randseed.org`,
                tosAcceptedVersion: "1.0",
                kycStatus: "verified",
                createdAt: Date.now(),
              },
              organization: null,
            }),
          );
        }

        if (pathname === "/api/auth/profile" && method === "PUT") {
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              success: true,
              message: "Profile updated successfully",
            }),
          );
        }

        if (pathname === "/api/organizations/my" && method === "GET") {
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              success: true,
              organization: null,
            }),
          );
        }

        if (pathname === "/api/organizations/check-name" && method === "GET") {
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              success: true,
              available: true,
            }),
          );
        }

        if (pathname === "/api/organizations" && method === "POST") {
          const body = await getBody();
          const orgId =
            "RS-ORG-" + Math.random().toString(36).slice(2, 8).toUpperCase();
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              success: true,
              organization: {
                ...body,
                accountId: "randseed:usr_creator",
                organizationId: orgId,
                level: "verified",
                revenueShare: 80,
                platformAccount: "randseed:org",
                status: "approved",
                createdAt: new Date().toISOString(),
              },
            }),
          );
        }

        // Generic fallback for any other API route
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true }));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), mockApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react-router": path.resolve(__dirname, "./node_modules/react-router"),
    },
    dedupe: ["react", "react-dom", "react-router", "react-helmet-async"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router",
      "react-helmet-async",
      "lucide-react",
      "motion/react",
      "motion",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/extension-placeholder",
      "tiptap-markdown",
      "@uiw/react-md-editor",
      "react-markdown",
      "@dfinity/agent",
      "@dfinity/identity",
      "@dfinity/principal",
    ],
    force: true,
  },
  assetsInclude: ["**/*.svg"],
  server: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
