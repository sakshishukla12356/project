import React from "react";
import { motion } from "framer-motion";

const OrbsData = [
  { size: 400, color: "var(--color-primary)", top: "10%", left: "5%", delay: 0 },
  { size: 300, color: "var(--color-secondary)", bottom: "10%", right: "5%", delay: 2 },
  { size: 250, color: "var(--color-primary)", top: "40%", right: "15%", delay: 4 },
  { size: 350, color: "var(--color-secondary)", bottom: "30%", left: "10%", delay: 6 },
  { size: 200, color: "var(--color-primary)", top: "70%", left: "40%", delay: 1 },
  { size: 300, color: "var(--color-secondary)", top: "20%", right: "40%", delay: 3 },
  { size: 150, color: "var(--color-primary)", bottom: "50%", right: "5%", delay: 5 },
  { size: 250, color: "var(--color-secondary)", top: "5%", right: "10%", delay: 7 },
];

export const FloatingOrbs: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {OrbsData.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[120px] opacity-20"
          style={{
            width: orb.size,
            height: orb.size,
            backgroundColor: orb.color,
            top: orb.top,
            left: orb.left,
            right: orb.right,
            bottom: orb.bottom,
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 15 + Math.random() * 5,
            repeat: Infinity,
            delay: orb.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
