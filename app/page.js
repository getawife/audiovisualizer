"use client";
import { useState, useEffect } from "react";
import LandingPage from "../components/landingPage.js";
import AudioVisualizer from "../components/AudioVisualizer.js";

export default function MainPage() {
  const [musicFile, setMusicFile] = useState(null);
  const [view, setView] = useState("landing");
  useEffect(() => {
    if (musicFile) {
      console.log("STATE UPDATED: Parent now has the file:", musicFile.name);
    }
  }, [musicFile]);

  const handleFinishedUploading = (file) => {
    console.log("PARENT: handleFinishedUploading triggered!");
    setMusicFile(file);
    setView("visualizer");
  };

  return (
    <main>
      {view === "landing" ? (
        <LandingPage onTrackSelect={handleFinishedUploading} />
      ) : (
        <AudioVisualizer file={musicFile} onBack={() => setView("landing")} />
      )}
    </main>
  );
}
