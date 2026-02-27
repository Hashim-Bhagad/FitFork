import { motion } from "framer-motion";

export default function GlowBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "60%",
          height: "60%",
          background: "radial-gradient(circle, rgba(128, 237, 153, 0.05) 0%, transparent 70%)",
          filter: "blur(80px)"
        }}
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-10%",
          width: "70%",
          height: "70%",
          background: "radial-gradient(circle, rgba(235, 181, 167, 0.03) 0%, transparent 70%)",
          filter: "blur(100px)"
        }}
      />
    </div>
  );
}
