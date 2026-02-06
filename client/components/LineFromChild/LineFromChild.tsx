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
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!show) return;
    const updateOrigin = () => {
      if (!originRef.current) return;
      const rect = originRef.current.getBoundingClientRect();
      setOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    };
    updateOrigin();
    addEventListener("resize", updateOrigin);
    return () => removeEventListener("resize", updateOrigin);
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    addEventListener("mousemove", onMove);
    return () => removeEventListener("mousemove", onMove);
  }, [show]);

  const { length, angle } = useMemo(() => {
    const dx = mouse.x - origin.x;
    const dy = mouse.y - origin.y;
    return { length: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) };
  }, [mouse, origin]);

  return (
    <>
      <LineFromChildOrigin ref={originRef}>{children}</LineFromChildOrigin>
      {(!mouse.x && !mouse.y) || !show ? null : (
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
