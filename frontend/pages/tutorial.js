import { Canvg } from 'canvg';

export default function uh() {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const v = Canvg.fromString(
    ctx,
    '<svg width="600" height="600"><text x="50" y="50">Hello World!</text></svg>'
  );

  // Start SVG rendering with animations and mouse handling.
  // v.start();
  return <div>{v.start()}</div>;
}
