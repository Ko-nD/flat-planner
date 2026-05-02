import { Group, Line } from 'react-konva';

interface Props {
  width: number;
  height: number;
  step: number;          // мм
  bigEvery?: number;     // каждые N шагов — жирнее
}

export function Grid({ width, height, step, bigEvery = 5 }: Props) {
  const linesV: number[][] = [];
  const linesH: number[][] = [];
  const bigV: number[][] = [];
  const bigH: number[][] = [];
  for (let x = 0; x <= width; x += step) {
    const arr = (x / step) % bigEvery === 0 ? bigV : linesV;
    arr.push([x, 0, x, height]);
  }
  for (let y = 0; y <= height; y += step) {
    const arr = (y / step) % bigEvery === 0 ? bigH : linesH;
    arr.push([0, y, width, y]);
  }
  return (
    <Group listening={false}>
      {linesV.map((p, i) => (
        <Line key={`v${i}`} points={p} stroke="#eee5cf" strokeWidth={1} strokeScaleEnabled={false} perfectDrawEnabled={false} />
      ))}
      {linesH.map((p, i) => (
        <Line key={`h${i}`} points={p} stroke="#eee5cf" strokeWidth={1} strokeScaleEnabled={false} perfectDrawEnabled={false} />
      ))}
      {bigV.map((p, i) => (
        <Line key={`bv${i}`} points={p} stroke="#dccfa6" strokeWidth={1.4} strokeScaleEnabled={false} perfectDrawEnabled={false} />
      ))}
      {bigH.map((p, i) => (
        <Line key={`bh${i}`} points={p} stroke="#dccfa6" strokeWidth={1.4} strokeScaleEnabled={false} perfectDrawEnabled={false} />
      ))}
    </Group>
  );
}
