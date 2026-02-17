"use client";

type PixelIconProps = {
  type: "play" | "pause" | "restart" | "note";
  size?: number;
  color?: string;
};

export default function PixelIcon({ type, size = 24, color = "currentColor" }: PixelIconProps) {
  const renderBlocks = () => {
    switch (type) {
      case "play":
        return (
          <>
            <rect x="4" y="4" width="2" height="16" />
            <rect x="6" y="6" width="2" height="12" />
            <rect x="8" y="8" width="2" height="8" />
            <rect x="10" y="10" width="2" height="4" />
          </>
        );
      case "pause":
        return (
          <>
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </>
        );
      case "restart":
        return (
          <>
            <rect x="4" y="10" width="2" height="8" />
            <rect x="6" y="16" width="8" height="2" />
            <rect x="12" y="8" width="2" height="8" />
            <rect x="8" y="6" width="8" height="2" />
            <rect x="16" y="8" width="2" height="8" />
            <rect x="4" y="6" width="4" height="4" />
          </>
        );
      case "note":
        return (
          <>
            <rect x="14" y="4" width="4" height="2" />
            <rect x="12" y="6" width="2" height="10" />
            <rect x="8" y="14" width="6" height="4" />
            <rect x="6" y="16" width="4" height="2" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      style={{ imageRendering: "pixelated" }}
    >
      {renderBlocks()}
    </svg>
  );
}
