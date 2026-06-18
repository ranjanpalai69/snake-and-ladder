import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Snake and Ladder 3D — Free Online Multiplayer Board Game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a12 0%, #0f0f1c 40%, #12102a 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow orbs */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -120,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 450,
            height: 450,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%)",
          }}
        />

        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Game board mockup */}
        <div
          style={{
            position: "absolute",
            right: 60,
            top: 60,
            width: 280,
            height: 280,
            display: "flex",
            flexWrap: "wrap",
            opacity: 0.18,
          }}
        >
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "10%",
                height: "10%",
                border: "0.5px solid rgba(99,102,241,0.5)",
                background: i % 7 === 0 ? "rgba(168,85,247,0.3)" : i % 11 === 0 ? "rgba(34,197,94,0.3)" : "transparent",
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            paddingLeft: 80,
            paddingRight: 380,
            zIndex: 1,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 100,
              padding: "8px 20px",
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 18, color: "#a5b4fc" }}>⚔</div>
            <span style={{ fontSize: 18, color: "#a5b4fc", fontWeight: 600 }}>
              3D Multiplayer Board Game
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 82,
              fontWeight: 900,
              lineHeight: 1,
              color: "#ffffff",
              letterSpacing: "-2px",
              marginBottom: 8,
            }}
          >
            Snake
          </div>
          <div
            style={{
              fontSize: 82,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-2px",
              marginBottom: 28,
              background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            &amp; Ladder
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 24,
              color: "#94a3b8",
              marginBottom: 36,
              maxWidth: 520,
              lineHeight: 1.4,
            }}
          >
            Play the best online Snake and Ladder game free — 3D board, up to 6 players, offline mode
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {["🌐 Online Multiplayer", "📴 Offline Mode", "🏆 Ranked Matches", "🎮 6 Players"].map((pill) => (
              <div
                key={pill}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 16,
                  color: "#cbd5e1",
                  fontWeight: 500,
                }}
              >
                {pill}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
