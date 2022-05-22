import React, { useRef, useEffect } from 'react';
import { Canvg } from 'canvg';

const Canvas = (props) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    //Our first draw
    // context.fillStyle = '#000000';
    // context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    const v = Canvg.fromString(
      context,
      '<svg width="320" height="320" version="1.1" xmlns="http://www.w3.org/2000/svg" class="write__StyledSVG-sc-ez607g-5 eLMpVK"><image href="/ETH.svg" x="90" y="26" height="28px" width="28px"></image><text x="120" y="49" font-size="25" font-weight="300">ETH<!-- --> CALL<!-- --></text><line x1="20" y1="65" x2="300" y2="65" stroke="black" stroke-width="1.25"></line><text x="70" y="105" font-size="20" font-weight="300">Price Feed: <!-- -->ETH/USD<!-- --></text><text x="70" y="150" font-size="20" font-weight="300">Strike Price: <!-- -->$2000<!-- --></text><text x="70" y="195" font-size="20" font-weight="300">Amount: <!-- -->2 ETH<!-- --></text><text x="70" y="240" font-size="20" font-weight="300">Expiry: <!-- -->2023-01-01<!-- --></text><text x="70" y="285" font-size="20" font-weight="300">American Style</text></svg>'
    );
    v.start();
    // let img = canvas.toDataURL('image/png');
    // console.log(img);
  }, []);

  return <canvas ref={canvasRef} {...props} />;
};

export default Canvas;
