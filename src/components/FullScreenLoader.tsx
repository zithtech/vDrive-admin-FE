import React from "react";

interface FullScreenLoaderProps {
  overlay?: boolean;
  blur?: boolean;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ overlay = false, blur = false }) => {
  const baseStyles: React.CSSProperties = {
    position: overlay ? "fixed" : "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: blur
      ? "rgba(255,255,255,0.15) backdrop-filter: blur(2px)"
      : "rgba(255,255,255,0.85)",
    zIndex: overlay ? 9999 : 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  if (overlay || blur) {
    const finalStyles = {
      ...baseStyles,
      background:
        blur && overlay
          ? "rgba(255, 255, 255, 0.1) backdrop-filter: blur(4px) -webkit-backdrop-filter: blur(4px)"
          : "rgba(0, 0, 0, 0.5)",
    };

    return (
      <div style={finalStyles}>
        <div
          className="loader"
          style={{
            border: "4px solid rgba(255,255,255,0.3)",
            borderTop: "4px solid #1677ff",
            borderRadius: "50%",
            width: 48,
            height: 48,
            animation: "spin 1s linear infinite",
          }}
        />
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={baseStyles}>
      <div
        className="loader"
        style={{
          border: "8px solid #f3f3f3",
          borderTop: "8px solid #1d2a5c",
          borderRadius: "50%",
          width: 64,
          height: 64,
          animation: "spin 1s linear infinite",
        }}
      />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
      </style>
    </div>
  );
};

export default FullScreenLoader;
