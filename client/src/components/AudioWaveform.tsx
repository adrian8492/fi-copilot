import { useRef, useEffect, useState, useCallback } from "react";

interface AudioWaveformProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  height?: number;
}

export default function AudioWaveform({
  audioUrl,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  height = 48,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverX, setHoverX] = useState(0);

  // Decode audio and extract waveform peaks
  useEffect(() => {
    if (!audioUrl) return;
    const audioContext = new AudioContext();
    fetch(audioUrl)
      .then((res) => res.arrayBuffer())
      .then((buffer) => audioContext.decodeAudioData(buffer))
      .then((audioBuffer) => {
        const rawData = audioBuffer.getChannelData(0);
        const samples = 200; // Number of bars
        const blockSize = Math.floor(rawData.length / samples);
        const peaks: number[] = [];
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j]);
          }
          peaks.push(sum / blockSize);
        }
        // Normalize
        const max = Math.max(...peaks);
        const normalized = peaks.map((p) => (max > 0 ? p / max : 0));
        setWaveformData(normalized);
        audioContext.close();
      })
      .catch(() => {
        // Generate placeholder waveform if decode fails
        const placeholder = Array.from({ length: 200 }, () => 0.1 + Math.random() * 0.6);
        setWaveformData(placeholder);
      });
  }, [audioUrl]);

  // Track container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    setContainerWidth(container.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Draw waveform
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0 || containerWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, containerWidth, height);

    const barCount = waveformData.length;
    const barWidth = containerWidth / barCount;
    const gap = Math.max(1, barWidth * 0.2);
    const actualBarWidth = barWidth - gap;
    const progressPct = duration > 0 ? currentTime / duration : 0;
    const progressX = progressPct * containerWidth;

    for (let i = 0; i < barCount; i++) {
      const x = i * barWidth + gap / 2;
      const barHeight = Math.max(2, waveformData[i] * (height - 4));
      const y = (height - barHeight) / 2;

      // Color based on played position
      if (x + actualBarWidth <= progressX) {
        // Played
        ctx.fillStyle = "oklch(0.65 0.15 250)"; // primary blue
      } else if (x <= progressX) {
        // Partially played
        const gradient = ctx.createLinearGradient(x, 0, x + actualBarWidth, 0);
        gradient.addColorStop(0, "oklch(0.65 0.15 250)");
        gradient.addColorStop(1, "oklch(0.35 0.03 250)");
        ctx.fillStyle = gradient;
      } else {
        // Unplayed
        ctx.fillStyle = "oklch(0.35 0.03 250)";
      }

      // Hover highlight
      if (isHovering) {
        const hoverPct = hoverX / containerWidth;
        const hoverProgress = hoverPct * containerWidth;
        if (x <= hoverProgress && x + actualBarWidth > progressX) {
          ctx.fillStyle = "oklch(0.55 0.10 250)";
        }
      }

      ctx.beginPath();
      ctx.roundRect(x, y, actualBarWidth, barHeight, 1);
      ctx.fill();
    }

    // Playhead line
    if (duration > 0) {
      ctx.strokeStyle = "oklch(0.85 0.15 250)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(progressX, 2);
      ctx.lineTo(progressX, height - 2);
      ctx.stroke();
    }
  }, [waveformData, containerWidth, height, currentTime, duration, isHovering, hoverX]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onSeek(pct * duration);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHoverX(e.clientX - rect.left);
  };

  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer rounded-lg overflow-hidden"
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: `${height}px` }}
        className="block"
      />
      {isHovering && containerRef.current && duration > 0 && (
        <div
          className="absolute top-0 bg-primary/20 h-full pointer-events-none"
          style={{
            left: 0,
            width: `${(hoverX / containerWidth) * 100}%`,
          }}
        />
      )}
    </div>
  );
}
