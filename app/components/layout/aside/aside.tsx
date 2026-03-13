import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLayoutContentsRef } from "~/context/layout/layout";
import "./aside.scss";

type AsideStyle = {
  position: "sticky" | "relative";
  top: number;
  marginTop: number;
};

const DESKTOP_BREAKPOINT = 767;

const layoutSizesMap = {
  paddingTop: 32,
  paddingBottom: 16,
};

const HEADER_HEIGHT = 56;
const INITIAL_ASIDE_TOP = layoutSizesMap.paddingTop + HEADER_HEIGHT;

const defaultInitialStyle: AsideStyle = {
  position: "sticky",
  top: 32,
  marginTop: 0,
};

export default function Aside({ children }: { children: ReactNode }) {
  const asideRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<AsideStyle>(defaultInitialStyle);
  const lastScrollTop = useRef<number>(0);
  const hasStuckToBottom = useRef<boolean>(false);
  const hasNotReachedTheTopYet = useRef<boolean>(false);
  const hasSetDownwardPosition = useRef<boolean>(false);
  const contentsRef = useLayoutContentsRef();

  useEffect(() => {
    const scrollContainer = contentsRef?.current;
    if (!scrollContainer) return;

    const handleResize = () => {
      const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
      if (isDesktop) {
        // Reset to default sticky position on desktop
        console.log("set default style");
        setStyle(defaultInitialStyle);
      }
    };

    const getPosition = () => {
      // Only run on viewports larger or equal to DESKTOP_BREAKPOINT
      if (window.innerWidth <= DESKTOP_BREAKPOINT) return;

      if (!asideRef.current) return;

      const currentScrollTop = scrollContainer.scrollTop;
      const scrollingDown = currentScrollTop > lastScrollTop.current;

      const { top, bottom, height } = asideRef.current.getBoundingClientRect();
      // se si scrolla verso il basso e non si è ancora attaccati al fondo,
      // attacca l'aside al fondo quando raggiunge il punto in cui il fondo dell'aside è a 16px dal fondo del container
      if (scrollingDown) {
        if (!hasStuckToBottom.current) {
          // Only set position once when starting to scroll down
          if (!hasSetDownwardPosition.current) {
            // Check if we're at the very top of the scroll container
            const hasScrolledFromStart = scrollContainer.scrollTop > 5;

            let marginTop = 0;
            if (!hasScrolledFromStart) {
              // At page top, use padding
              marginTop = layoutSizesMap.paddingTop;
            } else {
              // Maintain current visual position when switching from sticky to relative
              marginTop = scrollContainer.scrollTop + top - HEADER_HEIGHT;
            }

            setStyle({
              position: "relative",
              top: 0,
              marginTop,
            });
            hasSetDownwardPosition.current = true;
          }
          if (
            Math.ceil(bottom) <=
            scrollContainer.clientHeight +
              (layoutSizesMap.paddingTop + layoutSizesMap.paddingBottom)
          ) {
            setStyle({
              position: "sticky",
              top:
                (height -
                  scrollContainer.clientHeight +
                  layoutSizesMap.paddingBottom) *
                -1,
              marginTop: 0,
            });
            hasStuckToBottom.current = true;
            hasNotReachedTheTopYet.current = false;
            hasSetDownwardPosition.current = false;
          }
        }
        // se si scrolla verso l'alto e si è attaccati al fondo,
        // stacca l'aside dal fondo quando il top dell'aside raggiunge INITIAL_ASIDE_TOP dal top del viewport
      } else {
        hasSetDownwardPosition.current = false;
        if (top >= INITIAL_ASIDE_TOP) {
          setStyle(defaultInitialStyle);
          hasStuckToBottom.current = false;
          hasNotReachedTheTopYet.current = false;
        } else if (!hasNotReachedTheTopYet.current) {
          setStyle({
            position: "relative",
            top: 0,
            marginTop:
              scrollContainer.scrollTop +
              scrollContainer.clientHeight -
              height -
              layoutSizesMap.paddingBottom,
          });
          hasNotReachedTheTopYet.current = true;
          hasStuckToBottom.current = false;
        }
      }
      lastScrollTop.current = currentScrollTop;
    };

    scrollContainer.addEventListener("scroll", getPosition);
    window.addEventListener("resize", handleResize);

    return () => {
      scrollContainer.removeEventListener("scroll", getPosition);
      window.removeEventListener("resize", handleResize);
    };
  }, [children, style, contentsRef]);

  return (
    <aside className="aside-component pr--200  pb--200  pl--200">
      <div ref={asideRef} className="aside-content" style={style}>
        {children}
      </div>
    </aside>
  );
}
