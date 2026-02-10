import {
  cloneElement,
  forwardRef,
  HTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./LineFromChild.css";

let lastMouse = { x: 0, y: 0 };
let lastMouseKnown = false;

type OriginProps<T extends HTMLElement> = {
  children: React.ReactElement<
    React.HTMLAttributes<T> & { ref?: React.Ref<T> }
  >;
};
const LineFromChildOrigin = forwardRef<HTMLElement, OriginProps<HTMLElement>>(
  ({ children }, ref) => cloneElement(children, { ref }),
);

export function LineFromChild({
  children,
  show,
}: {
  children: React.ReactElement<
    HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }
  >;
  show?: boolean;
}) {
  const originRef = useRef<HTMLElement | null>(null);
  const showRef = useRef(!!show);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hasMouse, setHasMouse] = useState(lastMouseKnown);
  const [hasOrigin, setHasOrigin] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    showRef.current = !!show;
    if (!show) {
      setHasOrigin(false);
      return;
    }
    if (lastMouseKnown) {
      setMouse(lastMouse);
      setHasMouse(true);
    }
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const updateOrigin = () => {
      if (!originRef.current) return;
      const rect = originRef.current.getBoundingClientRect();
      setOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setHasOrigin(true);
    };
    let rafId = 0;
    const tick = () => {
      updateOrigin();
      rafId = requestAnimationFrame(tick);
    };
    tick();
    addEventListener("resize", updateOrigin);
    addEventListener("scroll", updateOrigin, true);
    return () => {
      cancelAnimationFrame(rafId);
      removeEventListener("resize", updateOrigin);
      removeEventListener("scroll", updateOrigin, true);
    };
  }, [show]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      lastMouse = { x: e.clientX, y: e.clientY };
      lastMouseKnown = true;
      if (!showRef.current) return;
      setMouse(lastMouse);
      setHasMouse(true);
    };
    addEventListener("mousemove", onMove);
    return () => removeEventListener("mousemove", onMove);
  }, []);

  const { length, angle } = useMemo(() => {
    const dx = mouse.x - origin.x;
    const dy = mouse.y - origin.y;
    return { length: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) };
  }, [mouse, origin]);

  return (
    <>
      <LineFromChildOrigin ref={originRef}>{children}</LineFromChildOrigin>
      {!show || !hasMouse || !hasOrigin ? null : (
        <div
          className="LineFromChild"
          style={{
            position: "fixed",
            left: origin.x,
            top: origin.y,
            width: length,
            transform: `rotate(${angle}rad)`,
            transformOrigin: "0 50%",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
      )}
    </>
  );
}
