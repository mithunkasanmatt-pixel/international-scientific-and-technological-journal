'use client';

import React from 'react';
import Image from 'next/image';

export function BookLoader() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Premium Circular Logo Loader Container */}
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Outer Pulsing Glow */}
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse duration-1500" />
        
        {/* Rotating Circular Ring */}
        <div className="absolute inset-0.5 rounded-full border-[3px] border-transparent border-t-primary border-r-primary/30 animate-spin" />
        
        {/* Inner Counter-Rotating Ring */}
        <div className="absolute inset-2.5 rounded-full border-[3px] border-transparent border-b-primary/50 border-l-primary/10 animate-spin-reverse" />
        
        {/* Central Logo Wrapper */}
        <div className="relative w-14 h-14 flex items-center justify-center bg-card rounded-full shadow-inner p-1.5 z-10 border border-border/50">
          <Image
            src="/logo.png"
            alt="Loading Logo"
            width={45}
            height={45}
            className="object-contain"
            priority
          />
        </div>
      </div>
      
      <p className="text-[11px] font-black tracking-widest text-primary uppercase animate-pulse">
        Loading...
      </p>
    </div>
  );
}
