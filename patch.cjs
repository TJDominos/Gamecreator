const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/bounties/BountyDetail.tsx', 'utf8');

const targetLayout = `              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ 
                  background: statusStyle.bg, 
                  color: statusStyle.color, 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '13px', 
                  fontWeight: 600,
                  border: \`1px solid \${statusStyle.color}40\`
                }}>
                  {bounty.state}
                </span>
                <span style={{ color: 'var(--portal-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Target size={14} /> {bounty.category}
                </span>
              </div>
              
              <div className="mb-4 pr-12 relative">
                <h1 className="text-[24px] leading-[30px] text-[var(--portal-ink)] font-bold m-0">{bounty.title}</h1>
                <button 
                  onClick={handleShare}
                  className="absolute -top-1 -right-2 p-2 hover:bg-[var(--portal-border)] rounded-full transition-colors text-[var(--portal-muted)] hover:text-[var(--portal-ink)]"
                  title="Share Bounty"
                >
                  <Share2 size={18} />
                </button>
              </div>`;

const replacementLayout = `              <div className="flex items-center justify-between mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    background: statusStyle.bg, 
                    color: statusStyle.color, 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '13px', 
                    fontWeight: 600,
                    border: \`1px solid \${statusStyle.color}40\`
                  }}>
                    {bounty.state}
                  </span>
                  <span style={{ color: 'var(--portal-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Target size={14} /> {bounty.category}
                  </span>
                </div>
                <button 
                  onClick={handleShare}
                  className="p-[6px] border-[1.5px] border-[var(--portal-ink)] rounded-full hover:bg-[var(--portal-border)] transition-colors text-[var(--portal-ink)]"
                  title="Share Bounty"
                >
                  <Share2 size={16} strokeWidth={2} />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="text-[24px] leading-[32px] text-[var(--portal-ink)] font-bold m-0">{bounty.title}</div>
              </div>`;

if(code.includes(targetLayout)) {
    code = code.replace(targetLayout, replacementLayout);
    fs.writeFileSync('src/pages/dashboard/bounties/BountyDetail.tsx', code);
    console.log("Success");
} else {
    console.log("Failed to find target");
}
