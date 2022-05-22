import { useRef, useEffect } from 'react';
import { Canvg } from 'canvg';

const useCanvas = (draw) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    draw(context);
    let img = canvas.toDataURL('image/png');
    console.log(img);
  }, [draw]);

  return canvasRef;
};

export default useCanvas;
