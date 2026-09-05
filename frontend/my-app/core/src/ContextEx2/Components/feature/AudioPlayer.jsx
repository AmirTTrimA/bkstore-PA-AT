import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "../common/ThemeToggle";
import { ppic14 } from "../../Constants";
import "../../Styles/components/AudioPlayer.css";

export default function AudioPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const book = location.state?.book;

  const audioRef = useRef(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);

  const bookTitle = book?.book_title || "Audiobook Player";
  const bookAuthor = book?.author || book?.publisher_name || "Featured Audiobook";
  const coverImage = book?.cover_image_url || ppic14;
  const audioSource = book?.audio_url || book?.audio_file_path || "/sample-audio.wav";

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Play / Pause toggle
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Audio play prevented:", err);
      });
    }
  }, [isPlaying]);

  // Skip +/- seconds
  const skip = useCallback((seconds) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration || 1000);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // Scrubbing
  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  // Time & Metadata events
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Speed
  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Volume & Mute
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
      audioRef.current.volume = volume > 0 ? volume : 0.5;
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // Browser Speech Synthesis (Narration Mode)
  const toggleNarration = () => {
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }

    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
    } else {
      if (isPlaying) {
        togglePlayPause();
      }
      const textToRead = `${bookTitle}. By ${bookAuthor}. Welcome to your audio library reader. This audiobook is available with your digital content license.`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = playbackRate;
      utterance.onend = () => setIsNarrating(false);
      utterance.onerror = () => setIsNarrating(false);
      window.speechSynthesis.speak(utterance);
      setIsNarrating(true);
    }
  };

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="audio-player-container">
      <div className="audio-player-card">
        {/* Top Header */}
        <div className="audio-top-bar">
          <button
            className="back-to-dash-btn"
            onClick={() => navigate("/dashboard")}
            title="Back to Dashboard"
          >
            ← Dashboard
          </button>
          <span className="player-format-tag">AUDIOBOOK</span>
        </div>

        {/* Cover Art */}
        <div className={`audio-cover-wrapper ${isPlaying ? "playing" : ""}`}>
          <img
            src={coverImage}
            alt={bookTitle}
            className="audio-cover-img"
          />
        </div>

        {/* Track Title */}
        <div className="audio-track-info">
          <h2 className="audio-book-title">{bookTitle}</h2>
          <p className="audio-book-author">{bookAuthor}</p>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={audioSource}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />

        {/* Timeline & Scrubber */}
        <div className="audio-timeline-container">
          <input
            type="range"
            className="audio-progress-bar"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
          />
          <div className="audio-timestamps">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="audio-main-controls">
          <button
            type="button"
            className="audio-control-btn skip-btn"
            onClick={() => skip(-15)}
            title="Rewind 15 seconds"
          >
            -15s
          </button>

          <button
            type="button"
            className="audio-control-btn play-pause-btn"
            onClick={togglePlayPause}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                <rect x="14" y="4" width="4" height="16" rx="1"></rect>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"></path>
              </svg>
            )}
          </button>

          <button
            type="button"
            className="audio-control-btn skip-btn"
            onClick={() => skip(15)}
            title="Fast Forward 15 seconds"
          >
            +15s
          </button>
        </div>

        {/* Secondary Controls (Speed & Volume) */}
        <div className="audio-secondary-controls">
          <div className="speed-selector">
            <span>Speed:</span>
            {[0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                className={`speed-btn ${playbackRate === rate ? "active" : ""}`}
                onClick={() => handleSpeedChange(rate)}
              >
                {rate}x
              </button>
            ))}
          </div>

          <div className="volume-control">
            <button
              type="button"
              className="audio-control-btn"
              onClick={toggleMute}
              style={{ padding: 4 }}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              )}
            </button>
            <input
              type="range"
              className="volume-slider"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
            />
          </div>
        </div>

        {/* Narration Assistant */}
        <div className="narration-box">
          <button
            type="button"
            className={`narration-btn ${isNarrating ? "speaking" : ""}`}
            onClick={toggleNarration}
          >
            {isNarrating ? "⏹ Stop Voice Narration" : "🗣 Read Synopsis via AI Voice"}
          </button>
        </div>

        {/* Footer Theme Toggle */}
        <div className="audio-footer-bar">
          <ThemeToggle page="dash" />
        </div>
      </div>
    </div>
  );
}
