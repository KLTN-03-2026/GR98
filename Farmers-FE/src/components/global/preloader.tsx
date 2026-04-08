import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import logoSrc from "@/assets/Logo Agri-Intergration.png";

interface PreloaderProps {
  isVisible: boolean;
  className?: string;
}

export function Preloader({ isVisible, className }: PreloaderProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-60 flex items-center justify-center backdrop-blur-2xl",
        className,
      )}
    >
      {/* Enhanced glass morphism background */}
      <motion.div
        className="absolute inset-0 opacity-0"
        animate={{
          backgroundColor: ["rgba(123, 174, 60, 0)", "rgba(123, 174, 60, 0.05)", "rgba(123, 174, 60, 0)"],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex flex-col items-center gap-8">
        {/* Outer glow effect */}
        <motion.div
          className="absolute -inset-12 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--primary-300) 18%, transparent) 0%, transparent 70%)",
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Spinning rings container */}
        <div className="relative flex h-60 w-60 items-center justify-center">
          {/* Outer ring - slower rotation */}
          <motion.div
            className="absolute h-60 w-60 rounded-full border-[2px] border-transparent border-t-[var(--secondary-600)] border-r-[var(--primary-500)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />

          {/* Middle ring - medium rotation */}
          <motion.div
            className="absolute h-48 w-48 rounded-full border-[2px] border-transparent border-b-[var(--primary-400)] border-l-[var(--secondary-300)]"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner ring - faster rotation */}
          <motion.div
            className="absolute h-36 w-36 rounded-full border-[2px] border-transparent border-t-[var(--primary-300)] border-r-[var(--secondary-400)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />

          {/* Center core with pulse */}
          <motion.div
            className="absolute h-24 w-24 rounded-full bg-gradient-to-br from-[var(--primary-200)] to-[var(--primary-100)] blur-lg"
            animate={{
              scale: [0.85, 1.15, 0.85],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="relative z-20 flex items-center justify-center"
            animate={{ scale: [0.95, 1, 0.95] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <img
              src={logoSrc}
              alt="Agri Integration"
              className="object-contain"
              style={{ width: "280px", maxHeight: "160px" }}
            />
          </motion.div>
        </div>

        {/* Loading text with fade animation */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-base font-medium tracking-widest text-[var(--secondary-700)] dark:text-[var(--primary-300)]">
            Waiting a moment...
          </p>
          <motion.div
            className="mt-3 flex justify-center gap-1.5"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <motion.span
              className="h-2 w-2 rounded-full bg-[var(--primary-500)]"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              className="h-2 w-2 rounded-full bg-[var(--primary-500)]"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span
              className="h-2 w-2 rounded-full bg-[var(--primary-500)]"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
