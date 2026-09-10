import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { ThemeToggle } from "../common/ThemeToggle";
import { LanguageToggle } from "../common/LanguageToggle";
import { useLanguage } from "../../Context/LanguageContext";
import BookService from "../../Services/BookService";
import { ppic14 } from "../../Constants";
import "../../Styles/components/AudioPlayer.css";

const SLEEP_TIMER_OPTIONS = [0, 15, 30, 45, 60];
const PLAYBACK_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

export default function AudioPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookId } = useParams();
  const { t } = useLanguage();

  const audioRef = useRef(null);
  const lastSavedTimeRef = useRef(0);

  // Book metadata states
  const [book, setBook] = useState(location.state?.book || null);
  const [isLoadingBook, setIsLoadingBook] = useState(!location.state?.book && !!bookId);
  const [bookError, setBookError] = useState(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [resumeNotice, setResumeNotice] = useState("");

  // Sleep timer states
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(0);
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState(0);

  const effectiveBookId = bookId || book?.book_id || book?.id;
  const storageKey = effectiveBookId ? `audio_progress_${effectiveBookId}` : null;

  // Fetch book if navigated directly via /audio/:bookId without state
  useEffect(() => {
    if (!book && bookId) {
      setIsLoadingBook(true);
      setBookError(null);
      BookService.getBookById(bookId)
        .then((data) => {
          const audioFormat = data.formats?.find(
            (f) => f.type === "AUDIO" || f.format_type === "AUDIO"
          );
          setBook({
            id: data.id,
            book_id: data.id,
            book_title: data.title,
            title: data.title,
            author: data.author_name,
            publisher_name: data.publisher_name,
            cover_image_url: data.cover_image_url,
            audio_url: audioFormat?.file_url || "/sample-audio.wav",
          });
        })
        .catch((err) => {
          console.warn("Could not load audiobook details:", err);
          setBookError("Unable to load book details from server. Playing demo audio.");
        })
        .finally(() => {
          setIsLoadingBook(false);
        });
    }
  }, [book, bookId]);

  const bookTitle = book?.book_title || book?.title || "Audiobook Player";
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
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setAudioError(null);
        })
        .catch((err) => {
          console.warn("Audio play prevented:", err);
          setAudioError("Click Play to start audio playback.");
        });
    }
  }, [isPlaying]);

  // Skip +/- seconds
  const skip = useCallback(
    (seconds) => {
      if (!audioRef.current) return;
      const newTime = Math.min(
        Math.max(0, audioRef.current.currentTime + seconds),
        duration || 1000
      );
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (storageKey) {
        localStorage.setItem(storageKey, String(newTime));
      }
    },
    [duration, storageKey]
  );

  // Timeline scrubber
  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
    if (storageKey) {
      localStorage.setItem(storageKey, String(newTime));
    }
  };

  // Time & Metadata events
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const now = audioRef.current.currentTime;
      setCurrentTime(now);

      // Save position to localStorage every 2 seconds
      if (storageKey && Math.abs(now - lastSavedTimeRef.current) > 2) {
        lastSavedTimeRef.current = now;
        localStorage.setItem(storageKey, String(now));
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration || 0;
      setDuration(dur);

      // Restore saved progress if available
      if (storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const pos = parseFloat(saved);
          if (!isNaN(pos) && pos > 2 && pos < dur - 5) {
            audioRef.current.currentTime = pos;
            setCurrentTime(pos);
            setResumeNotice(`Resumed at ${formatTime(pos)}`);
            setTimeout(() => setResumeNotice(""), 3500);
          }
        }
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  const handleAudioError = () => {
    console.warn("Audio loading error on source:", audioSource);
    setAudioError("Unable to stream audio track from server. Playing demo preview.");
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

  // Sleep Timer Handler
  const handleSetSleepTimer = (minutes) => {
    setSleepTimerMinutes(minutes);
    setSleepRemainingSeconds(minutes * 60);
  };

  useEffect(() => {
    let interval = null;
    if (sleepRemainingSeconds > 0 && isPlaying) {
      interval = setInterval(() => {
        setSleepRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (audioRef.current) {
              audioRef.current.pause();
            }
            setIsPlaying(false);
            setSleepTimerMinutes(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sleepRemainingSeconds, isPlaying]);

  // AI Voice Synopsis (SpeechSynthesis)
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
        {/* Top Header Bar */}
        <div className="audio-top-bar">
          <div className="audio-nav-group">
            <button
              type="button"
              className="audio-nav-btn"
              onClick={() => navigate(-1)}
              title={t("common.back", "Go Back")}
            >
              ← {t("common.back", "Back")}
            </button>
            <button
              type="button"
              className="audio-nav-btn"
              onClick={() => navigate("/dashboard")}
              title={t("nav.dashboard", "Back to Dashboard")}
            >
              {t("nav.dashboard", "Dashboard")}
            </button>
            <Link to="/home" className="audio-nav-btn" title={t("reader.store", "Store Home")}>
              {t("reader.store", "Store")}
            </Link>
          </div>
          <span className="player-format-tag">{t("book.audiobook", "AUDIOBOOK")}</span>
        </div>

        {/* Notices */}
        {isLoadingBook && (
          <div className="audio-notice-badge info">
            <span>{t("audio.loadingAudio", "Loading audiobook metadata...")}</span>
          </div>
        )}
        {bookError && (
          <div className="audio-notice-badge warning">
            <span>⚠️ {bookError}</span>
          </div>
        )}
        {audioError && (
          <div className="audio-notice-badge warning">
            <span>⚠️ {audioError}</span>
          </div>
        )}
        {resumeNotice && (
          <div className="audio-notice-badge info">
            <span>🔖 {resumeNotice}</span>
          </div>
        )}

        {/* Cover Art */}
        <div className={`audio-cover-wrapper ${isPlaying ? "playing" : ""}`}>
          <img
            src={coverImage}
            alt={bookTitle}
            className="audio-cover-img"
            onError={(e) => {
              e.currentTarget.src = ppic14;
            }}
          />
        </div>

        {/* Track Title */}
        <div className="audio-track-info">
          <h2 className="audio-book-title">{bookTitle}</h2>
          <p className="audio-book-author">{bookAuthor}</p>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audioSource}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleAudioError}
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
            aria-label="Audio timeline"
          />
          <div className="audio-timestamps">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls: -15s, Play/Pause, +15s */}
        <div className="audio-main-controls">
          <button
            type="button"
            className="audio-control-btn skip-btn"
            onClick={() => skip(-15)}
            title={t("audio.skip15Back", "Rewind 15 seconds")}
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
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="audio-control-btn skip-btn"
            onClick={() => skip(15)}
            title={t("audio.skip15Forward", "Fast Forward 15 seconds")}
          >
            +15s
          </button>
        </div>

        {/* Secondary Controls: Speed, Sleep Timer & Volume */}
        <div className="audio-secondary-controls">
          {/* Speed Selector */}
          <div className="speed-selector">
            <span className="control-label">{t("audio.speed", "Speed:")}</span>
            {PLAYBACK_SPEED_OPTIONS.map((rate) => (
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

          {/* Sleep Timer */}
          <div className="sleep-timer-selector">
            <span className="control-label" title={t("audio.sleepTimer", "Sleep Timer")}>
              🌙 {t("audio.sleepTimer", "Sleep:")}
            </span>
            {SLEEP_TIMER_OPTIONS.map((min) => (
              <button
                key={min}
                type="button"
                className={`sleep-btn ${sleepTimerMinutes === min ? "active" : ""}`}
                onClick={() => handleSetSleepTimer(min)}
                title={min === 0 ? "Turn sleep timer off" : `Pause playback after ${min} mins`}
              >
                {min === 0 ? t("audio.off", "Off") : t("audio.mins", `${min}m`, { count: min })}
              </button>
            ))}
            {sleepRemainingSeconds > 0 && (
              <span className="sleep-countdown" title="Time remaining until audio pauses">
                ({formatTime(sleepRemainingSeconds)})
              </span>
            )}
          </div>

          {/* Volume Control */}
          <div className="volume-control">
            <button
              type="button"
              className="audio-control-btn vol-btn"
              onClick={toggleMute}
              title={isMuted ? t("audio.unmute", "Unmute") : t("audio.mute", "Mute")}
            >
              {isMuted || volume === 0 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
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
              aria-label="Volume slider"
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
            {isNarrating ? t("audio.aiNarrationStop", "⏹ Stop Voice Narration") : t("audio.aiNarrationStart", "🗣 Read Synopsis via AI Voice")}
          </button>
        </div>

        {/* Footer Controls */}
        <div className="audio-footer-bar" style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <LanguageToggle page="dash" />
          <ThemeToggle page="dash" />
        </div>
      </div>
    </div>
  );
}
