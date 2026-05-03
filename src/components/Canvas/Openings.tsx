import { Group, Line, Arc, Rect } from 'react-konva';
import type { ApartmentGeometry, Opening, Wall } from '../../types';
import { length, openingSegment } from '../../utils/geometry';

interface Props {
  geometry: ApartmentGeometry;
  showDoors?: boolean;
  showWindows?: boolean;
  selectedIds?: string[];
  onOpeningClick?: (id: string, additive: boolean) => void;
}

// Векторный рендер двери — работает на любой стене (горизонтальной, вертикальной, диагональной).
function DoorSwing({ wall, op, selected }: { wall: Wall; op: Opening; selected: boolean }) {
  const seg = openingSegment(wall, op);
  const { p1, p2, width: leafLen } = seg;

  // Вектор вдоль стены (касательная) и нормаль
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const wallLen = Math.hypot(dx, dy) || 1;
  const tx = dx / wallLen;
  const ty = dy / wallLen;
  const nx = -ty;
  const ny = tx;

  // Петля: 'right' — у p2, иначе у p1.
  const hingeAtP2 = op.swing === 'right';
  const hinge = hingeAtP2 ? p2 : p1;

  // Направление «закрытое полотно» — вдоль стены ОТ петли к другому краю проёма.
  const closedDir = hingeAtP2
    ? { x: -tx, y: -ty }
    : { x:  tx, y:  ty };

  // Направление «открытое полотно» — нормаль к стене.
  // hingeSide управляет стороной (внутрь/наружу комнаты).
  const side = op.hingeSide === 'in' ? 1 : -1;
  const openDir = { x: nx * side, y: ny * side };

  // Углы для Konva.Arc
  const closedAngle = Math.atan2(closedDir.y, closedDir.x) * 180 / Math.PI;
  const openAngle   = Math.atan2(openDir.y,   openDir.x)   * 180 / Math.PI;

  // Sweep — кратчайшая дуга между closedAngle и openAngle (≈90°).
  let sweep = openAngle - closedAngle;
  // Нормализация в (-180, 180]
  while (sweep >  180) sweep -= 360;
  while (sweep < -180) sweep += 360;

  // Стартовый угол арки = меньший из двух
  const startAngle = sweep >= 0 ? closedAngle : openAngle;
  const sweepAbs = Math.abs(sweep);

  // Конечная точка полотна
  const leafEnd = {
    x: hinge.x + openDir.x * leafLen,
    y: hinge.y + openDir.y * leafLen,
  };

  // Угол стены (для прорези)
  const wallAngleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
  const opMidX = (p1.x + p2.x) / 2;
  const opMidY = (p1.y + p2.y) / 2;

  return (
    <Group listening={false}>
      {/* Прорезь в стене — закрашиваем фоном пола */}
      <Rect
        x={opMidX}
        y={opMidY}
        width={leafLen}
        height={wall.thickness + 8}
        offsetX={leafLen / 2}
        offsetY={(wall.thickness + 8) / 2}
        rotation={wallAngleDeg}
        fill="#f8f5ee"
      />
      {/* Дуга открывания */}
      <Arc
        x={hinge.x}
        y={hinge.y}
        innerRadius={0}
        outerRadius={leafLen}
        angle={sweepAbs}
        rotation={startAngle}
        fill={selected ? 'rgba(15, 98, 254, 0.18)' : 'rgba(150, 120, 70, 0.08)'}
        stroke={selected ? '#0f62fe' : '#aa8a55'}
        strokeWidth={selected ? 2 : 1}
        strokeScaleEnabled={false}
        dash={[4, 4]}
        dashEnabled={true}
      />
      {/* Дверное полотно */}
      <Line
        points={[hinge.x, hinge.y, leafEnd.x, leafEnd.y]}
        stroke={selected ? '#0f62fe' : '#8b6f4d'}
        strokeWidth={selected ? 4 : 3}
        strokeScaleEnabled={false}
        lineCap="round"
      />
    </Group>
  );
}

