const fs = require('fs');
let code = fs.readFileSync('worker/src/routes/auth.ts', 'utf8');
code = code.replace(
`  const body = (await request.json().catch(() => null)) as UpdateProfilePayload | null;
  if (!body) {
    return errorResponse("Invalid body", 400, "INVALID_BODY", request, env);
  }

  const now = Date.now();
  
  // Check withdrawal update limit (once per 30 days)
  const isUpdatingWithdrawal = body.withdrawal_token !== undefined || body.withdrawal_network !== undefined || body.withdrawal_address !== undefined;
  let nextWithdrawalUpdatedAt = authUser.withdrawal_updated_at;

  if (isUpdatingWithdrawal) {
    const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    if (authUser.withdrawal_updated_at) {
      const nextAllowed = authUser.withdrawal_updated_at + ONE_MONTH_MS;`,
`  const body = (await request.json().catch(() => null)) as UpdateProfilePayload | null;
  if (!body) {
    return errorResponse("Invalid body", 400, "INVALID_BODY", request, env);
  }

  const user = await env.DB.prepare("SELECT * FROM users WHERE principal_id = ?").bind(authUser.principal_id).first();
  if (!user) {
    return errorResponse("User not found", 404, "USER_NOT_FOUND", request, env);
  }

  const now = Date.now();
  
  // Check withdrawal update limit (once per 30 days)
  const isUpdatingWithdrawal = body.withdrawal_token !== undefined || body.withdrawal_network !== undefined || body.withdrawal_address !== undefined;
  let nextWithdrawalUpdatedAt = user.withdrawal_updated_at;

  if (isUpdatingWithdrawal) {
    const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    if (user.withdrawal_updated_at) {
      const nextAllowed = user.withdrawal_updated_at + ONE_MONTH_MS;`);
fs.writeFileSync('worker/src/routes/auth.ts', code);
