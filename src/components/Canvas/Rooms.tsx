import { Group, Line, Text } from 'react-konva';
import type { ApartmentGeometry } from '../../types';
import { polygonCentroid } from '../../utils/geometry';
import { fmtArea } from '../../utils/format';

interface Props {
  geometry: ApartmentGeometry;
  showLabels?: boolean;
  selectedIds?: string[];
  // Если задан — полигоны комнат становятся кликабельными для выделения.
  onRoomClick?: (id: string, additive: boolean) => void;
}

const ROOM_FILL: Record<string, string> = {
  living:  '#fdfaf2',
  kitchen: '#fbf6e8',
  bath:    '#eaf3f8',
  wc:      '#eaf3f8',
  hall:    '#f5efe2',
  balcony: '#f0ece2',
};

export function Rooms({ geometry, showLabels = true, selectedIds, onRoomClick }: Props) {
  const interactive = !!onRoomClick;
  const selected = selectedIds ?? [];
  return (
    <Group listening={interactive}>
      {geometry.rooms.map((r) => {
        const c = polygonCentroid(r.polygon);
        const flat = r.polygon.flatMap((p) => [p.x, p.y]);
        const isSel = selected.includes(r.id);
        return (
          <Group key={r.id} listening={interactive}>
            <Line
              points={flat}
              closed
              fill={isSel ? '#fff3e0' : (ROOM_FILL[r.kind] ?? '#fdfaf2')}
              stroke={isSel ? '#ff7a00' : '#ddd6c4'}
              strokeWidth={isSel ? 3 : 1}
              strokeScaleEnabled={false}
              perfectDrawEnabled={false}
              listening={interactive}
              onMouseDown={interactive ? (e) => {
                if (e.evt.button !== 0) return;
                e.cancelBubble = true;
                onRoomClick!(r.id, e.evt.shiftKey);
              } : undefined}
            />
            {showLabels && (<>
              <Text
                x={c.x} y={c.y - 110}
                text={r.name}
                fontSize={150}
                fontFamily="Inter, system-ui, sans-serif"
                fontStyle="600"
                fill="#3a3f4a"
                align="center"
                width={2400} offsetX={1200}
                listening={false}
              />
              <Text
                x={c.x} y={c.y + 60}
                text={fmtArea(r.area)}
                fontSize={120}
                fontFamily="Inter, system-ui, sans-serif"
                fill="#7a6e54"
                align="center"
                width={2400} offsetX={1200}
                listening={false}
              />
            </>)}
          </Group>
        );
      })}

      {geometry.balcony && (() => {
        const b = geometry.balcony;
        const cb = polygonCentroid(b.polygon);
        const flat = b.polygon.flatMap((p) => [p.x, p.y]);
        return (
          <Group listening={false}>
            <Line
              points={flat}
              closed
              fill={ROOM_FILL.balcony}
              stroke="#bdb495"
              strokeWidth={1}
              strokeScaleEnabled={false}
              dash={[8, 6]}
              perfectDrawEnabled={false}
            />
            {showLabels && (<>
              <Text
                x={cb.x} y={cb.y - 80}
                text={b.name}
                fontSize={140}
                fontFamily="Inter, system-ui, sans-serif"
                fontStyle="600"
                fill="#5a523c"
                align="center"
                width={2400} offsetX={1200}
              />
              <Text
                x={cb.x} y={cb.y + 60}
                text={fmtArea(b.area)}
                fontSize={110}
                fontFamily="Inter, system-ui, sans-serif"
                fill="#8a7a5a"
                align="center"
                width={2400} offsetX={1200}
              />
            </>)}
          </Group>
        );
      })()}
    </Group>
  );
}
