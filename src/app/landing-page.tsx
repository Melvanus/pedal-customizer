"use client";

import Link from "next/link";
import * as React from "react";

type LandingPageProps = {
  effectPedals: number;
  enclosureSizes: number;
  availableFinishes: number;
  uniqueColors: number;
  uniqueFinishes: number;
  designOptions: number;
  ledOptions: number;
};

export function LandingPage({
  effectPedals,
  enclosureSizes,
  availableFinishes,
  uniqueColors,
  uniqueFinishes,
  designOptions,
  ledOptions,
}: LandingPageProps) {
  const totalCombinations = effectPedals * enclosureSizes * availableFinishes * designOptions * ledOptions;

  return (
    <div
      data-section="landing-page"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
        color: "#e0e0e0",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Hero Section */}
      <div
        data-section="hero-section"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1
          data-section="main-title"
          style={{
            fontSize: "4rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            background: "linear-gradient(135deg, #fff 0%, #aaa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Fuzzy Engineering
        </h1>
        <h2
          data-section="subtitle"
          style={{
            fontSize: "2rem",
            fontWeight: 300,
            marginBottom: "1rem",
            color: "#ccc",
          }}
        >
          Custom Pedal Builder
        </h2>
        <p
          data-section="hero-description"
          style={{
            fontSize: "1.2rem",
            maxWidth: "600px",
            marginBottom: "3rem",
            color: "#999",
            lineHeight: 1.6,
          }}
        >
          Design your perfect guitar pedal enclosure with our comprehensive customization system.
          From finishes and colors to LEDs and modifications — bring your vision to life.
        </p>

        {/* CTA Button */}
        <Link
          href="/customize"
          data-section="cta-button"
          style={{
            display: "inline-block",
            padding: "1.25rem 3rem",
            background: "#fff",
            color: "#000",
            fontSize: "1.2rem",
            fontWeight: 600,
            borderRadius: "10px",
            textDecoration: "none",
            boxShadow: "0 8px 24px rgba(255, 255, 255, 0.2)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 12px 32px rgba(255, 255, 255, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 255, 255, 0.2)";
          }}
        >
          Start Customizing
        </Link>
      </div>

      {/* Statistics Section */}
      <div
        data-section="statistics-section"
        style={{
          background: "#1a1a1a",
          padding: "4rem 2rem",
          borderTop: "2px solid #333",
          borderBottom: "2px solid #333",
        }}
      >
        <div
          data-section="statistics-container"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h3
            data-section="statistics-title"
            style={{
              fontSize: "2rem",
              fontWeight: 600,
              textAlign: "center",
              marginBottom: "3rem",
              color: "#fff",
            }}
          >
            Endless Possibilities
          </h3>

          <div
            data-section="stat-cards-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "2rem",
              marginBottom: "3rem",
            }}
          >
            <StatCard label="Effect Pedals" value={effectPedals} />
            <StatCard label="Enclosure Sizes" value={enclosureSizes} />
            <StatCard label="Paint Finishes" value={availableFinishes} />
            <StatCard label="Unique Colors" value={uniqueColors} />
            <StatCard label="Design Options" value={designOptions} />
            <StatCard label="LED Styles" value={ledOptions} />
          </div>

          {/* Total Combinations */}
          <div
            data-section="total-combinations"
            style={{
              background: "linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)",
              padding: "2rem",
              borderRadius: "15px",
              textAlign: "center",
              border: "2px solid #fff",
              boxShadow: "0 8px 24px rgba(255, 255, 255, 0.1)",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "#999", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "2px" }}>
              Total Possible Combinations
            </div>
            <div
              style={{
                fontSize: "3rem",
                fontWeight: "bold",
                color: "#fff",
              }}
            >
              {totalCombinations.toLocaleString()}+
            </div>
            <div style={{ fontSize: "0.95rem", color: "#aaa", marginTop: "1rem" }}>
              {effectPedals} effects × {enclosureSizes} sizes × {availableFinishes} finishes × {designOptions} designs × {ledOptions} LEDs
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div
        data-section="how-it-works-section"
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "4rem 2rem",
        }}
      >
        <h3
          data-section="how-it-works-title"
          style={{
            fontSize: "2rem",
            fontWeight: 600,
            textAlign: "center",
            marginBottom: "3rem",
            color: "#fff",
          }}
        >
          How It Works
        </h3>

        <div
          data-section="steps-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "2rem",
          }}
        >
          <StepCard
            number="1"
            title="Choose Your Effect"
            description="Select from classic pedal circuits—overdrives, fuzzes, delays, and more. Each with full specs and mod options."
          />
          <StepCard
            number="2"
            title="Pick Your Size"
            description="Select the perfect enclosure size for your build. From compact 1590A to spacious 1590XX—we'll recommend the best fit."
          />
          <StepCard
            number="3"
            title="Select Paint & Finish"
            description="Choose from dozens of powder-coated finishes in various colors, textures, and special effects."
          />
          <StepCard
            number="4"
            title="Customize Design"
            description="Add labeling, decals, engraving, or specialized finishes like relic or fluffy coating."
          />
          <StepCard
            number="5"
            title="Add LED Style"
            description="Pick from standard holders, fancy bezels, vintage jewels, or illuminated footswitches."
          />
          <StepCard
            number="6"
            title="Add Modifications"
            description="Enhance with booster circuits, custom layouts, voltage sag controls, and more."
          />
        </div>

        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link
            href="/customize"
            data-section="bottom-cta-button"
            style={{
              display: "inline-block",
              padding: "1rem 2.5rem",
              background: "#fff",
              color: "#000",
              fontSize: "1.1rem",
              fontWeight: 600,
              borderRadius: "10px",
              textDecoration: "none",
              boxShadow: "0 8px 24px rgba(255, 255, 255, 0.2)",
              transition: "transform 0.2s ease",
            }}
          >
            Get Started →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div
        data-section="footer"
        style={{
          background: "#0a0a0a",
          padding: "2rem",
          textAlign: "center",
          borderTop: "1px solid #333",
          color: "#666",
          fontSize: "0.9rem",
        }}
      >
        © {new Date().getFullYear()} Fuzzy Engineering. All rights reserved.
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      data-section="stat-card"
      style={{
        background: "#0f0f0f",
        padding: "1.5rem",
        borderRadius: "10px",
        textAlign: "center",
        border: "2px solid #2d2d2d",
        transition: "transform 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.borderColor = "#fff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "#2d2d2d";
      }}
    >
      <div
        data-section="stat-value"
        style={{
          fontSize: "2.5rem",
          fontWeight: "bold",
          color: "#fff",
          marginBottom: "0.5rem",
        }}
      >
        {value}
      </div>
      <div data-section="stat-label" style={{ fontSize: "0.9rem", color: "#999" }}>{label}</div>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div
      data-section="step-card"
      style={{
        background: "#0f0f0f",
        padding: "2rem",
        borderRadius: "10px",
        border: "2px solid #2d2d2d",
        transition: "border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#fff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2d2d2d";
      }}
    >
      <div
        data-section="step-number"
        style={{
          width: "50px",
          height: "50px",
          background: "#fff",
          color: "#000",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "1rem",
        }}
      >
        {number}
      </div>
      <h4 data-section="step-title" style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.75rem", color: "#fff" }}>{title}</h4>
      <p data-section="step-description" style={{ fontSize: "0.95rem", color: "#999", lineHeight: 1.5 }}>{description}</p>
    </div>
  );
}
