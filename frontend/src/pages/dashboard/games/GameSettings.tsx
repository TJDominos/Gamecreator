import React, { useState } from "react";
import { Lock, Trash2, Archive } from "lucide-react";
import { useOutletContext, useNavigate, useParams } from "react-router";
import { GameStatus } from "./GameConsole";
import { getGameById, deleteGame, updateGame } from "./gameData";

export function GameSettings(): React.ReactElement {
  const { status, setStatus } = useOutletContext<{ status: GameStatus, setStatus: (s: GameStatus) => void }>();
  const { gameId } = useParams();
  const navigate = useNavigate();
  const game = getGameById(gameId || 'g_101');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const canHardDelete = ['DRAFT', 'DEVELOPMENT'].includes(status);
  const canArchive = ['PRIVATE_TESTING', 'REJECTED', 'APPROVED', 'MAINTENANCE'].includes(status);

  return (
    <div style={{ maxWidth: '720px' }}>
      
      <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#e53e3e' }}>Danger Zone</h2>
      <p style={{ color: 'var(--portal-muted)', fontSize: '14px', marginBottom: '24px' }}>
        Destructive actions and visibility controls, governed by the game's current status.
      </p>

      <div style={{ background: '#fff', border: '1px solid #fed7d7', borderRadius: '12px', overflow: 'hidden' }}>
        {canHardDelete ? (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e53e3e' }}>
                <Trash2 size={16} /> Hard Delete Game
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--portal-muted)' }}>Permanently remove this game. Available because status is {status}.</p>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)} 
              style={{ padding: '8px 16px', background: '#e53e3e', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              Hard Delete
            </button>
          </div>
        ) : (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: canArchive ? '#e53e3e' : 'var(--portal-muted)' }}>
                <Archive size={16} /> Archive / Delist Game
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--portal-muted)', maxWidth: '400px' }}>
                {status === 'PENDING_REVIEW' ? 'Action locked. You must withdraw from review before archiving.' :
                 status === 'PUBLIC_ACTIVE' ? 'Action locked. Game must enter Maintenance mode before it can be archived.' :
                 status === 'ARCHIVED' ? 'Game is already delisted and archived. The game name remains reserved and is not released.' :
                 'Delist this game from Randseed. The game name remains reserved and is not released. Existing sandbox links are invalidated.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {status === 'PENDING_REVIEW' && (
                 <button onClick={() => {
                   if (gameId) updateGame(gameId, { status: 'DEVELOPMENT' });
                   setStatus('DEVELOPMENT');
                 }} style={{ padding: '8px 16px', background: '#f59e0b', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Withdraw Review</button>
              )}
              {status === 'PUBLIC_ACTIVE' && (
                 <button onClick={() => {
                   if (gameId) updateGame(gameId, { status: 'MAINTENANCE' });
                   setStatus('MAINTENANCE');
                 }} style={{ padding: '8px 16px', background: '#f59e0b', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Enter Maintenance</button>
              )}
              <button 
                onClick={() => {
                  if (gameId) updateGame(gameId, { status: 'ARCHIVED' });
                  setStatus('ARCHIVED');
                }}
                disabled={!canArchive} 
                style={{ 
                  padding: '8px 16px', 
                  background: canArchive ? 'transparent' : '#f2f0f3', 
                  border: canArchive ? '1px solid #e53e3e' : '1px solid transparent', 
                  color: canArchive ? '#e53e3e' : 'var(--portal-muted)', 
                  borderRadius: '8px', 
                  fontWeight: 600, 
                  cursor: canArchive ? 'pointer' : 'not-allowed' 
                }}>Archive Game</button>
            </div>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#ef4444' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
              Permanently Delete Game?
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
              This action cannot be undone. All data, settings, and release history will be wiped.
            </p>
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '8px', fontWeight: 500 }}>
                Type <strong>{game?.name}</strong> to confirm:
              </label>
              <input 
                type="text" 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={game?.name}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={isDeleting}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'transparent', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: isDeleting ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (gameId && !isDeleting && deleteConfirmText === game?.name) {
                    setIsDeleting(true);
                    await deleteGame(gameId);
                    navigate("/dashboard");
                  }
                }}
                disabled={isDeleting || deleteConfirmText !== game?.name}
                style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: (isDeleting || deleteConfirmText !== game?.name) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: (isDeleting || deleteConfirmText !== game?.name) ? 0.5 : 1 }}
              >
                {isDeleting ? "Deleting..." : "Yes, Hard Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

