/**
 * Aside Component - Sticky Sidebar
 *
 * A reusable sidebar component with intelligent sticky behavior:
 * - On desktop (≥1080px): Scrolls with content until fully visible, then sticks
 * - On mobile (<1080px): Renders normally without sticky behavior
 * - Handles sidebars taller than viewport by calculating optimal sticky offset
 *
 * Usage:
 * ```tsx
 * <Aside>
 *   <div>Your sidebar content here</div>
 * </Aside>
 * ```
 *
 * Technical details:
 * - Uses JavaScript to dynamically calculate sticky top offset
 * - Calculates: top = Math.min(0, containerHeight - asideHeight)
 * - This ensures all aside content scrolls into view before sticking
 * - Listens to window resize to recalculate on viewport changes
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import "./aside.scss";

const DESKTOP_BREAKPOINT = 1080; // md breakpoint from _breakpoints.scss

export default function Aside({ children }: { children: ReactNode }) {
  const asideRef = useRef<HTMLDivElement>(null);
  const [stickyTop, setStickyTop] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Client-side only - exit if running on server
    if (typeof window === "undefined") return;

    // Check if we're on desktop viewport
    const mediaQuery = window.matchMedia(
      `(min-width: ${DESKTOP_BREAKPOINT}px)`
    );

    const updateStickyOffset = () => {
      const isDesktopView = mediaQuery.matches;
      setIsDesktop(isDesktopView);

      if (!isDesktopView || !asideRef.current) {
        setStickyTop(0);
        return;
      }

      // Find the scroll container (.contents div in layout)
      const scrollContainer = document.querySelector(".contents");
      if (!scrollContainer) {
        setStickyTop(0);
        return;
      }

      const containerHeight = scrollContainer.clientHeight;
      const asideHeight = asideRef.current.offsetHeight;

      // Calculate optimal sticky offset:
      // - If aside is shorter than container: stick at top (0)
      // - If aside is taller: use negative offset so all content scrolls into view
      // - Subtract 16px to allow additional scroll space at bottom for parent padding
      const offset = Math.min(0, containerHeight - asideHeight) - 16;
      setStickyTop(offset);
    };

    // Initial calculation
    updateStickyOffset();

    // Recalculate on viewport resize
    const handleResize = () => {
      updateStickyOffset();
    };

    window.addEventListener("resize", handleResize);
    mediaQuery.addEventListener("change", updateStickyOffset);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      mediaQuery.removeEventListener("change", updateStickyOffset);
    };
  }, [children]); // Recalculate when children change (content height might change)

  return (
    <aside className="aside-component p--200">
      <div
        ref={asideRef}
        className="aside-content c-bg--fourth"
        style={isDesktop ? { top: `${stickyTop}px` } : undefined}
      >
        {[...Array(100).keys()].map((i) => (
          <p key={i}>Aside content line {i + 1}</p>
        ))}
        {children}
      </div>
    </aside>
  );
}
