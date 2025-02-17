import { useState, useLayoutEffect } from 'react';

const Ripple = ({ duration = 500, color = "rgba(255, 255, 255, 0.3)" }) => {
  const [ripples, setRipples] = useState([]);

  useLayoutEffect(() => {
    const timeouts = [];

    ripples.forEach((ripple) => {
      const timeout = setTimeout(() => {
        setRipples((prevRipples) =>
          prevRipples.filter((prevRipple) => prevRipple.id !== ripple.id)
        );
      }, duration);

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [ripples, duration]);

  const addRipple = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = Math.max(rect.width, rect.height);

    setRipples((prevRipples) => [
      ...prevRipples,
      {
        id: Date.now(),
        x,
        y,
        size,
      },
    ]);
  };

  return {
    ripples: ripples.map((ripple) => (
      <span
        key={ripple.id}
        style={{
          position: "absolute",
          left: ripple.x - ripple.size / 2,
          top: ripple.y - ripple.size / 2,
          width: ripple.size,
          height: ripple.size,
          borderRadius: "50%",
          backgroundColor: color,
          opacity: "0",
          transform: "scale(0)",
          animation: `ripple ${duration}ms linear`,
        }}
      />
    )),
    addRipple,
  };
};

export default Ripple; 