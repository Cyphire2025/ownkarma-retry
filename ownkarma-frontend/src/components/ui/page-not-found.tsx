import { ArrowLeft, Home, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type PageMode = "not-found" | "maintenance";

type NotFoundPageProps = {
  mode?: PageMode;
};

export default function NotFoundPage({ mode = "not-found" }: NotFoundPageProps) {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-x-hidden bg-black">
      <MessageDisplay mode={mode} />
      <CircleAnimation />
    </div>
  );
}

function MessageDisplay({ mode }: { mode: PageMode }) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, []);

  const isMaintenance = mode === "maintenance";

  return (
    <div className="pointer-events-none absolute z-[100] flex h-[90%] w-[90%] flex-col items-center justify-center">
      <div
        className={`pointer-events-auto flex flex-col items-center text-center transition-opacity duration-[1200ms] ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="m-[1%] text-[35px] font-semibold text-black">
          {isMaintenance ? "Under Maintenance" : "Page Not Found"}
        </div>
        <div className="m-[1%] text-[80px] font-bold text-black">
          {isMaintenance ? "503" : "404"}
        </div>
        <div className="m-[1%] w-1/2 min-w-[40%] text-[15px] text-black">
          {isMaintenance
            ? "We are currently updating the experience. Please check back soon."
            : "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."}
        </div>
        <div className="mt-8 flex gap-6">
          <button
            onClick={() => (isMaintenance ? window.location.reload() : navigate(-1))}
            className="flex h-auto items-center gap-2 border-2 border-black px-6 py-2 text-base font-medium text-black transition-all duration-300 ease-in-out hover:scale-105 hover:bg-black hover:text-white"
          >
            {isMaintenance ? <Wrench size={20} /> : <ArrowLeft size={20} />}
            {isMaintenance ? "Retry" : "Go Back"}
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex h-auto items-center gap-2 bg-black px-6 py-2 text-base font-medium text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-900"
          >
            <Home size={20} />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

interface Circulo {
  x: number;
  y: number;
  size: number;
}

function CircleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestIdRef = useRef<number | null>(null);
  const timerRef = useRef(0);
  const circulosRef = useRef<Circulo[]>([]);

  const initArr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    circulosRef.current = [];

    for (let index = 0; index < 300; index++) {
      const randomX =
        Math.floor(Math.random() * (canvas.width * 3 - canvas.width * 1.2 + 1)) + canvas.width * 1.2;
      const randomY =
        Math.floor(Math.random() * (canvas.height - (canvas.height * -0.2 + 1))) + canvas.height * -0.2;
      const size = canvas.width / 1000;
      circulosRef.current.push({ x: randomX, y: randomY, size });
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    timerRef.current += 1;
    context.setTransform(1, 0, 0, 1, 0, 0);

    const distanceX = canvas.width / 180;
    const growthRate = canvas.width / 1800;

    context.fillStyle = "white";
    context.clearRect(0, 0, canvas.width, canvas.height);

    circulosRef.current.forEach((circulo) => {
      context.beginPath();

      if (timerRef.current < 120) {
        circulo.x -= distanceX;
        circulo.size += growthRate;
      }

      if (timerRef.current > 120 && timerRef.current < 900) {
        circulo.x -= distanceX * 0.02;
        circulo.size += growthRate * 0.2;
      }

      context.arc(circulo.x, circulo.y, circulo.size, 0, Math.PI * 2);
      context.fill();
    });

    if (timerRef.current > 900) {
      if (requestIdRef.current !== null) {
        window.cancelAnimationFrame(requestIdRef.current);
      }
      return;
    }

    requestIdRef.current = window.requestAnimationFrame(draw);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reset = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      timerRef.current = 0;
      if (requestIdRef.current !== null) {
        window.cancelAnimationFrame(requestIdRef.current);
      }
      initArr();
      draw();
    };

    reset();
    window.addEventListener("resize", reset);

    return () => {
      window.removeEventListener("resize", reset);
      if (requestIdRef.current !== null) {
        window.cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
