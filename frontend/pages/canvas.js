import Canvas from '../components/Canvas';

export default function CanvasPage() {
  const draw = (ctx) => {
    // ctx.fillStyle = 'rgb(200, 0, 0)';
    // ctx.fillRect(10, 10, 50, 50);

    // ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
    // ctx.fillRect(30, 30, 50, 50);

    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.font = '25px serif';
    ctx.fillText('Hello world', 10, 50);
  };

  return <Canvas draw={draw} />;
}
