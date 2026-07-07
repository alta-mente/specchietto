// Audio Service using HTML5 Audio element to play and loop the custom notification sound.
// Supports unlocking on user gesture and muting.

let audio = null;
let isMuted = false;
let isInitialized = false;
let isPlaying = false;

const initAudio = () => {
  if (isInitialized) return;
  try {
    if (!audio) {
      const soundUrl = window.location.origin + '/notification_sound.wav';
      audio = new Audio(soundUrl);
      audio.loop = true;
      
      // Fallback loop: some WebView versions ignore the loop property
      audio.addEventListener('ended', () => {
        if (!isMuted && isPlaying && audio) {
          audio.currentTime = 0;
          audio.play().catch(e => console.warn("⚠️ Audio loop fallback failed:", e));
        }
      });
    }
    // Attempt to play and immediately pause to unlock the audio context on webview/browser
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        audio.pause();
        audio.currentTime = 0;
        isInitialized = true;
        console.log("🔊 Audio successfully initialized and unlocked.");
      }).catch(e => {
        console.warn("⚠️ Audio initialization deferred (user gesture required):", e);
      });
    }
  } catch (err) {
    console.warn("⚠️ Failed to initialize Audio:", err);
  }
};

export const audioService = {
  init: () => {
    initAudio();
  },

  startRinging: () => {
    if (isMuted) return;
    if (isPlaying) return; // Prevent restarting if already playing
    try {
      if (!audio) {
        const soundUrl = window.location.origin + '/notification_sound.wav';
        audio = new Audio(soundUrl);
        audio.loop = true;
        
        audio.addEventListener('ended', () => {
          if (!isMuted && isPlaying && audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.warn("⚠️ Audio loop fallback failed:", e));
          }
        });
      }
      
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isPlaying = true;
        }).catch(e => {
          console.warn("⚠️ Audio playback failed:", e);
        });
      } else {
        isPlaying = true;
      }
    } catch (err) {
      console.warn("⚠️ Failed to play audio:", err);
    }
  },

  stopRinging: () => {
    try {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      isPlaying = false;
    } catch (err) {
      console.warn("⚠️ Failed to stop audio:", err);
    }
  },

  setMuted: (muted) => {
    isMuted = muted;
    if (muted) {
      audioService.stopRinging();
    }
  },

  getMuted: () => isMuted
};

