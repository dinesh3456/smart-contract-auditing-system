import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface AnimatedElementProps {
  children: ReactNode;
  animation?:
    | "fadeIn"
    | "slideUp"
    | "slideLeft"
    | "slideRight"
    | "scale"
    | "rotate";
  delay?: number;
  duration?: number;
  threshold?: number;
  margin?: string;
  once?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  animation = "fadeIn",
  delay = 0,
  duration = 0.5,
  threshold = 0.1,
  margin = "0px",
  once = true,
  className,
  style,
}) => {
  const [ref, inView] = useInView({
    triggerOnce: once,
    threshold,
    rootMargin: margin,
  });

  // Define animations
  const animations = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    slideUp: {
      hidden: { y: 50, opacity: 0 },
      visible: { y: 0, opacity: 1 },
    },
    slideLeft: {
      hidden: { x: -50, opacity: 0 },
      visible: { x: 0, opacity: 1 },
    },
    slideRight: {
      hidden: { x: 50, opacity: 0 },
      visible: { x: 0, opacity: 1 },
    },
    scale: {
      hidden: { scale: 0.8, opacity: 0 },
      visible: { scale: 1, opacity: 1 },
    },
    rotate: {
      hidden: { rotate: -10, opacity: 0, scale: 0.9 },
      visible: { rotate: 0, opacity: 1, scale: 1 },
    },
  };

  const selectedAnimation = animations[animation];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={selectedAnimation}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1.0], // Custom cubic-bezier easing
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedElement;
