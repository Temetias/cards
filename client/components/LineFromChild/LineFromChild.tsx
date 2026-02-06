import {
  cloneElement,
  forwardRef,
  HTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
}: {
  children: React.ReactElement<
    HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }
  >;
}) {
  const originRef = useRef<HTMLElement | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
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
      {!mouse.x && !mouse.y ? null : (
        <div
          style={{
            position: "fixed",
            left: origin.x,
            top: origin.y,
            height: 2,
            width: length,
            transform: `rotate(${angle}rad)`,
            transformOrigin: "0 50%",
            background: "black",
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}
