const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/DeveloperPortal.tsx', 'utf8');

// I need to fix the Routes part at the end of the file
const badEndIndex = code.indexOf('export default function DeveloperPortal(): React.ReactElement {');
if (badEndIndex !== -1) {
  code = code.substring(0, badEndIndex) + 
`export default function DeveloperPortal(): React.ReactElement {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <RequireSignedIn>
            <PortalShell />
          </RequireSignedIn>
        }
      >
        <Route index element={<Dashboard />} />
        
        <Route path="games/:gameId" element={<GameConsole />}>
          <Route index element={<GameOverview />} />
          <Route path="settings" element={<GameSettings />} />
          <Route path="publish" element={<Publish />} />
          <Route path="deployments" element={<Navigate to="publish" replace />} />
        </Route>

        <Route path="bounties" element={<BountyHub />} />
        <Route path="bounties/:bountyId" element={<BountyDetail />} />
        <Route path="data" element={<PlaceholderPage title="Users & Orders" description="Review anonymous player activity and order history." icon={Users} />} />
        <Route path="revenue" element={<PlaceholderPage title="Revenue" description="Track estimated revenue, ledger entries, and payouts." icon={BarChart3} />} />
        <Route path="settings" element={<CreatorSettings />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}`;
  fs.writeFileSync('src/pages/dashboard/DeveloperPortal.tsx', code);
  console.log("Fixed DeveloperPortal.tsx");
}
