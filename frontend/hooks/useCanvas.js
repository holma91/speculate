import { useRef, useEffect } from 'react';

const useCanvas = (draw) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    draw(context);
  }, [draw]);

  return canvasRef;
};

export default useCanvas;
