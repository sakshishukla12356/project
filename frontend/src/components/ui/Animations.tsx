import React from "react";
import { motion } from "framer-motion";

interface FloatProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
}

export const Float: React.FC<FloatProps> = ({ children, delay = 0, duration = 4, distance = 10 }) => {
  return (
    <motion.div
      animate={{
        y: [0, -distance, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
};

export const Antigravity: React.FC<FloatProps> = ({ children, delay = 0, duration = 6 }) => {
  return (
    <motion.div
      animate={{
        y: [0, -15, 0],
        rotateX: [0, 5, -5, 0],
        rotateY: [0, -5, 5, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </motion.div>
  );
};
