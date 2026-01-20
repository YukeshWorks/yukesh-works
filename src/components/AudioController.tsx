import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface AudioControllerProps {
  onBeat?: (intensity: number) => void;
}

const AudioController = ({ onBeat }: AudioControllerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>();
  const lastBeatTimeRef = useRef(0);
  const beatThresholdRef = useRef(0.6);

  // Initialize audio on first user interaction
  const initAudio = useCallback(async () => {
    if (audioContextRef.current) return;

    try {
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      
      // Create analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Create audio element with ambient music URL (royalty-free lofi)
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      
      // Using a royalty-free ambient track
      audioRef.current.src = "https://cdn.pixabay.com/audio/2024/11/29/audio_47aa6890a9.mp3";
      
      audioRef.current.addEventListener('canplaythrough', () => {
        setIsLoaded(true);
      });

      audioRef.current.addEventListener('error', () => {
        console.log('Audio failed to load, using fallback');
        setIsLoaded(true);
      });

      // Connect nodes
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

    } catch (error) {
      console.error('Audio initialization failed:', error);
    }
  }, []);

  // Beat detection
  const detectBeat = useCallback(() => {
    if (!analyserRef.current || !isPlaying) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Focus on bass frequencies (first ~10% of spectrum)
    const bassEnd = Math.floor(bufferLength * 0.1);
    let bassSum = 0;
    for (let i = 0; i < bassEnd; i++) {
      bassSum += dataArray[i];
    }
    const bassAvg = bassSum / bassEnd / 255;

    // Simple beat detection
    const now = Date.now();
    if (bassAvg > beatThresholdRef.current && now - lastBeatTimeRef.current > 200) {
      lastBeatTimeRef.current = now;
      onBeat?.(bassAvg);
    }

    animationFrameRef.current = requestAnimationFrame(detectBeat);
  }, [isPlaying, onBeat]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(detectBeat);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, detectBeat]);

  const togglePlay = async () => {
    await initAudio();
    
    if (!audioRef.current || !audioContextRef.current) return;

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Playback failed:', error);
      }
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <button
      onClick={togglePlay}
      className={`fixed bottom-4 left-4 z-50 w-10 h-10 rounded-full glass flex items-center justify-center transition-all duration-300 hover:scale-110 group ${
        isPlaying ? 'sound-button-playing' : ''
      }`}
      aria-label={isPlaying ? "Mute sound" : "Play sound"}
    >
      {isPlaying ? (
        <Volume2 className="w-4 h-4 text-primary transition-transform duration-300 group-hover:scale-110" />
      ) : (
        <VolumeX className="w-4 h-4 text-muted-foreground transition-transform duration-300 group-hover:text-primary" />
      )}
      
      {/* Sound wave animation when playing */}
      {isPlaying && (
        <div className="absolute inset-0 rounded-full pointer-events-none">
          <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
        </div>
      )}
    </button>
  );
};

export default AudioController;
