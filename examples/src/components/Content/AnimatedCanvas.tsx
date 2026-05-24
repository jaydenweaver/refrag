import { useEffect, useRef } from "react";

export function AnimatedCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    const start = performance.now();

    const draw = () => {
      const t = (performance.now() - start) / 1000;
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "#0c0c0c";
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2 + Math.cos(t) * 40;
      const cy = h / 2 + Math.sin(t * 1.3) * 20;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      grad.addColorStop(0, `hsl(${(t * 60) % 360}, 100%, 70%)`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} width={400} height={240} style={{ display: "block" }} />;
}
