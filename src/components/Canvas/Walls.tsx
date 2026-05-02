import { Line, Group } from 'react-konva';
import type { ApartmentGeometry } from '../../types';
import { wallQuad } from '../../utils/geometry';

interface Props {
  geometry: ApartmentGeometry;
}

export function Walls({ geometry }: Props) {
  return (
    <Group listening={false}>
      {geometry.walls.map((w) => {
        const quad = wallQuad(w);
        const flat = quad.flatMap((p) => [p.x, p.y]);
        return (
          <Line
            key={w.id}
            points={flat}
            closed
            fill={w.external ? '#2c3038' : '#454c59'}
            stroke="#1d2026"
            strokeWidth={1}
            strokeScaleEnabled={false}
            perfectDrawEnabled={false}
          />
        );
      })}
    </Group>
  );
}
