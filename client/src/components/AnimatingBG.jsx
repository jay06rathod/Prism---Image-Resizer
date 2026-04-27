import React from "react";

const styles = `
  .gradient-bg {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    background: #080810;
    overflow: hidden;
  }

  .gradient-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.4;
    pointer-events: none;
    z-index: 0;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.45;
    pointer-events: none;
  }

  .orb1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, #3b1fa8, #1a0a4a);
    top: -100px;
    left: -100px;
    animation: drift1 14s ease-in-out infinite alternate;
  }

  .orb2 {
    width: 420px;
    height: 420px;
    background: radial-gradient(circle, #1e40af, #0f172a);
    bottom: -80px;
    right: -60px;
    animation: drift2 17s ease-in-out infinite alternate;
  }

  .orb3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, #6d28d9, #1e1b4b);
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.25;
    animation: drift3 20s ease-in-out infinite alternate;
  }

  .orb4 {
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, #4f46e5, #1e1b4b);
    bottom: 20%;
    left: 10%;
    opacity: 0.3;
    animation: drift4 12s ease-in-out infinite alternate;
  }

  .glass-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes drift1 {
    0%   { transform: translate(0, 0) scale(1); }
    100% { transform: translate(60px, 80px) scale(1.1); }
  }

  @keyframes drift2 {
    0%   { transform: translate(0, 0) scale(1); }
    100% { transform: translate(-80px, -60px) scale(1.15); }
  }

  @keyframes drift3 {
    0%   { transform: translate(-50%, -50%) scale(1); }
    100% { transform: translate(-40%, -60%) scale(1.2); }
  }

  @keyframes drift4 {
    0%   { transform: translate(0, 0) scale(1); }
    100% { transform: translate(40px, -50px) scale(1.1); }
  }

  .content {
    position: relative;
    z-index: 1;
  }
`;

export default function AnimatedGradientBg({ children }) {
  return (
    <>
      <style>{styles}</style>
      <div className="gradient-bg">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
        <div className="orb orb4" />
        <div className="glass-grid" />
        <div className="content">{children}</div>
      </div>
    </>
  );
}