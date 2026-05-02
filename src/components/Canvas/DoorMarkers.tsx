import { Group, Text, Rect } from 'react-konva';
import type { ApartmentGeometry } from '../../types';

interface Props {
  geometry: ApartmentGeometry;
}

// Текстовые подписи дверей — для проёмов на скошенных стенах,
// где обычная дверная дуга рисуется криво. Лучше временно без дуг.
export function DoorMarkers({ geometry }: Props) {
  const markers = geometry.doorMarkers ?? [];
  if (!markers.length) return null;
  return (
    <Group listening={false}>
      {markers.map((m) => {
        const width = 1100;
        const height = 320;
        return (
          <Group key={m.id} x={m.x} y={m.y} rotation={m.rotation}>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill="#fff8e6"
              stroke="#aa8a55"
              strokeWidth={1.5}
              strokeScaleEnabled={false}
              cornerRadius={20}
            />
            <Text
              text={m.label}
              fontSize={170}
              fontFamily="Inter, system-ui"
              fontStyle="600"
              fill="#7a5a18"
              align="center"
              verticalAlign="middle"
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
            />
          </Group>
        );
      })}
    </Group>
  );
}
