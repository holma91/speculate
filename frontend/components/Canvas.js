import React from 'react';
import useCanvas from '../hooks/useCanvas';
import styled from 'styled-components';

const Canvas = (props) => {
  const { draw, ...rest } = props;
  const canvasRef = useCanvas(draw);

  return <StyledCanvas ref={canvasRef} {...rest} />;
};

const StyledCanvas = styled.canvas`
  border: 1px solid black;
`;

export default Canvas;
