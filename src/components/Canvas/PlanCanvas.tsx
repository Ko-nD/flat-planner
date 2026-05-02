import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Group, Line, Text, Circle } from 'react-konva';
import Konva from 'konva';
import { useProject } from '../../store/projectStore';
import { Walls } from './Walls';
import { Openings } from './Openings';
import { Rooms } from './Rooms';
import { Grid } from './Grid';
import { ObjectShape } from './ObjectShape';
import { DoorMarkers } from './DoorMarkers';
import { RotateHandle } from './RotateHandle';
import { GeometryHandles } from './GeometryHandles';
import { findCatalog, isMarker } from '../../catalog/catalog';
import { snap, pointInPolygon, nearestWall } from '../../utils/geometry';
import { useCanvasKeys } from './useCanvasInput';
import { newObjectId } from '../../store/projectStore';
import { fmtSize } from '../../utils/format';
import type { LayerId, PlacedObject } from '../../types';

const LAYER_ORDER: LayerId[] = [
  'plumbing','furniture','appliances','sockets','data','switches','lights','notes',
];

interface Size { width: number; height: number }

function useContainerSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 800, height: 600 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ width: r.width, height: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export function PlanCanvas() {
  useCanvasKeys();
  const [containerRef, size] = useContainerSize();

  const geometry = useProject((s) => s.geometry);
  const objects = useProject((s) => s.objects);
  const layerVisibility = useProject((s) => s.layerVisibility);
  const selectedIds = useProject((s) => s.selectedIds);
  const selectedWallIds = useProject((s) => s.selectedWallIds);
  const selectedRoomIds = useProject((s) => s.selectedRoomIds);
  const hoverId = useProject((s) => s.hoverId);
  const view = useProject((s) => s.view);
  const setView = useProject((s) => s.setView);
  const showGrid = useProject((s) => s.showGrid);
  const snapMm = useProject((s) => s.snapMm);
  const tool = useProject((s) => s.tool);
  const placeCatalogId = useProject((s) => s.placeCatalogId);
  const measure = useProject((s) => s.measure);
  const setMeasure = useProject((s) => s.setMeasure);
  const select = useProject((s) => s.select);
  const toggleSelect = useProject((s) => s.toggleSelect);
  const toggleSelectWall = useProject((s) => s.toggleSelectWall);
  const toggleSelectRoom = useProject((s) => s.toggleSelectRoom);
  const clearSelectWalls = useProject((s) => s.clearSelectWalls);
  const clearSelectRooms = useProject((s) => s.clearSelectRooms);
  const setHover = useProject((s) => s.setHover);
  const addObject = useProject((s) => s.addObject);
  const updateObject = useProject((s) => s.updateObject);
  const cancelPlacement = useProject((s) => s.cancelPlacement);
  const addWall = useProject((s) => s.addWall);
  const addRoom = useProject((s) => s.addRoom);
  const addOpening = useProject((s) => s.addOpening);

  const stageRef = useRef<Konva.Stage>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [panning, setPanning] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  // В режиме «🧱 Стена»: первая кликнутая точка
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  // В режиме «🏠 Комната»: накапливаемые точки полигона
  const [roomPoints, setRoomPoints] = useState<{ x: number; y: number }[]>([]);

  // Сброс in-progress при смене инструмента. Для комнаты с уже расставленными точками
  // спрашиваем подтверждение — обидно случайным кликом потерять 5 вершин полигона.
  useEffect(() => {
    if (tool !== 'wall-draw' && wallStart) setWallStart(null);
    if (tool !== 'room-draw' && roomPoints.length > 0) {
      if (roomPoints.length < 3 || confirm(`Сбросить ${roomPoints.length} расставленных вершин комнаты?`)) {
        setRoomPoints([]);
      }
    }
    // wallStart/roomPoints intentionally not in deps — это reset при смене tool, а не при смене стейта
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  // В режиме «Комната» подавляем браузерное контекстное меню — правая кнопка
  // используется для отмены текущего полигона.
  useEffect(() => {
    if (tool !== 'room-draw') return;
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => e.preventDefault();
    el.addEventListener('contextmenu', handler);
    return () => el.removeEventListener('contextmenu', handler);
  }, [tool, containerRef]);

  // ESC отменяет текущую недорисованную стену/комнату
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        if (wallStart) setWallStart(null);
        if (roomPoints.length) setRoomPoints([]);
      }
      if (e.key === 'Enter' && tool === 'room-draw' && roomPoints.length >= 3) {
        addRoom(roomPoints);
        setRoomPoints([]);
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [wallStart, roomPoints, tool, addRoom]);

  // Экспортируем Stage в окно для экспортных операций
  useEffect(() => {
    if (stageRef.current) {
      (window as any).__konvaStage = stageRef.current;
    }
  }, []);

  // Bounds для авто-центрирования при первом монтировании
  useEffect(() => {
    if (!size.width || !size.height) return;
    const padding = 60;
    const totalW = geometry.bounds.width + 500;       // запас на внешние стены
    const totalH = geometry.bounds.height + 500;
    const sx = (size.width - padding * 2) / totalW;
    const sy = (size.height - padding * 2) / totalH;
    const scale = Math.min(sx, sy) * 0.95;
    if (Math.abs(view.scale - scale) > 0.01 && view.offset.x === 60 && view.offset.y === 60) {
      setView({
        scale,
        offset: {
          x: (size.width - geometry.bounds.width * scale) / 2,
          y: padding,
        },
      });
    }
  }, [size.width, size.height, geometry.bounds.width, geometry.bounds.height, setView, view.scale, view.offset.x, view.offset.y]);

  // Space для пана
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
        setSpaceDown(true);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Зум на колесе — масштабируем относительно курсора, корректно при любом rotation
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = view.scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    // Локальные координаты под курсором (с учётом rotation)
    const local = stage.getRelativePointerPosition();
    if (!local) return;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.12;
    const newScale = Math.min(0.6, Math.max(0.005, oldScale * (direction > 0 ? factor : 1 / factor)));
    // Конвертация: вычисляем новый offset так, чтобы local-точка осталась под курсором
    const rad = (view.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = local.x * newScale;
    const dy = local.y * newScale;
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;
    const newOffset = {
      x: pointer.x - rotatedX,
      y: pointer.y - rotatedY,
    };
    setView({ scale: newScale, offset: newOffset });
  };

  // Получить мировые координаты под курсором с учётом rotation/scale/offset
  const pointerWorld = (): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    return stage.getRelativePointerPosition();
  };

  const snappedWorld = (): { x: number; y: number } | null => {
    const w = pointerWorld();
    if (!w) return null;
    if (snapMm > 0) {
      return { x: snap(w.x, snapMm), y: snap(w.y, snapMm) };
    }
    return w;
  };

  // Mouse handlers
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const target = e.target;
    const isStage = target === stage;
    const button = e.evt.button;

    // Pan: средняя кнопка, либо Space+левая, либо инструмент Pan
    if (button === 1 || (spaceDown && button === 0) || (tool === 'pan' && button === 0)) {
      setPanning(true);
      e.evt.preventDefault();
      return;
    }

    if (button === 0 && tool === 'measure') {
      const w = snappedWorld();
      if (!w) return;
      if (!measure) {
        setMeasure({ a: w, b: w });
      } else {
        setMeasure({ a: measure.a, b: w });
      }
      return;
    }

    // 🧱 Рисуем стену: 1-й клик — старт, 2-й — конец, добавляем wall.
    if (button === 0 && tool === 'wall-draw') {
      const w = snappedWorld();
      if (!w) return;
      if (!wallStart) {
        setWallStart(w);
      } else {
        // Игнорируем «нулевую» стену длиной < 50 мм
        if (Math.hypot(w.x - wallStart.x, w.y - wallStart.y) < 50) {
          setWallStart(null);
          return;
        }
        addWall(wallStart, w, 100);
        // Если зажат Shift — продолжаем цепочку от только что поставленной точки
        setWallStart(e.evt.shiftKey ? w : null);
      }
      return;
    }

    // 🏠 Рисуем комнату: каждый клик добавляет вершину; double-click рядом с первой точкой
    // или Enter завершает; правая кнопка отменяет.
    if (button === 0 && tool === 'room-draw') {
      const w = snappedWorld();
      if (!w) return;
      // Если кликнули рядом с первой точкой и точек ≥ 3 — закрываем
      if (roomPoints.length >= 3) {
        const first = roomPoints[0];
        if (Math.hypot(w.x - first.x, w.y - first.y) < 200) {
          addRoom(roomPoints);
          setRoomPoints([]);
          return;
        }
      }
      setRoomPoints([...roomPoints, w]);
      return;
    }
    if (button === 2 && tool === 'room-draw') {
      e.evt.preventDefault();
      if (roomPoints.length >= 3) {
        addRoom(roomPoints);
      }
      setRoomPoints([]);
      return;
    }

    // 🚪 / 🪟 Размещение проёма: клик рядом со стеной → проём в этой точке
    if (button === 0 && (tool === 'door-place' || tool === 'window-place')) {
      const w = pointerWorld();
      if (!w) return;
      const hit = nearestWall(w, geometry.walls, 800);
      if (!hit) return;
      const wallLen = Math.hypot(hit.wall.b.x - hit.wall.a.x, hit.wall.b.y - hit.wall.a.y);
      const opWidth = tool === 'door-place' ? 800 : 1500;
      // Стена слишком короткая для запрошенного проёма — пытаемся подогнать ширину,
      // и если совсем не лезет — ничего не ставим, чтобы не получить кашу.
      const minNeeded = 400; // минимально осмысленная ширина проёма
      if (wallLen < minNeeded + 40) {
        console.warn(`[opening] wall ${hit.wall.id} (${Math.round(wallLen)}мм) короче минимума, проём не поставлен`);
        return;
      }
      const actualWidth = Math.min(opWidth, Math.max(minNeeded, wallLen - 40));
      const halfW = actualWidth / 2;
      // offset вдоль стены в мм: проекция от точки a до projected
      const dx = hit.projected.x - hit.wall.a.x;
      const dy = hit.projected.y - hit.wall.a.y;
      const offset = Math.hypot(dx, dy);
      const safeOffset = Math.max(halfW + 20, Math.min(wallLen - halfW - 20, offset));
      addOpening({
        kind: tool === 'door-place' ? 'door' : 'window',
        wallId: hit.wall.id,
        offset: snapMm > 0 ? snap(safeOffset, snapMm) : safeOffset,
        width: actualWidth,
      });
      // По умолчанию остаёмся в режиме — можно сразу ставить ещё. Esc или клик на инструмент выйдет.
      return;
    }

    if (button === 0 && tool === 'place' && placeCatalogId) {
      const cat = findCatalog(placeCatalogId);
      if (!cat) return;
      const w = snappedWorld();
      if (!w) return;

      // Если объект wall-mounted — снапим к ближайшей стене
      let placeX = w.x;
      let placeY = w.y;
      let rotation = 0;
      if (cat.wallMounted) {
        const hit = nearestWall(w, geometry.walls, 2000);
        if (hit) {
          placeX = hit.projected.x;
          placeY = hit.projected.y;
          rotation = hit.angleDeg;
        }
      }

      const inRoom = geometry.rooms.find((r) => pointInPolygon({ x: placeX, y: placeY }, r.polygon));
      const obj: PlacedObject = {
        id: newObjectId(),
        catalogId: cat.id,
        layer: cat.layer,
        x: placeX,
        y: placeY,
        rotation,
        width: cat.width,
        depth: cat.depth,
        label: cat.name,
        mountHeight: cat.mountHeight,
        roomId: inRoom?.id,
        shapeData: cat.shapeData,
        corner: cat.shapeData?.corner,
      };
      addObject(obj);
      // Если зажат Shift — продолжаем размещать
      if (!e.evt.shiftKey) cancelPlacement();
      return;
    }

    // Клик по пустому месту — снять выделение
    if (button === 0 && isStage) {
      select([]);
      clearSelectWalls();
      clearSelectRooms();
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    if (panning) {
      const dx = e.evt.movementX;
      const dy = e.evt.movementY;
      setView({ offset: { x: view.offset.x + dx, y: view.offset.y + dy } });
      return;
    }

    const w = snappedWorld();
    if (w) setCursor(w);

    // Обновлять второй край измерительной линии при движении после клика
    if (tool === 'measure' && measure && e.evt.buttons === 0 && w) {
      setMeasure({ a: measure.a, b: w });
    }
  };

  const handleStageMouseUp = () => {
    setPanning(false);
  };

  // Перетаскивание объекта — обновление позиции с привязкой
  const onDragMove = (id: string) => (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    let x = node.x();
    let y = node.y();
    if (snapMm > 0) {
      x = snap(x, snapMm);
      y = snap(y, snapMm);
      node.position({ x, y });
    }
    updateObject(id, { x, y });
  };

  const visibleLayers = useMemo(() => {
    const set: Record<LayerId, boolean> = layerVisibility;
    return LAYER_ORDER.filter((l) => set[l]);
  }, [layerVisibility]);

  // Превью-объект под курсором при размещении
  const placePreview = useMemo(() => {
    if (tool !== 'place' || !placeCatalogId || !cursor) return null;
    const cat = findCatalog(placeCatalogId);
    if (!cat) return null;
    return { cat, cursor };
  }, [tool, placeCatalogId, cursor]);

  const cursorStyle = (() => {
    if (panning || spaceDown || tool === 'pan') return 'grabbing';
    if (tool === 'place') return 'crosshair';
    if (tool === 'measure') return 'crosshair';
    if (tool === 'wall-draw') return 'crosshair';
    if (tool === 'room-draw') return 'crosshair';
    if (tool === 'door-place' || tool === 'window-place') return 'crosshair';
    return 'default';
  })();

  // Размер «холста» — bounds квартиры (включая балкон)
  const totalDrawW = geometry.bounds.width;
  const totalDrawH = geometry.bounds.height;

  return (
    <div ref={containerRef} className="canvas-host" style={{ cursor: cursorStyle }}>
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scale={{ x: view.scale, y: view.scale }}
        x={view.offset.x}
        y={view.offset.y}
        rotation={view.rotation}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onMouseLeave={handleStageMouseUp}
      >
        {/* Слой подложки (сетка + комнаты) */}
        <Layer listening={false}>
          {/* Подложка пола — большой прямоугольник */}
          <Rect x={-200} y={-200} width={totalDrawW + 400} height={totalDrawH + 400} fill="#fbf7ec" />
          {showGrid && layerVisibility.walls && (
            <Grid width={totalDrawW} height={totalDrawH} step={100} bigEvery={5} />
          )}
        </Layer>

        {/* Комнаты (заливка + подписи), стены, проёмы. В режиме «select» — кликабельные. */}
        <Layer listening={tool === 'select'}>
          <Rooms
            geometry={geometry}
            showLabels={layerVisibility.labels}
            selectedIds={selectedRoomIds}
            onRoomClick={tool === 'select' ? toggleSelectRoom : undefined}
          />
          {layerVisibility.walls && (
            <Walls
              geometry={geometry}
              selectedIds={selectedWallIds}
              onWallClick={tool === 'select' ? toggleSelectWall : undefined}
            />
          )}
          {(layerVisibility.doors || layerVisibility.windows) && (
            <Openings
              geometry={geometry}
              showDoors={layerVisibility.doors}
              showWindows={layerVisibility.windows}
            />
          )}
          {/* DoorMarkers — debug fallback, рисуется только если в geometry есть doorMarkers */}
          {layerVisibility.doors && geometry.doorMarkers && geometry.doorMarkers.length > 0 && <DoorMarkers geometry={geometry} />}
        </Layer>

        {/* Объекты по слоям (z-порядок) */}
        <Layer>
          {visibleLayers.map((layerId) => (
            <Group key={layerId}>
              {objects
                .filter((o) => o.layer === layerId)
                .map((o) => {
                  const cat = findCatalog(o.catalogId);
                  const selected = selectedIds.includes(o.id);
                  const hovered = hoverId === o.id;
                  return (
                    <Group
                      key={o.id}
                      x={o.x}
                      y={o.y}
                      draggable={tool === 'select' || tool === 'place'}
                      onDragStart={(e) => {
                        if (!selectedIds.includes(o.id)) select([o.id]);
                        e.cancelBubble = true;
                      }}
                      onDragMove={onDragMove(o.id)}
                      onMouseDown={(e) => {
                        if (tool !== 'select') return;
                        e.cancelBubble = true;
                        toggleSelect(o.id, e.evt.shiftKey);
                      }}
                      onMouseEnter={() => setHover(o.id)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <ObjectShape
                        obj={o}
                        catalog={cat}
                        selected={selected}
                        hovered={hovered}
                        showLabel={!isMarker(o.layer) || selected || hovered}
                      />
                      {/* Visual rotate handle для одиночно выбранного нет-маркер объекта */}
                      {selected && selectedIds.length === 1 && !isMarker(o.layer) && (
                        <RotateHandle obj={o} onRotate={(deg) => updateObject(o.id, { rotation: deg })} />
                      )}
                    </Group>
                  );
                })}
            </Group>
          ))}
        </Layer>

        {/* Хэндлы для drag-редактирования геометрии (видны в select при выделении) */}
        <Layer>
          <GeometryHandles />
        </Layer>

        {/* Слой превью / измерения */}
        <Layer listening={false}>
          {placePreview && (
            <Group x={placePreview.cursor.x} y={placePreview.cursor.y} opacity={0.55}>
              <ObjectShape
                obj={{
                  id: '_preview',
                  catalogId: placePreview.cat.id,
                  layer: placePreview.cat.layer,
                  x: 0, y: 0, rotation: 0,
                  width: placePreview.cat.width,
                  depth: placePreview.cat.depth,
                  label: placePreview.cat.name,
                  mountHeight: placePreview.cat.mountHeight,
                }}
                catalog={placePreview.cat}
                selected={false}
                hovered
                showLabel
              />
            </Group>
          )}
          {/* Превью размещения проёма: подсветка ближайшей стены и точки */}
          {(tool === 'door-place' || tool === 'window-place') && cursor && (() => {
            const hit = nearestWall(cursor, geometry.walls, 800);
            if (!hit) return null;
            const isWindow = tool === 'window-place';
            const opWidth = isWindow ? 1500 : 800;
            const color = isWindow ? '#0c8b73' : '#b35900';
            const label = isWindow ? '🪟 окно (1500 мм)' : '🚪 дверь (800 мм)';
            // Концы будущего проёма на оси стены
            const ang = (hit.angleDeg * Math.PI) / 180;
            const half = opWidth / 2;
            const ax = hit.projected.x - Math.cos(ang) * half;
            const ay = hit.projected.y - Math.sin(ang) * half;
            const bx = hit.projected.x + Math.cos(ang) * half;
            const by = hit.projected.y + Math.sin(ang) * half;
            return (
              <Group>
                <Line
                  points={[hit.wall.a.x, hit.wall.a.y, hit.wall.b.x, hit.wall.b.y]}
                  stroke={color}
                  strokeWidth={4}
                  strokeScaleEnabled={false}
                  opacity={0.4}
                />
                <Line
                  points={[ax, ay, bx, by]}
                  stroke={color}
                  strokeWidth={6}
                  strokeScaleEnabled={false}
                />
                <Circle x={hit.projected.x} y={hit.projected.y} radius={120} fill={color} stroke="#fff" strokeWidth={3} strokeScaleEnabled={false} />
                <Text
                  x={hit.projected.x}
                  y={hit.projected.y - 380}
                  text={label}
                  fontSize={170}
                  fontFamily="Inter, system-ui"
                  fontStyle="600"
                  fill={color}
                  align="center"
                  width={4000}
                  offsetX={2000}
                />
              </Group>
            );
          })()}
          {/* Превью рисуемой стены */}
          {tool === 'wall-draw' && wallStart && cursor && (
            <Group>
              <Line
                points={[wallStart.x, wallStart.y, cursor.x, cursor.y]}
                stroke="#ff7a00"
                strokeWidth={3}
                strokeScaleEnabled={false}
                dash={[18, 8]}
              />
              <Circle x={wallStart.x} y={wallStart.y} radius={120} fill="#ff7a00" stroke="#fff" strokeWidth={3} strokeScaleEnabled={false} />
              <Circle x={cursor.x} y={cursor.y} radius={120} stroke="#ff7a00" strokeWidth={3} strokeScaleEnabled={false} />
              <Text
                x={(wallStart.x + cursor.x) / 2}
                y={(wallStart.y + cursor.y) / 2 - 320}
                text={fmtSize(Math.hypot(cursor.x - wallStart.x, cursor.y - wallStart.y))}
                fontSize={170}
                fontFamily="Inter, system-ui"
                fontStyle="600"
                fill="#ff7a00"
                align="center"
                width={3000}
                offsetX={1500}
              />
            </Group>
          )}
          {/* Превью рисуемой комнаты */}
          {tool === 'room-draw' && roomPoints.length > 0 && (
            <Group>
              <Line
                points={[
                  ...roomPoints.flatMap((p) => [p.x, p.y]),
                  ...(cursor ? [cursor.x, cursor.y] : []),
                  ...(roomPoints.length >= 2 && roomPoints[0] ? [roomPoints[0].x, roomPoints[0].y] : []),
                ]}
                stroke="#7a3cc8"
                strokeWidth={2.5}
                strokeScaleEnabled={false}
                dash={[14, 6]}
                fill={roomPoints.length >= 3 ? 'rgba(122,60,200,0.08)' : undefined}
                closed={roomPoints.length >= 3}
              />
              {roomPoints.map((p, i) => (
                <Circle key={i} x={p.x} y={p.y} radius={i === 0 ? 150 : 110} fill={i === 0 ? '#7a3cc8' : '#fff'} stroke="#7a3cc8" strokeWidth={3} strokeScaleEnabled={false} />
              ))}
            </Group>
          )}
          {measure && (() => {
            const dx = measure.b.x - measure.a.x;
            const dy = measure.b.y - measure.a.y;
            const dist = Math.hypot(dx, dy);
            const mid = { x: (measure.a.x + measure.b.x) / 2, y: (measure.a.y + measure.b.y) / 2 };
            return (
              <Group>
                <Line
                  points={[measure.a.x, measure.a.y, measure.b.x, measure.b.y]}
                  stroke="#0d8c43"
                  strokeWidth={2.5}
                  strokeScaleEnabled={false}
                  dash={[14, 6]}
                />
                <Circle x={measure.a.x} y={measure.a.y} radius={80} stroke="#0d8c43" strokeWidth={2} strokeScaleEnabled={false} />
                <Circle x={measure.b.x} y={measure.b.y} radius={80} stroke="#0d8c43" strokeWidth={2} strokeScaleEnabled={false} />
                <Text
                  x={mid.x}
                  y={mid.y - 250}
                  text={fmtSize(dist)}
                  fontSize={170}
                  fontFamily="Inter, system-ui"
                  fontStyle="600"
                  fill="#0d8c43"
                  align="center"
                  width={3000}
                  offsetX={1500}
                />
              </Group>
            );
          })()}
        </Layer>
      </Stage>
    </div>
  );
}
