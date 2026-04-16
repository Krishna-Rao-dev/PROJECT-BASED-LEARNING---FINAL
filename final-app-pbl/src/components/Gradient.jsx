import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";

// 🎨 COLOR CONFIGURATION - Easy to change!
const COLORS = {
  primary: "#8B5CF6", // Vibrant blue
  secondary: "#FFFFFF", // Cyan
  accent: "#8B5CF6", // Purple
  highlight: "#8B5CF6", // Pink
  background: "#000000", // Black background
};

const Gradient = () => {
  const canvasRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState(true);
  
  const recognitionRef = useRef(null);
  const animationRef = useRef();
  const blobsRef = useRef([]);
  const audioAnalyzerRef = useRef(null);
  const audioContextRef = useRef(null);
  const speakingTimeRef = useRef(0);
  const currentCircleRadiusRef = useRef(120); // For smooth animation

  // Initialize gradient blobs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    blobsRef.current = [
      {
        x: centerX,
        y: centerY,
        radius: 80,
        color: COLORS.primary,
        vx: 0,
        vy: 0,
        targetX: centerX,
        targetY: centerY,
        pulsePhase: 0,
        pulseSpeed: 0.02,
        orbitRadius: 40,
        orbitAngle: 0,
        orbitSpeed: 0.015,
      },
      {
        x: centerX + 50,
        y: centerY - 30,
        radius: 60,
        color: COLORS.secondary,
        vx: 0,
        vy: 0,
        targetX: centerX + 50,
        targetY: centerY - 30,
        pulsePhase: Math.PI / 2,
        pulseSpeed: 0.025,
        orbitRadius: 50,
        orbitAngle: Math.PI / 2,
        orbitSpeed: 0.012,
      },
      {
        x: centerX - 40,
        y: centerY + 20,
        radius: 70,
        color: COLORS.accent,
        vx: 0,
        vy: 0,
        targetX: centerX - 40,
        targetY: centerY + 20,
        pulsePhase: Math.PI,
        pulseSpeed: 0.018,
        orbitRadius: 45,
        orbitAngle: Math.PI,
        orbitSpeed: 0.018,
      },
      {
        x: centerX + 30,
        y: centerY + 40,
        radius: 50,
        color: COLORS.highlight,
        vx: 0,
        vy: 0,
        targetX: centerX + 30,
        targetY: centerY + 40,
        pulsePhase: Math.PI * 1.5,
        pulseSpeed: 0.022,
        orbitRadius: 35,
        orbitAngle: Math.PI * 1.5,
        orbitSpeed: 0.02,
      },
    ];
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Dynamic circle sizes for different states
    const idleRadius = 120;
    const listeningRadius = 135;
    const speakingRadius = 150;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fill with background color
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Determine target radius based on state
      let targetRadius = idleRadius;
      if (isSpeaking) {
        const time = Date.now() * 0.001;
        const pulse = Math.sin(time * 4) * 0.5 + 0.5;
        targetRadius = speakingRadius + pulse * 10;
      } else if (isListening) {
        targetRadius = listeningRadius;
      }

      // Smoothly animate to target radius
      currentCircleRadiusRef.current +=
        (targetRadius - currentCircleRadiusRef.current) * 0.1;

      // Save the context state
      ctx.save();

      // Create circular clipping path to contain all gradients
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        currentCircleRadiusRef.current,
        0,
        Math.PI * 2
      );
      ctx.clip();

      // Get audio data if speaking
      let audioIntensity = 0;
      if (isSpeaking && audioAnalyzerRef.current) {
        const dataArray = new Uint8Array(
          audioAnalyzerRef.current.frequencyBinCount
        );
        audioAnalyzerRef.current.getByteFrequencyData(dataArray);
        const average =
          dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        audioIntensity = average / 255;
      }

      blobsRef.current.forEach((blob, index) => {
        // Update pulse phase
        blob.pulsePhase += blob.pulseSpeed;

        if (isSpeaking) {
          // Speaking: circular orbit with dramatic audio-reactive movement
          const time = Date.now() * 0.001;
          // Simulate audio intensity with wave patterns
          const simAudioIntensity =
            (Math.sin(time * 3 + index) * 0.5 + 0.5) *
            (Math.cos(time * 5 + index * 2) * 0.3 + 0.7);

          // Update orbit angle (rotating around the circle)
          blob.orbitAngle += blob.orbitSpeed;

          // Calculate orbit position with audio-reactive expansion
          const expandedOrbit =
            blob.orbitRadius * (1 + simAudioIntensity * 0.8);
          blob.targetX =
            centerX + Math.cos(blob.orbitAngle) * expandedOrbit;
          blob.targetY =
            centerY + Math.sin(blob.orbitAngle) * expandedOrbit;

          // Increase radius during speaking
          const radiusBoost = 1 + simAudioIntensity * 0.6;
          const currentRadius = blob.radius * radiusBoost;

          // Smooth movement
          blob.x += (blob.targetX - blob.x) * 0.15;
          blob.y += (blob.targetY - blob.y) * 0.15;

          // Draw blob with audio-reactive size
          const gradient = ctx.createRadialGradient(
            blob.x,
            blob.y,
            0,
            blob.x,
            blob.y,
            currentRadius
          );
          gradient.addColorStop(0, blob.color + "CC");
          gradient.addColorStop(0.5, blob.color + "66");
          gradient.addColorStop(1, blob.color + "00");

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (isListening) {
          // Listening: gentle circular orbit
          blob.orbitAngle += blob.orbitSpeed * 0.5;

          const distance =
            blob.orbitRadius * 0.6 +
            Math.sin(blob.pulsePhase * 2) * 8;
          blob.targetX =
            centerX + Math.cos(blob.orbitAngle) * distance;
          blob.targetY =
            centerY + Math.sin(blob.orbitAngle) * distance;

          blob.x += (blob.targetX - blob.x) * 0.1;
          blob.y += (blob.targetY - blob.y) * 0.1;

          const gradient = ctx.createRadialGradient(
            blob.x,
            blob.y,
            0,
            blob.x,
            blob.y,
            blob.radius
          );
          gradient.addColorStop(0, blob.color + "CC");
          gradient.addColorStop(0.5, blob.color + "66");
          gradient.addColorStop(1, blob.color + "00");

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          // Idle: very subtle circular orbit
          blob.orbitAngle += blob.orbitSpeed * 0.3;

          const distance =
            blob.orbitRadius * 0.4 +
            Math.sin(blob.pulsePhase) * 5;
          blob.targetX =
            centerX + Math.cos(blob.orbitAngle) * distance;
          blob.targetY =
            centerY + Math.sin(blob.orbitAngle) * distance;

          blob.x += (blob.targetX - blob.x) * 0.05;
          blob.y += (blob.targetY - blob.y) * 0.05;

          const gradient = ctx.createRadialGradient(
            blob.x,
            blob.y,
            0,
            blob.x,
            blob.y,
            blob.radius
          );
          gradient.addColorStop(0, blob.color + "BB");
          gradient.addColorStop(0.5, blob.color + "55");
          gradient.addColorStop(1, blob.color + "00");

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      });

      // Apply blur for smooth gradient mesh effect
      ctx.filter = "blur(40px)";
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = "none";

      // Restore context to remove clipping
      ctx.restore();

      // Draw the visible circle border with subtle shadow
      ctx.save();

      // Outer shadow
      ctx.shadowColor = "rgba(139, 92, 246, 0.4)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw circle border
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        currentCircleRadiusRef.current,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isSpeaking]);

  // Initialize speech recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");
        setTranscript(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        if (event.error === "not-allowed") {
          setError(
            "Microphone access denied. Please allow microphone access in your browser settings."
          );
        } else if (event.error === "no-speech") {
          setError("No speech detected. Please try again.");
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }

        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechRecognitionAvailable(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!speechRecognitionAvailable) {
        setError("Speech recognition is not available in your browser.");
        return;
      }

      setError("");
      setTranscript("");
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        setError(
          "Failed to start speech recognition. Please check your microphone permissions."
        );
        console.error("Error starting recognition:", err);
      }
    }
  };

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.onstart = () => {
        setIsSpeaking(true);
        setupAudioAnalyzer();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        cleanupAudioAnalyzer();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        cleanupAudioAnalyzer();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech synthesis is not supported in your browser.");
    }
  };

  const setupAudioAnalyzer = () => {
    // Note: Web Speech API doesn't provide direct access to audio analysis
    // We'll simulate audio intensity based on speaking state
    // For real audio analysis, you'd need to capture microphone input
  };

  const cleanupAudioAnalyzer = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioAnalyzerRef.current = null;
  };

  const handleSpeak = () => {
    speak("Hello, I'm a TATA sales assistant to help you out!");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-8">
      {/* Gradient Mesh Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="rounded-full"
          style={{
            filter: "blur(0px)",
          }}
        />

        {/* Status indicator */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2 items-center">
          {isListening && (
            <span className="text-sm text-blue-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Listening...
            </span>
          )}
          {isSpeaking && (
            <span className="text-sm text-purple-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Speaking...
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        {/* Replaced generic Button component with standard styled button */}
        <button
          onClick={toggleListening}
          className={`flex items-center gap-2 px-6 py-3 rounded-md font-semibold transition-colors ${
            isListening
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-white"
          }`}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>

        <button
          onClick={handleSpeak}
          disabled={isSpeaking}
          className="flex items-center gap-2 px-6 py-3 rounded-md font-semibold bg-slate-200 hover:bg-slate-300 text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Volume2 className="w-5 h-5" />
          Speak
        </button>
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="max-w-md w-full p-4 bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-400 mb-2">You said:</p>
          <p className="text-white">{transcript}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-md w-full p-4 bg-red-800 rounded-lg">
          <p className="text-sm text-red-400 mb-2">Error:</p>
          <p className="text-white">{error}</p>
        </div>
      )}

      {/* Color Guide */}
      <div className="text-center text-sm text-slate-400 mt-8">
        <p className="mb-2">
          💡 To change colors, edit the COLORS object in VoiceAssistant.jsx
        </p>
        <div className="flex gap-2 justify-center">
          <div className="flex items-center gap-1">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.primary }}
            />
            <span>Primary</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.secondary }}
            />
            <span>Secondary</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.accent }}
            />
            <span>Accent</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.highlight }}
            />
            <span>Highlight</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gradient;