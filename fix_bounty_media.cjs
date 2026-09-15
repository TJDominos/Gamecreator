const fs = require('fs');
let code = fs.readFileSync('worker/src/routes/bounties.ts', 'utf8');

if (!code.includes('/api/admin/bounties/media')) {
  // Add route dispatch
  code = code.replace(
    'if (url.pathname.startsWith("/api/admin/bounties/") && request.method === "DELETE") {\n    return handleDeleteBounty(request, env);\n  }',
    'if (url.pathname.startsWith("/api/admin/bounties/") && request.method === "DELETE") {\n    return handleDeleteBounty(request, env);\n  }\n  if (url.pathname === "/api/admin/bounties/media" && request.method === "PUT") {\n    return handleUploadMedia(request, env);\n  }'
  );
  
  // Add handler
  code += `\n
async function handleUploadMedia(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser || authUser.role !== "admin") {
    return errorResponse("Admin access required", 403, "FORBIDDEN", request, env);
  }

  const contentType = request.headers.get("content-type") || "";

  try {
    let fileBuffer: ArrayBuffer;
    let mimeType = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return errorResponse("No file uploaded", 400, "MISSING_FILE", request, env);
      }

      fileBuffer = await file.arrayBuffer();
      mimeType = file.type;
    } else {
      fileBuffer = await request.arrayBuffer();
      mimeType = contentType;
    }

    if (!mimeType.startsWith("image/") && mimeType !== "video/mp4") {
      return errorResponse("Unsupported file type", 400, "INVALID_FILE", request, env);
    }

    if (fileBuffer.byteLength > 10 * 1024 * 1024) { // 10MB limit
      return errorResponse("File too large", 400, "FILE_TOO_LARGE", request, env);
    }

    const fileHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", fileBuffer)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 16);
    const ext = mimeType === "video/mp4" ? "mp4" : mimeType.split("/")[1] || "png";
    const objectKey = \`bounties/media_\${fileHash}.\${ext}\`;

    await env.R2.put(objectKey, fileBuffer, {
      httpMetadata: { contentType: mimeType },
    });

    const publicUrl = env.STORAGE_PUBLIC_URL 
      ? \`\${env.STORAGE_PUBLIC_URL}/\${objectKey}\` 
      : \`/\${objectKey}\`;

    return jsonResponse({ success: true, url: publicUrl }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "UPLOAD_FAILED", request, env);
  }
}
`;
  fs.writeFileSync('worker/src/routes/bounties.ts', code);
  console.log("Updated bounties.ts");
}
