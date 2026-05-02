import { Line, Group } from 'react-konva';
import type { ApartmentGeometry } from '../../types';
import { wallQuad } from '../../utils/geometry';

interface Props {
  geometry: ApartmentGeometry;
  selectedIds?: string[];
  // Если задан — стены становятся интерактивными и кликабельными.
  onWallClick?: (id: string, additive: boolean) => void;
}

export function Walls({ geometry, selectedIds, onWallClick }: Props) {
  const interactive = !!onWallClick;
  const selected = selectedIds ?? [];
  return (
    <Group listening={interactive}>
      {geometry.walls.map((w) => {
        const quad = wallQuad(w);
        const flat = quad.flatMap((p) => [p.x, p.y]);
        const isSel = selected.includes(w.id);
        return (
          <Line
            key={w.id}
            points={flat}
            closed
            fill={isSel ? '#ff7a00' : (w.external ? '#2c3038' : '#454c59')}
            stroke={isSel ? '#ff7a00' : '#1d2026'}
            strokeWidth={isSel ? 2.5 : 1}
            strokeScaleEnabled={false}
            perfectDrawEnabled={false}
            listening={interactive}
            onMouseDown={interactive ? (e) => {
              if (e.evt.button !== 0) return;
              e.cancelBubble = true;
              onWallClick!(w.id, e.evt.shiftKey);
            } : undefined}
            onMouseEnter={interactive ? (e) => {
              const c = e.target.getStage()?.container();
              if (c) c.style.cursor = 'pointer';
            } : undefined}
            onMouseLeave={interactive ? (e) => {
              const c = e.target.getStage()?.container();
              if (c) c.style.cursor = '';
            } : undefined}
          />
        );
      })}
    </Group>
  );
}