function Window({ wall, op, selected }: { wall: Wall; op: Opening; selected: boolean }) {
  const seg = openingSegment(wall, op);
  const { p1, p2, width } = seg;
  const wallAngleDeg = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
  const opMidX = (p1.x + p2.x) / 2;
  const opMidY = (p1.y + p2.y) / 2;

  return (
    <Group listening={false}>
      {/* Заглушка стены */}
      <Rect
        x={opMidX}
        y={opMidY}
        width={width}
        height={wall.thickness + 4}
        offsetX={width / 2}
        offsetY={(wall.thickness + 4) / 2}
        rotation={wallAngleDeg}
        fill="#f8f5ee"
      />
      {/* Рама окна */}
      <Rect
        x={opMidX}
        y={opMidY}
        width={width}
        height={wall.thickness * 0.6}
        offsetX={width / 2}
        offsetY={wall.thickness * 0.3}
        rotation={wallAngleDeg}
        fill={selected ? '#bedaf0' : '#cfe7f5'}
        stroke={selected ? '#0f62fe' : '#4a8db5'}
        strokeWidth={selected ? 3 : 1}
        strokeScaleEnabled={false}
      />
      {/* Линия стекла */}
      <Line
        points={[p1.x, p1.y, p2.x, p2.y]}
        stroke={selected ? '#0f62fe' : '#2b6a8d'}
        strokeWidth={selected ? 3 : 2}
        strokeScaleEnabled={false}
      />
    </Group>
  );
}

// Невидимый прямоугольник-хитбокс над проёмом для кликов в режиме «Выбор».
function OpeningHitbox({ wall, op, onClick }: { wall: Wall; op: Opening; onClick: (id: string, additive: boolean) => void }) {
  const seg = openingSegment(wall, op);
  const { p1, p2, width } = seg;
  const wallAngleDeg = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
  const opMidX = (p1.x + p2.x) / 2;
  const opMidY = (p1.y + p2.y) / 2;
  // Для двери берём чуть шире — чтобы можно было целиться по дуге, а не только по полотну
  const hbHeight = (wall.thickness + 200) * (op.kind === 'door' ? 1.4 : 1.0);
  return (
    <Rect
      x={opMidX}
      y={opMidY}
      width={width + 80}
      height={hbHeight}
      offsetX={(width + 80) / 2}
      offsetY={hbHeight / 2}
      rotation={wallAngleDeg}
      fill="rgba(0,0,0,0.001)"
      strokeEnabled={false}
      onMouseDown={(e) => {
        if (e.evt.button !== 0) return;
        e.cancelBubble = true;
        onClick(op.id, e.evt.shiftKey);
      }}
      onMouseEnter={(e) => {
        const c = e.target.getStage()?.container();
        if (c) c.style.cursor = 'pointer';
      }}
      onMouseLeave={(e) => {
        const c = e.target.getStage()?.container();
        if (c) c.style.cursor = '';
      }}
    />
  );
}

export function Openings({
  geometry, showDoors = true, showWindows = true,
  selectedIds, onOpeningClick,
}: Props) {
  const interactive = !!onOpeningClick;
  const selected = selectedIds ?? [];
  return (
    <Group listening={interactive}>
      {geometry.openings.map((op) => {
        const wall = geometry.walls.find((w) => w.id === op.wallId);
        if (!wall) return null;
        if (length(wall.a, wall.b) === 0) return null;
        const isSel = selected.includes(op.id);
        if (op.kind === 'door') {
          if (!showDoors) return null;
          return (
            <Group key={op.id} listening={interactive}>
              <DoorSwing wall={wall} op={op} selected={isSel} />
              {interactive && <OpeningHitbox wall={wall} op={op} onClick={onOpeningClick!} />}
            </Group>
          );
        }
        if (!showWindows) return null;
        return (
          <Group key={op.id} listening={interactive}>
            <Window wall={wall} op={op} selected={isSel} />
            {interactive && <OpeningHitbox wall={wall} op={op} onClick={onOpeningClick!} />}
          </Group>
        );
      })}
    </Group>
  );
}
