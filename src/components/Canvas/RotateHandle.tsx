import { useEffect, useState } from 'react';
import { Group, Circle, Line } from 'react-konva';
import Konva from 'konva';
import type { PlacedObject } from '../../types';

interface Props {
  obj: PlacedObject;
  onRotate: (rotationDeg: number) => void;
}

// Visual handle для поворота: круг над объектом по нормали ширины,
// пользователь тащит — rotation меняется. Snap 15° (с Shift — без снапа).
export function RotateHandle({ obj, onRotate }: Props) {
  const [dragging, setDragging] = useState(false);
  const [shiftDown, setShiftDown] = useState(false);

  useEffect(() => {
    const k = (e: KeyboardEvent) => setShiftDown(e.shiftKey);
    window.addEventListener('keydown', k);
    window.addEventListener('keyup', k);
    return () => {
      window.removeEventListener('keydown', k);
      window.removeEventListener('keyup', k);
    };
  }, []);

  // Расстояние ручки от центра объекта (по нормали к фасадной стороне) — над фасадом
  const distance = obj.depth / 2 + 350;

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Не даём событию всплыть до родительского Group объекта — иначе его onDragMove
    // прочитает позицию ручки (Circle) и запишет её в obj.x/obj.y → объект «улетает» наверх.
    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (!stage) return;
    const local = stage.getRelativePointerPosition();
    if (!local) return;
    // Угол от центра объекта (obj.x, obj.y) до точки курсора
    const dx = local.x - obj.x;
    const dy = local.y - obj.y;
    // 0° когда «ручка» сверху (т.е. dy < 0). atan2 даёт 0 при векторе (1,0) — поэтому добавляем 90°.
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    // Нормализация в [0..360)
    deg = ((deg % 360) + 360) % 360;
    if (!shiftDown) deg = Math.round(deg / 15) * 15;
    onRotate(deg);
    // Возвращаем хэндл в свою позицию (мы не двигаем сам узел, только rotate)
    e.target.position({ x: 0, y: -distance });
  };

  return (
    <Group rotation={obj.rotation}>
      {/* Линия от центра объекта к ручке */}
      <Line
        points={[0, 0, 0, -distance]}
        stroke="#0f62fe"
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        dash={[6, 6]}
        listening={false}
      />
      <Circle
        x={0}
        y={-distance}
        radius={130}
        fill={dragging ? '#0f62fe' : '#fff'}
        stroke="#0f62fe"
        strokeWidth={3}
        strokeScaleEnabled={false}
        draggable
        onMouseDown={(e) => { e.cancelBubble = true; }}
        onDragStart={(e) => { setDragging(true); e.cancelBubble = true; }}
        onDragMove={handleDragMove}
        onDragEnd={(e) => { setDragging(false); e.cancelBubble = true; }}
        onMouseEnter={(e) => {
          const c = e.target.getStage()?.container();
          if (c) c.style.cursor = 'grab';
        }}
        onMouseLeave={(e) => {
          const c = e.target.getStage()?.container();
          if (c && !dragging) c.style.cursor = '';
        }}
      />
      {/* Иконка ↻ */}
      <Circle
        x={0}
        y={-distance}
        radius={50}
        fill="#0f62fe"
        listening={false}
      />
    </Group>
  );
}
