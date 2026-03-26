import React from "react";

const styles = `
  .gradient-bg {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    background: #0d1b3e;
    overflow: hidden;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.75;
  }

  .orb1 {
    width: 420px;
    height: 420px;
    background: #1a3a8f;
    bottom: -100px;
    left: -80px;
    animation: move1 9s ease-in-out infinite alternate;
  }

  .orb2 {
    width: 380px;
    height: 380px;
    background: #00d26a;
    bottom: -120px;
    right: 50px;
    animation: move2 11s ease-in-out infinite alternate;
  }

  .orb3 {
    width: 300px;
    height: 300px;
    background: #0a5fa0;
    top: -60px;
    left: 40%;
    animation: move3 13s ease-in-out infinite alternate;
  }

  .orb4 {
    width: 220px;
    height: 220px;
    background: #00a86b;
    top: 20px;
    right: -40px;
    opacity: 0.4;
    animation: move4 8s ease-in-out infinite alternate;
  }

  @keyframes move1 {
    0%   { transform: translate(0, 0) scale(1); }
    100% { transform: translate(80px, -60px) scale(1.15); }
  }

  @keyframes move2 {
    0%   { transform: translate(0, 0) scale(1); }
    100% { transform: translate(-100px, -80px) scale(1.2); }
  }

  @keyframes move3 {
    0%   { transform: translate(0, 0) scale(1); }
    100% { transform: translate(-60px, 80px) scale(1.1); }
  }

  @keyframes move4 {
    0%   { transform: translate(0, 0) scale(1); }
    100% { transform: translate(-50px, 60px) scale(1.3); }
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
        {children}
      </div>
    </>
  );
}