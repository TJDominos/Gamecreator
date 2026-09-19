import React, { useState } from 'react';
import './VisualNovelSection.css';

export const VisualNovelSection = () => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Immediate Release",
      text: "Your life is about to change. Skip the lengthy review processes. How would you like to release your game?"
    },
    {
      title: "Private Preview",
      text: "Invite a select audience to playtest, gather early reviews, and build your wishlist!"
    },
    {
      title: "Grey Release",
      text: "Roll out to a controlled player base to safely test mechanics, balance, and stability."
    },
    {
      title: "Scale to a Hit",
      text: "Launch globally with confidence and begin monetizing your polished game!"
    }
  ];

  return (
    <section className="vn-section" id="release">
      <div className="vn-background">
        <img src="https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=1920" className="vn-bg-image" alt="Room background" />
      </div>
      
      <div className="vn-character-layer">
        <img 
          src="https://images.unsplash.com/photo-1606122606886-f6c6d0483861?auto=format&fit=crop&q=80&w=800" 
          className="vn-character-sprite" 
          alt="Character" 
          style={{ objectFit: 'cover', objectPosition: 'center top', filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.3))' }}
        />
      </div>

      <div className="vn-ui-layer">
        {step === 0 && (
            <div className="vn-choices">
              <button className="vn-choice-btn" onClick={() => setStep(1)}>1. Private Preview</button>
              <button className="vn-choice-btn" onClick={() => setStep(2)}>2. Grey Release</button>
              <button className="vn-choice-btn" onClick={() => setStep(3)}>3. Scale to a Hit</button>
            </div>
        )}

        <div className="vn-dialogue-wrapper">
          <div className="vn-avatar">
            <div className="vn-avatar-circle">😎</div>
          </div>
          
          <div className="vn-name-plate">
            <span>???</span>
          </div>

          <div className="vn-dialogue-box" onClick={() => { if(step !== 0) setStep(0); }}>
            <div className="vn-text-area">
              <p className="vn-dialogue-text">{steps[step].text}</p>
              {step !== 0 && <p className="vn-dialogue-hint">Click to return...</p>}
            </div>
            
            <div className="vn-decorations">
              <div className="vn-heart vn-heart-1">🤍</div>
              <div className="vn-heart vn-heart-2">💛</div>
              <div className="vn-heart vn-heart-3">🤍</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
