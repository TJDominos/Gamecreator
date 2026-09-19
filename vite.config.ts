import { defineConfig, type Plugin } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

function mockApiPlugin(): Plugin {
  let devGames: any[] = [
    {
      id: "g_101",
      name: "Neon Dash",
      status: "PUBLIC_ACTIVE",
      version: "v1.2.0",
      players: "1,204",
      visitors: "2,500",
      revenue: "$342.00",
      availableBalance: "$120.00",
      escrowedBalance: "$50.00",
      profile: {
        description:
          "A fast-paced neon cyberpunk platformer with dynamic synthwave music and procedural level generation. Avoid high-voltage hazards, chain momentum leaps, and climb global leaderboards.",
        coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
        animationUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        savedAt: "2026-03-01T12:00:00.000Z",
      },
    },
    {
      id: "g_102",
      name: "Space Miner",
      status: "DEVELOPMENT",
      version: "---",
      players: "12",
      visitors: "20",
      revenue: "$0.00",
      availableBalance: "$45.50",
      escrowedBalance: "$0.00",
      profile: {
        description:
          "Deep space extraction simulator with realistic laser drilling physics and galactic trade economy. Manage asteroid claim permits and defend mining rigs.",
        coverImage: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&auto=format&fit=crop&q=80",
        animationUrl: "",
        savedAt: "2026-03-05T15:30:00.000Z",
      },
    },
    {
      id: "g_999",
      name: "Cosmic Wars",
      status: "PENDING_REVIEW",
      version: "---",
      players: "42",
      visitors: "100",
      revenue: "$0.00",
      availableBalance: "$0.00",
      escrowedBalance: "$0.00",
      profile: {
        description:
          "Tactical multiplayer fleet battle game built on decentralized state channels. Deploy dreadnoughts, capture hyperlanes, and outsmart opposing commanders.",
        coverImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80",
        animationUrl: "",
        savedAt: "2026-03-08T09:15:00.000Z",
      },
    },
  ];

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
          let role = "creator";
          let uid = "randseed:usr_creator";
          let email = "creator@randseed.org";
          let isEmailVerified = true;

          try {
            const decoded = JSON.parse(Buffer.from(ssoToken, "base64").toString("utf-8"));
            if (decoded && decoded.payload) {
              uid = decoded.payload.principal_id || uid;
              email = decoded.payload.email || email;
              isEmailVerified = decoded.payload.is_email_verified ?? true;
            }
          } catch {
            role = ssoToken.includes("admin")
              ? "admin"
              : ssoToken.includes("creator")
              ? "creator"
              : "player";
            uid = `randseed:usr_${role}`;
            email = `${role}@randseed.org`;
          }

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
                email,
                isEmailVerified,
                devNotificationEmail: email,
                tosAcceptedVersion: "1.0",
                kycStatus: "verified",
                createdAt: Date.now(),
              },
              organization: null,
            }),
          );
        }

        if (pathname === "/api/auth/me" && method === "GET") {
          const authHeader = req.headers["authorization"] || "";
          if (!authHeader.startsWith("Bearer ") || authHeader.includes("undefined") || authHeader.includes("null")) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: "Unauthorized" }));
          }

          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              success: true,
              token: authHeader.substring(7).trim(),
              user: {
                principal_id: "randseed:usr_creator",
                role: "creator",
                email: "creator@randseed.org",
                isEmailVerified: true,
                tosAcceptedVersion: "1.0",
                kycStatus: "verified",
                lastLoginAt: Date.now(),
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

        // --- Games Backend API ---
        if (pathname === "/api/games") {
          if (method === "GET") {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, games: devGames }));
          }
          if (method === "POST") {
            const body = await getBody();
            let gameName = body?.name?.trim();
            if (!gameName) {
              const existingNames = new Set(devGames.map((g: any) => g.name.trim().toLowerCase()));
              if (!existingNames.has("new game")) {
                gameName = "new game";
              } else {
                let maxNum = 1;
                for (const n of existingNames) {
                  const m = (n as string).match(/^new\s*game\s*(\d+)$/i);
                  if (m) {
                    const num = parseInt(m[1], 10);
                    if (num > maxNum) maxNum = num;
                  }
                }
                gameName = `new game${maxNum + 1}`;
              }
            }

            const id = body?.id || `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
            const newGame = {
              id,
              name: gameName,
              status: "DRAFT",
              version: "---", // Bound to deployment pipeline
              players: "---",
              visitors: "---",
              revenue: "---",
              availableBalance: "---",
              escrowedBalance: "---",
              createdAt: Date.now(),
              profile: {
                description: "",
                coverImage: "",
                animationUrl: "",
              },
            };

            devGames.unshift(newGame);
            res.statusCode = 201;
            return res.end(JSON.stringify({ success: true, game: newGame }));
          }
        }

        const gameDetailMatch = pathname.match(/^\/api\/games\/([^/]+)(\/.*)?$/);
        if (gameDetailMatch) {
          const gameId = decodeURIComponent(gameDetailMatch[1]);
          const sub = gameDetailMatch[2] || "";

          // Media upload endpoint: POST /api/games/:gameId/media-upload
          if (sub === "/media-upload" && method === "POST") {
            const chunks: Buffer[] = [];
            req.on("data", (chunk) => chunks.push(chunk));
            await new Promise((r) => req.on("end", r));
            const buffer = Buffer.concat(chunks);
            const contentType = req.headers["content-type"] || "";
            const isAnimation =
              contentType.includes("mp4") ||
              contentType.includes("video") ||
              buffer.toString().includes('name="type"\r\n\r\nanimation');

            const maxBytes = isAnimation ? 10 * 1024 * 1024 : 1 * 1024 * 1024;
            if (buffer.length > maxBytes) {
              res.statusCode = 413;
              return res.end(
                JSON.stringify({
                  success: false,
                  error: `File size exceeds ${isAnimation ? "10 MB" : "1 MB"} limit.`,
                }),
              );
            }

            // Extract or create media URL
            const ext = isAnimation ? "mp4" : "png";
            const filename = `media_${Date.now()}.${ext}`;
            const mockUrl = isAnimation
              ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              : `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80`;

            res.statusCode = 200;
            return res.end(
              JSON.stringify({
                success: true,
                url: mockUrl,
                key: `games/${gameId}/media/${filename}`,
                size: buffer.length,
              }),
            );
          }

          const existingIndex = devGames.findIndex((g: any) => g.id === gameId);

          if (sub === "" && method === "GET") {
            if (existingIndex === -1) {
              res.statusCode = 404;
              return res.end(JSON.stringify({ success: false, error: "Game not found" }));
            }
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, game: devGames[existingIndex] }));
          }

          if (sub === "" && method === "PUT") {
            if (existingIndex === -1) {
              res.statusCode = 404;
              return res.end(JSON.stringify({ success: false, error: "Game not found" }));
            }
            const body = await getBody();
            const cur = devGames[existingIndex];
            const updated = {
              ...cur,
              name: body?.name?.trim() || cur.name,
              status: body?.status || cur.status,
              displayVersion: body?.displayVersion !== undefined ? body.displayVersion : (body?.profile?.displayVersion !== undefined ? body.profile.displayVersion : cur.displayVersion),
              profile: body?.profile
                ? {
                    description: body.profile.description ?? cur.profile?.description ?? "",
                    coverImage: body.profile.coverImage ?? cur.profile?.coverImage ?? "",
                    animationUrl: body.profile.animationUrl ?? cur.profile?.animationUrl ?? "",
                    savedAt: new Date().toISOString(),
                    displayVersion: body.profile.displayVersion ?? body?.displayVersion ?? cur.profile?.displayVersion ?? cur.displayVersion ?? "",
                  }
                : cur.profile,
            };
            devGames[existingIndex] = updated;
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, game: updated }));
          }

          if (sub === "" && method === "DELETE") {
            devGames = devGames.filter((g: any) => g.id !== gameId);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, message: "Game deleted" }));
          }
        }

        // Generic fallback for any other API route
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true }));
      });
    },
  };
}

export default defineConfig({
  plugins: [mockApiPlugin(), react(), tailwindcss()],
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
