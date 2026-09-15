const fs = require('fs');
let code = fs.readFileSync('worker/src/routes/admin.ts', 'utf8');

if (!code.includes('handleDeleteUser')) {
  // Add route dispatch
  code = code.replace(
    'if (url.pathname === "/api/admin/users" && request.method === "GET") {\n    return handleListUsers(request, env);\n  }',
    'if (url.pathname === "/api/admin/users" && request.method === "GET") {\n    return handleListUsers(request, env);\n  }\n\n  if (url.pathname === "/api/admin/users" && request.method === "DELETE") {\n    return handleDeleteUser(request, env);\n  }'
  );
  
  // Add handler
  code += `\n
async function handleDeleteUser(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser || authUser.role !== "admin") {
    return errorResponse("Admin access required", 403, "FORBIDDEN", request, env);
  }

  const body = (await request.json().catch(() => null)) as { principal_id?: string } | null;
  if (!body || !body.principal_id) {
    return errorResponse("Missing principal_id", 400, "INVALID_BODY", request, env);
  }

  if (body.principal_id === authUser.principal_id) {
    return errorResponse("Cannot delete your own admin account", 400, "INVALID_ACTION", request, env);
  }

  try {
    await env.DB.prepare("DELETE FROM users WHERE principal_id = ?").bind(body.principal_id).run();
    return jsonResponse({ success: true, message: "User deleted" }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "DB_ERROR", request, env);
  }
}
`;
  fs.writeFileSync('worker/src/routes/admin.ts', code);
  console.log("Updated admin.ts");
}
