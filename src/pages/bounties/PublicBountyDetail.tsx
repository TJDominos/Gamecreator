import React from 'react';
import { Routes, Route } from 'react-router';
import { SiteHeader } from '../../components/SiteHeader';
import { BountyDetail } from '../dashboard/bounties/BountyDetail';

export default function PublicBountyDetail(): React.ReactElement {
  return (
    <div className="creator-guide" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <SiteHeader />
      <div style={{ paddingTop: '40px' }}>
        <Routes>
          <Route path="/bounties/:bountyId" element={<BountyDetail />} />
        </Routes>
      </div>
    </div>
  );
}
