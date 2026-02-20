import { useEffect, useRef, useState, type ReactNode } from "react";
import "./aside.scss";

// const DESKTOP_BREAKPOINT = 1080;

type AsideStyle = {
  position: "sticky" | "relative";
  top: number;
  marginTop: number;
};

export default function Aside({ children }: { children: ReactNode }) {
  const asideRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<AsideStyle>({
    position: "sticky",
    top: 32,
    marginTop: 0,
  });
  const lastScrollTop = useRef<number>(0);
  const hasStuckToBottom = useRef<boolean>(false);
  const hasNotReachedTheTopYet = useRef<boolean>(false);

  useEffect(() => {
    const scrollContainer = document.getElementsByClassName("contents")[0];

    if (!scrollContainer) return;

    const getPosition = () => {
      if (!asideRef.current) return;

      const currentScrollTop = scrollContainer.scrollTop;
      const scrollingDown = currentScrollTop > lastScrollTop.current;

      const { top, bottom, height } = asideRef.current.getBoundingClientRect();

      if (scrollingDown) {
        if (!hasStuckToBottom.current) {
          setStyle({
            position: "relative",
            top: 0,
            marginTop: 0,
          });
          if (Math.ceil(bottom) <= scrollContainer.clientHeight + 48) {
            setStyle({
              position: "sticky",
              top: (height - scrollContainer.clientHeight + 16) * -1,
              marginTop: 0,
            });
            hasStuckToBottom.current = true;
            hasNotReachedTheTopYet.current = false;
          }
        }
      } else {
        if (top >= 88) {
          setStyle({
            position: "sticky",
            top: 32,
            marginTop: 0,
          });
        } else if (!hasNotReachedTheTopYet.current) {
          setStyle({
            position: "relative",
            top: 0,
            marginTop:
              scrollContainer.scrollTop - scrollContainer.clientHeight - 16,
          });
          hasNotReachedTheTopYet.current = true;
          hasStuckToBottom.current = false;
        }
      }
      lastScrollTop.current = currentScrollTop;
    };

    scrollContainer.addEventListener("scroll", getPosition);

    return () => {
      scrollContainer.removeEventListener("scroll", getPosition);
    };
  }, [children, style]);

  return (
    <aside className="aside-component pr--200  pb--200  pl--200">
      <div ref={asideRef} className="aside-content c-bg--fourth" style={style}>
        {[...Array(50).keys()].map((i) => (
          <p key={i}>Aside content line {i + 1}</p>
        ))}
        {children}
      </div>
    </aside>
  );
}
