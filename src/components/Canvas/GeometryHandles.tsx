import { Circle, Group, Line } from 'react-konva';
import Konva from 'konva';
import { useProject } from '../../store/projectStore';
import { snap } from '../../utils/geometry';

// Handle = маркер, перетаскивая который пользователь правит геометрию.
// Размеры в мм (мировые координаты), strokeScaleEnabled=false → визуально константный.
const HANDLE_RADIUS = 140;
const HANDLE_FILL = '#fff';
const HANDLE_STROKE = '#0f62fe';

export function GeometryHandles() {
  const tool = useProject((s) => s.tool);
  const geometry = useProject((s) => s.geometry);
  const selectedWallIds = useProject((s) => s.selectedWallIds);
  const selectedRoomIds = useProject((s) => s.selectedRoomIds);
  const beginGeometryEdit = useProject((s) => s.beginGeometryEdit);
  const updateWallEndpointLive = useProject((s) => s.updateWallEndpointLive);
  const updateRoomVertexLive = useProject((s) => s.updateRoomVertexLive);
  const snapMm = useProject((s) => s.snapMm);

  // Хэндлы видим только в режиме «Выбор»
  if (tool !== 'select') return null;

  const selectedWalls = geometry.walls.filter((w) => selectedWallIds.includes(w.id));
  const selectedRooms = geometry.rooms.filter((r) => selectedRoomIds.includes(r.id));

  const snapPoint = (x: number, y: number) =>
    snapMm > 0 ? { x: snap(x, snapMm), y: snap(y, snapMm) } : { x, y };

  // Drag wall endpoint
  const onWallEndpointDrag = (wallId: string, end: 'a' | 'b') =>
    (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      const node = e.target;
      const p = snapPoint(node.x(), node.y());
      // Не даём узлу разъехаться с реальной координатой (snap)
      node.position(p);
      updateWallEndpointLive(wallId, end, p);
    };

  const onRoomVertexDrag = (roomId: string, vertexIdx: number) =>
    (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      const node = e.target;
      const p = snapPoint(node.x(), node.y());
      node.position(p);
      updateRoomVertexLive(roomId, vertexIdx, p);
    };

  return (
    <Group>
      {/* Стены: подсвечиваем ось + два маркера на концах */}
      {selectedWalls.map((w) => (
        <Group key={`w-${w.id}`}>
          <Line
            points={[w.a.x, w.a.y, w.b.x, w.b.y]}
            stroke={HANDLE_STROKE}
            strokeWidth={2}
            strokeScaleEnabled={false}
            dash={[18, 8]}
            listening={false}
          />
          {(['a', 'b'] as const).map((end) => {
            const p = w[end];
            return (
              <Circle
                key={end}
                x={p.x}
                y={p.y}
                radius={HANDLE_RADIUS}
                fill={HANDLE_FILL}
                stroke={HANDLE_STROKE}
                strokeWidth={3}
                strokeScaleEnabled={false}
                draggable
                onMouseDown={(e) => { e.cancelBubble = true; beginGeometryEdit(); }}
                onDragMove={onWallEndpointDrag(w.id, end)}
                onMouseEnter={(e) => {
                  const c = e.target.getStage()?.container();
                  if (c) c.style.cursor = 'grab';
                }}
                onMouseLeave={(e) => {
                  const c = e.target.getStage()?.container();
                  if (c) c.style.cursor = '';
                }}
              />
            );
          })}
        </Group>
      ))}

      {/* Комнаты: маркер на каждой вершине полигона */}
      {selectedRooms.map((r) => (
        <Group key={`r-${r.id}`}>
          {r.polygon.map((p, i) => (
            <Circle
              key={i}
              x={p.x}
              y={p.y}
              radius={HANDLE_RADIUS}
              fill={HANDLE_FILL}
              stroke={HANDLE_STROKE}
              strokeWidth={3}
              strokeScaleEnabled={false}
              draggable
              onMouseDown={(e) => { e.cancelBubble = true; beginGeometryEdit(); }}
              onDragMove={onRoomVertexDrag(r.id, i)}
              onMouseEnter={(e) => {
                const c = e.target.getStage()?.container();
                if (c) c.style.cursor = 'grab';
              }}
              onMouseLeave={(e) => {
                const c = e.target.getStage()?.container();
                if (c) c.style.cursor = '';
              }}
            />
          ))}
        </Group>
      ))}
    </Group>
  );
}
