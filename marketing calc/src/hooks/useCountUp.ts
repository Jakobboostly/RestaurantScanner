import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number; // Animation duration in milliseconds
  startValue?: number; // Starting value (defaults to 0)
}

export function useCountUp(
  targetValue: number, 
  options: UseCountUpOptions = {}
): number {
  const { duration = 1500, startValue = 0 } = options;
  
  const [currentValue, setCurrentValue] = useState(targetValue);
  const [previousTarget, setPreviousTarget] = useState(targetValue);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef<number>(targetValue);

  // Easing function for smooth animation (ease-out)
  const easeOut = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender) {
      setIsFirstRender(false);
      setCurrentValue(targetValue);
      setPreviousTarget(targetValue);
      return;
    }

    // If target value changed, start new animation
    if (targetValue !== previousTarget) {
      setPreviousTarget(targetValue);
      startValueRef.current = currentValue;
      startTimeRef.current = undefined;
      
      // Cancel any existing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply easing
        const easedProgress = easeOut(progress);
        
        // Calculate current value
        const difference = targetValue - startValueRef.current;
        const newValue = startValueRef.current + (difference * easedProgress);
        
        setCurrentValue(newValue);

        // Continue animation if not complete
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      // Start the animation
      animationRef.current = requestAnimationFrame(animate);
    }

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, currentValue, previousTarget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return currentValue;
}