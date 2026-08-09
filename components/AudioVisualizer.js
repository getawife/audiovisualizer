"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioVisualizer({ file }) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [vizMode, setVizMode] = useState("SPECTRUM");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    if (!file) return;

    const audioUrl = URL.createObjectURL(file);
    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous";
    audio.volume = volume;
    audioRef.current = audio;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audio);
    const analyser = audioCtx.createAnalyser();

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () =>
      setCurrentTime(audio.currentTime),
    );
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.pause();
      audioCtx.close();
      URL.revokeObjectURL(audioUrl);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [file]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      if (!analyserRef.current || !dataArrayRef.current) return;

      const width = canvas.width;
      const height = canvas.height;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      ctx.clearRect(0, 0, width, height);

      if (vizMode === "SPECTRUM") {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArrayRef.current[i] / 255) * (height * 0.65);
          ctx.fillStyle = i % 2 === 0 ? "#FF4500" : "#29292D";
          ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
          x += barWidth;
        }
      } else if (vizMode === "CIRCULAR") {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.2;

        const usableBins = 80;

        ctx.strokeStyle = "#FF4500";
        ctx.lineWidth = 2;

        for (let i = 0; i < usableBins; i++) {
          const angle = (i / usableBins) * Math.PI * 2;
          const amplitude = (dataArrayRef.current[i] / 255) * 80;

          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + amplitude);
          const y2 = centerY + Math.sin(angle) * (radius + amplitude);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    };

    render();
    return () => cancelAnimationFrame(rafRef.current);
  }, [vizMode]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "KeyF") {
        toggleFullscreen();
      } else if (e.code === "KeyM") {
        if (audioRef.current) {
          audioRef.current.muted = !audioRef.current.muted;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60) || 0;
    const s = Math.floor(secs % 60) || 0;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col justify-between h-screen w-screen bg-[#0B0B0D] text-[#F5F5F5] select-none overflow-hidden"
    >
      {!isFullscreen && (
        <header className="flex items-center justify-between px-6 py-3 border-b border-[#29292D] bg-[#0B0B0D] z-20">
          <div className="flex gap-6 text-xs text-[#A1A1AA] font-medium">
            <button className="text-[#F5F5F5]">Visualizer</button>
          </div>

          <div className="flex gap-1 bg-[#121214] p-1 border border-[#29292D]">
            {["SPECTRUM", "CIRCULAR"].map((mode) => (
              <button
                key={mode}
                onClick={() => setVizMode(mode)}
                className={`px-3 py-1 text-[10px] font-mono tracking-wider transition-colors ${
                  vizMode === mode
                    ? "bg-[#FF4500] text-white"
                    : "text-[#A1A1AA] hover:text-[#F5F5F5]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </header>
      )}

      <main className="relative flex-1 flex flex-col w-full">
        <canvas
          ref={canvasRef}
          width={1200}
          height={500}
          className="absolute inset-0 w-full h-full object-center opacity-90"
        />

        <div className="relative z-10 flex items-center gap-4 p-6">
          <div className="w-16 h-16 bg-[#121214] border border-[#29292D] flex items-center justify-center shadow-xl rounded-sm flex-shrink-0">
            <span className="text-[#66666D] font-mono text-[10px]">NO ART</span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#F5F5F5]">
            {file?.name ? file.name.replace(/\.[^/.]+$/, "") : "Untitled Track"}
          </h1>
        </div>
      </main>

      <footer className="w-full bg-[#121214] border-t border-[#29292D] p-4 flex flex-col gap-3 z-20">
        <div className="flex items-center gap-3 text-xs font-mono text-[#A1A1AA] w-full max-w-5xl mx-auto">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-[#29292D] accent-[#FF4500] cursor-pointer"
          />
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between w-full max-w-5xl mx-auto pt-1">
          <div className="flex items-center gap-6">
            <button
              onClick={togglePlay}
              className="w-10 h-10 bg-[#FF4500] hover:bg-[#FF571A] text-white flex items-center justify-center transition-transform active:scale-95"
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#66666D]">VOL</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-[#29292D] accent-[#FF4500] cursor-pointer"
              />
            </div>

            <button
              onClick={toggleFullscreen}
              className="px-2.5 py-1 text-xs font-mono border border-[#29292D] text-[#A1A1AA] hover:text-[#F5F5F5] hover:border-[#66666D] transition-colors"
            >
              [F] FULLSCREEN
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
