import React from "react";

export const WltLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => {
  return (
    <img 
      src="/Logo.jpg" 
      alt="WLT Logo" 
      className={`${className} object-contain rounded-full bg-white`} 
    />
  );
};
