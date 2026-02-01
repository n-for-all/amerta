import React, { useState, useEffect } from "react";
import Frame, { useFrame } from "react-frame-component";

// 1. Helper component that runs INSIDE the iframe
const ContentHeightObserver = ({ onHeightChange }: { onHeightChange: (height: number) => void }) => {
  const { document } = useFrame();

  useEffect(() => {
    if (!document?.body) return;

    const updateHeight = () => {
      if (document.body) {
        // scrollHeight is usually the most reliable metric for "full content height"
        const h = document.body.scrollHeight;
        onHeightChange(h);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    // Observe the body for size changes
    resizeObserver.observe(document.body);

    // Also observe the HTML element in case content overflows body logic
    if (document.documentElement) {
      resizeObserver.observe(document.documentElement);
    }

    // Initial check
    updateHeight();

    // Also listen for image loads (common reason for height changes after render)
    document.addEventListener("load", updateHeight, true);

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("load", updateHeight, true);
    };
  }, [document, onHeightChange]);

  return null;
};

// 2. Your Wrapper Component
export const IFrame = ({
  children,
  initialContent,
  style,
  ...props
}: React.PropsWithChildren<
  React.IframeHTMLAttributes<HTMLIFrameElement> & {
    initialContent?: string;
  }
>) => {
  const [contentHeight, setContentHeight] = useState(150); // Default start height

  return (
    <Frame
      initialContent={initialContent}
      {...props}
      style={{
        ...style,
        width: "100%",
        height: `${contentHeight}px`, // Apply the calculated height here
        border: "none",
        transition: "height 0.2s ease", // Optional: smooth transition
      }}
    >
      {/* Order matters: Render the observer alongside the children 
         so it shares the same Context 
      */}
      <ContentHeightObserver onHeightChange={setContentHeight} />
      {children}
    </Frame>
  );
};
