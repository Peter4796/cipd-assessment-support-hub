import { ImageResponse } from "next/og";

/**
 * Site-wide Open Graph image (file convention: applies to every route that
 * does not define its own). Generated with next/og — no binary asset to
 * maintain, always brand-consistent. WhatsApp, LinkedIn, X and Facebook all
 * consume the og:image this emits.
 */

export const runtime = "edge";
export const alt = "CIPD Guidance — Professional CIPD Assessment Support, Level 3, 5 and 7";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0c1626";
const NAVY_LIGHT = "#1a2c48";
const GOLD = "#c39a3a";
const MIST = "#d3dae7";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_LIGHT} 100%)`,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Gold top rule */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 10,
            background: GOLD,
            display: "flex",
          }}
        />

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: GOLD,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 6,
          }}
        >
          CIPD GUIDANCE
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            marginTop: 36,
            color: "#ffffff",
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.12,
            maxWidth: 980,
          }}
        >
          Professional CIPD Assessment Support
        </div>

        {/* Levels */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            marginTop: 44,
            color: MIST,
            fontSize: 34,
            fontWeight: 600,
          }}
        >
          <span>Level 3</span>
          <span style={{ color: GOLD }}>•</span>
          <span>Level 5</span>
          <span style={{ color: GOLD }}>•</span>
          <span>Level 7</span>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 96,
            display: "flex",
            color: "#7c91b6",
            fontSize: 26,
          }}
        >
          www.cipdguidance.com
        </div>
      </div>
    ),
    { ...size }
  );
}
