import React from "react";
import { LucideIcon } from "lucide-react";
import "../developer-landing/DeveloperLanding.css";

export interface GameCardProps {
  title: string;
  creator?: string;
  creatorAvatar?: string;
  genre?: string;
  tone?: string;
  icon?: LucideIcon;
  mediaUrl?: string;
  mediaType?: "video" | "image";
  className?: string;
  hideMeta?: boolean;
  children?: React.ReactNode;
}

export function GameCard({
  title,
  creator,
  creatorAvatar,
  genre,
  tone = "violet",
  icon: Icon,
  mediaUrl,
  mediaType,
  className = "",
  hideMeta = false,
  children,
}: GameCardProps): React.ReactElement {
  const hasMedia = mediaUrl && mediaType;

  return (
    <article className={`${className} game-art--${tone}`}>
      {!hasMedia && <div className="game-art-grid" />}
      {!hasMedia && <div className="game-art-orbit" />}
      
      {hasMedia ? (
        <div className="game-card-media">
          {mediaType === "video" ? (
            <video 
              src={mediaUrl} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="game-media-element"
            />
          ) : (
            <img 
              src={mediaUrl} 
              alt={title} 
              className="game-media-element"
            />
          )}
        </div>
      ) : (
        Icon && (
          <div className={`game-art-icon ${className.includes('showcase') ? 'showcase-card__icon' : ''}`}>
            <Icon aria-hidden="true" />
          </div>
        )
      )}
      
      <div className="game-card-shine" />
      
      {!hideMeta && (
        <div className="game-card-meta">
          <div className="game-card-info">
            <h3>{title}</h3>
          </div>
          {creator && (
            <div className="game-card-creator-info">
              {creatorAvatar && <img src={creatorAvatar} alt={creator} className="creator-avatar" />}
              <span className="creator-nickname">{creator}</span>
            </div>
          )}
        </div>
      )}
      {children}
    </article>
  );
}
