"use client";

import { useRef, useState } from "react";

export default function LandingPage({ onTrackSelect }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (file && file.type.startsWith("audio/")) {
      onTrackSelect(file);
    } else {
      alert("Please upload a valid audio file (MP3, WAV, FLAC, OGG).");
    }
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen w-full bg-[#0B0B0D] text-[#F5F5F5] p-8 select-none">
      <main className="w-full max-w-xl my-auto">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center p-12
            border border-dashed transition-all duration-200 cursor-pointer
            bg-[#121214] ${isDragging ? "border-[#FF4500] bg-[#18181B]" : "border-[#29292D] hover:border-[#66666D]"}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) =>
              e.target.files?.[0] && handleFile(e.target.files[0])
            }
            className="hidden"
          />

          <div className="w-12 h-12 mb-4 flex items-center justify-center border border-[#29292D] text-[#A1A1AA]">
            ↓
          </div>

          <h2 className="text-lg font-medium text-[#F5F5F5] mb-1">
            {isDragging ? "Drop Audio File Here" : "Load Audio File"}
          </h2>
          <p className="text-xs text-[#66666D] font-mono mb-6">
            SUPPORTS MP3, WAV, FLAC, OGG
          </p>

          <button className="px-6 py-2.5 bg-[#FF4500] hover:bg-[#FF571A] text-white text-xs font-semibold uppercase tracking-wider transition-colors">
            Browse Files
          </button>
        </div>
      </main>
    </div>
  );
}
