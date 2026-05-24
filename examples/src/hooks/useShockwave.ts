import { useEffect, useRef, useState } from "react";

export type UseShockwaveReturn = {
  shockT:      number;
  shockPosRef: React.MutableRefObject<[number, number]>;
};

export function useShockwave(): UseShockwaveReturn {
  const shockPosRef   = useRef<[number, number]>([0.5, 0.5]);
  const shockStartRef = useRef(-Infinity);
  const shockRafRef   = useRef(0);
  const [shockT, setShockT] = useState(999);

  useEffect(() => {
    const DURATION = 1.2;

    const tick = () => {
      const t = (performance.now() - shockStartRef.current) / 1000;
      if (t < DURATION) {
        setShockT(t);
        shockRafRef.current = requestAnimationFrame(tick);
      } else {
        setShockT(999);
      }
    };

    const onDown = (e: MouseEvent) => {
      shockPosRef.current = [e.clientX / window.innerWidth, e.clientY / window.innerHeight];
      shockStartRef.current = performance.now();
      cancelAnimationFrame(shockRafRef.current);
      shockRafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("mousedown", onDown);
      cancelAnimationFrame(shockRafRef.current);
    };
  }, []);

  return { shockT, shockPosRef };
}
