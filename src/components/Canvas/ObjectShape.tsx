import { useMemo } from 'react';
import { Group, Rect, Circle, Line, Text, Ellipse } from 'react-konva';
import type { CatalogItem, CatalogSymbol, LCorner, PlacedObject } from '../../types';
import { LAYER_COLOR, isMarker } from '../../catalog/catalog';
import { TRANSFORMER_DIMS } from '../../catalog/transformer';
import { fmtDims, fmtHeight } from '../../utils/format';

interface Props {
  obj: PlacedObject;
  catalog?: CatalogItem;
  selected: boolean;
  hovered: boolean;
  showLabel: boolean;
}

// Маркер «выключатель» с переменным числом клавиш и опционально проходной.
// 1кл → один рычажок, 2кл → два параллельных, 3кл → три. Проходной — добавляется
// небольшой шеврон-«стрелка» в конце рычажка (международный знак возвратной коммутации).
function SwitchMarker({ keys, pass, size, color }: { keys: number; pass: boolean; size: number; color: string }) {
  const r = size / 2;
  const k = Math.max(1, Math.min(4, keys));
  // Направление рычажка: диагональ 45° (стандартное обозначение «бросок»).
  const ang = -Math.PI / 4;
  const lv = { x: Math.cos(ang), y: Math.sin(ang) };
  // Перпендикуляр — для расстановки нескольких рычажков рядом
  const perp = { x: -lv.y, y: lv.x };
  const leverLen = r * 1.55;
  const totalSpread = r * 0.55;
  const spacing = k > 1 ? totalSpread / (k - 1) : 0;
  const startOffset = -totalSpread / 2;
  return (
    <>
      <Circle radius={r} fill="#fff" stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
      {Array.from({ length: k }).map((_, i) => {
        const t = startOffset + i * spacing;
        const cx = perp.x * t;
        const cy = perp.y * t;
        const x1 = cx - lv.x * leverLen / 2;
        const y1 = cy - lv.y * leverLen / 2;
        const x2 = cx + lv.x * leverLen / 2;
        const y2 = cy + lv.y * leverLen / 2;
        return (
          <Group key={i}>
            <Line points={[x1, y1, x2, y2]} stroke={color} strokeWidth={2.2} strokeScaleEnabled={false} lineCap="round" />
            {/* Шарик-«ось» в начале рычажка */}
            <Circle x={x1} y={y1} radius={r * 0.13} fill={color} />
            {/* Шеврон ↗ в конце рычажка для проходного выключателя */}
            {pass && (
              <>
                <Line
                  points={[
                    x2, y2,
                    x2 - lv.x * r * 0.28 + perp.x * r * 0.18,
                    y2 - lv.y * r * 0.28 + perp.y * r * 0.18,
                  ]}
                  stroke={color}
                  strokeWidth={2}
                  strokeScaleEnabled={false}
                  lineCap="round"
                />
                <Line
                  points={[
                    x2, y2,
                    x2 - lv.x * r * 0.28 - perp.x * r * 0.18,
                    y2 - lv.y * r * 0.28 - perp.y * r * 0.18,
                  ]}
                  stroke={color}
                  strokeWidth={2}
                  strokeScaleEnabled={false}
                  lineCap="round"
                />
              </>
            )}
          </Group>
        );
      })}
    </>
  );
}

// Парсер catalogId выключателя — определяет число клавиш и «проходной»-флаг.
function parseSwitchType(catalogId?: string): { keys: number; pass: boolean } {
  if (!catalogId) return { keys: 1, pass: false };
  const passMatch = catalogId.match(/^switch-pass(?:-(\d+))?$/);
  if (passMatch) return { keys: passMatch[1] ? +passMatch[1] : 1, pass: true };
  const numMatch = catalogId.match(/^switch-(\d+)$/);
  if (numMatch) return { keys: +numMatch[1], pass: false };
  return { keys: 1, pass: false };
}

// Маркер «розетка» с переменным числом посадочных мест.
// 1 место → одиночная, 2 → двойная, 3 → тройная и т.д. Корпус вытянут вдоль ширины.
function SocketMarker({ count, w, d, color }: { count: number; w: number; d: number; color: string }) {
  const c = Math.max(1, Math.min(8, Math.round(count)));
  // «Юнит» — один посадочный кружок. Радиус зависит от меньшей стороны и числа юнитов.
  const unitR = Math.min(d * 0.42, (w / c) * 0.42);
  const positions: number[] = c === 1
    ? [0]
    : Array.from({ length: c }, (_, i) => -w / 2 + (w / c) * (i + 0.5));
  return (
    <>
      {/* Корпус: stadium-shape — закруглённый прямоугольник по ширине рамки */}
      <Rect
        x={-w / 2}
        y={-d / 2}
        width={w}
        height={d}
        cornerRadius={d / 2}
        fill="#fff"
        stroke={color}
        strokeWidth={1.5}
        strokeScaleEnabled={false}
      />
      {/* Перегородки между юнитами */}
      {c > 1 && positions.slice(0, -1).map((p, i) => {
        const next = positions[i + 1];
        const x = (p + next) / 2;
        return (
          <Line
            key={`sep-${i}`}
            points={[x, -d / 2 + 8, x, d / 2 - 8]}
            stroke={color}
            strokeWidth={1}
            strokeScaleEnabled={false}
            dash={[4, 4]}
          />
        );
      })}
      {/* Сами «гнёзда»: круг + вертикаль (контакт земли) + 2 коротких лепестка по бокам */}
      {positions.map((cx, i) => (
        <Group key={i} x={cx}>
          <Circle radius={unitR} fill="#fff" stroke={color} strokeWidth={1.8} strokeScaleEnabled={false} />
          <Line points={[0, -unitR * 0.85, 0, unitR * 0.85]} stroke={color} strokeWidth={1.8} strokeScaleEnabled={false} />
          <Line points={[-unitR * 0.5, -unitR * 0.4, -unitR * 0.5, unitR * 0.4]} stroke={color} strokeWidth={1.6} strokeScaleEnabled={false} />
          <Line points={[unitR * 0.5, -unitR * 0.4, unitR * 0.5, unitR * 0.4]} stroke={color} strokeWidth={1.6} strokeScaleEnabled={false} />
        </Group>
      ))}
    </>
  );
}

// Маркер (электрика, заметки) — фиксированный значок ~250 мм
function MarkerShape({ kind, size, color }: { kind: CatalogSymbol; size: number; color: string }) {
  const r = size / 2;

  switch (kind) {
    case 'socket':
      // Старый одиночный круг — оставляем как fallback, основной путь в SocketMarker.
      return (
        <>
          <Circle radius={r} fill="#fff" stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Line points={[0, -r * 0.85, 0, r * 0.85]} stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Line points={[-r * 0.5, -r * 0.4, -r * 0.5, r * 0.4]} stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Line points={[r * 0.5, -r * 0.4, r * 0.5, r * 0.4]} stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
        </>
      );
    case 'switch':
      return (
        <>
          <Circle radius={r} fill="#fff" stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Line points={[-r * 0.6, r * 0.3, r * 0.6, -r * 0.6]} stroke={color} strokeWidth={2.5} strokeScaleEnabled={false} lineCap="round" />
          <Circle x={-r * 0.6} y={r * 0.3} radius={r * 0.18} fill={color} />
        </>
      );
    case 'dimmer':
      return (
        <>
          <Circle radius={r} fill="#fff" stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Line points={[0, 0, r * 0.7, -r * 0.5]} stroke={color} strokeWidth={3} strokeScaleEnabled={false} lineCap="round" />
          <Circle radius={r * 0.18} fill={color} />
        </>
      );
    case 'light':
      return (
        <>
          <Circle radius={r} fill="#fff" stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Line points={[-r * 0.7, -r * 0.7, r * 0.7, r * 0.7]} stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Line points={[r * 0.7, -r * 0.7, -r * 0.7, r * 0.7]} stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
        </>
      );
    case 'spotlight':
      return (
        <>
          <Circle radius={r} fill="#fff" stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Circle radius={r * 0.45} fill={color} />
        </>
      );
    case 'sconce':
      return (
        <>
          <Line
            points={[-r, 0, -r * 0.7, -r * 0.7, 0, -r, r * 0.7, -r * 0.7, r, 0]}
            stroke={color} strokeWidth={2} strokeScaleEnabled={false}
            tension={0.4} closed={false}
          />
          <Line points={[-r, 0, r, 0]} stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
        </>
      );
    case 'tv-socket':
      return (
        <>
          <Circle radius={r} fill="#fff" stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Text text="TV" fontSize={r * 1.2} fontFamily="Inter, system-ui" fontStyle="700" fill={color} offsetX={r * 0.7} offsetY={r * 0.6} listening={false} />
        </>
      );
    case 'rj45':
      return (
        <>
          <Circle radius={r} fill="#fff" stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Text text="LAN" fontSize={r * 0.95} fontFamily="Inter, system-ui" fontStyle="700" fill={color} offsetX={r * 0.85} offsetY={r * 0.5} listening={false} />
        </>
      );
    case 'antenna':
      return (
        <>
          <Circle radius={r} fill="#fff" stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Text text="ANT" fontSize={r * 0.9} fontFamily="Inter, system-ui" fontStyle="700" fill={color} offsetX={r * 0.85} offsetY={r * 0.5} listening={false} />
        </>
      );
    case 'thermostat':
      return (
        <>
          <Circle radius={r} fill="#fff" stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Text text="°C" fontSize={r * 1.0} fontFamily="Inter, system-ui" fontStyle="700" fill={color} offsetX={r * 0.5} offsetY={r * 0.55} listening={false} />
        </>
      );
    case 'note':
      return (
        <>
          <Rect x={-r} y={-r} width={size} height={size} cornerRadius={6} fill="#fff5e1" stroke={color} strokeWidth={2} strokeScaleEnabled={false} />
          <Text text="!" fontSize={r * 1.5} fontFamily="Inter, system-ui" fontStyle="700" fill={color} offsetX={r * 0.18} offsetY={r * 0.85} listening={false} />
        </>
      );
    case 'circle':
      return <Circle radius={r} fill={color} stroke="#1d2026" strokeWidth={1} strokeScaleEnabled={false} />;
    default:
      return <Circle radius={r} fill={color} />;
  }
}

// Силуэт мебели поверх контура (сам контур рисуется отдельно)
function FurnitureIcon({ symbol, w, d }: { symbol: CatalogSymbol; w: number; d: number }) {
  const cx = 0, cy = 0;
  const stroke = '#9a8e6f';
  const fillSoft = 'rgba(154, 142, 111, 0.18)';

  switch (symbol) {
    case 'bed-icon': {
      // Зона подушек по короткой стороне (та, что меньше)
      const horizontal = w >= d;
      const pillowDepth = Math.min(w, d) * 0.22;
      if (horizontal) {
        return (
          <>
            {/* подушки слева */}
            <Rect x={-w/2 + 60} y={-d/2 + 60} width={pillowDepth} height={d - 120} fill={fillSoft} stroke={stroke} strokeWidth={1.5} strokeScaleEnabled={false} cornerRadius={20} />
            {/* одеяло */}
            <Line points={[-w/2 + 60 + pillowDepth + 80, -d/2 + 80, -w/2 + 60 + pillowDepth + 80, d/2 - 80]} stroke={stroke} strokeWidth={1.5} strokeScaleEnabled={false} dash={[20, 16]} />
          </>
        );
      } else {
        return (
          <>
            <Rect x={-w/2 + 60} y={-d/2 + 60} width={w - 120} height={pillowDepth} fill={fillSoft} stroke={stroke} strokeWidth={1.5} strokeScaleEnabled={false} cornerRadius={20} />
            <Line points={[-w/2 + 80, -d/2 + 60 + pillowDepth + 80, w/2 - 80, -d/2 + 60 + pillowDepth + 80]} stroke={stroke} strokeWidth={1.5} strokeScaleEnabled={false} dash={[20, 16]} />
          </>
        );
      }
    }
    case 'sofa-icon': {
      // Спинка по верхней стороне (длинная), подлокотники по бокам
      const backDepth = d * 0.25;
      const armWidth = w * 0.08;
      return (
        <>
          {/* спинка */}
          <Rect x={-w/2 + 40} y={-d/2 + 40} width={w - 80} height={backDepth} fill={fillSoft} stroke={stroke} strokeWidth={1.5} strokeScaleEnabled={false} cornerRadius={12} />
          {/* левый подлокотник */}
          <Rect x={-w/2 + 40} y={-d/2 + 40 + backDepth} width={armWidth} height={d - 80 - backDepth} fill={fillSoft} stroke={stroke} strokeWidth={1.5} strokeScaleEnabled={false} cornerRadius={8} />
          {/* правый подлокотник */}
          <Rect x={w/2 - 40 - armWidth} y={-d/2 + 40 + backDepth} width={armWidth} height={d - 80 - backDepth} fill={fillSoft} stroke={stroke} strokeWidth={1.5} strokeScaleEnabled={false} cornerRadius={8} />
        </>
      );
    }
    case 'table-icon': {
      // Просто внутренний контур + диагональ
      return (
        <Rect x={-w/2 + 80} y={-d/2 + 80} width={w - 160} height={d - 160} fill="transparent" stroke={stroke} strokeWidth={1.5} strokeScaleEnabled={false} dash={[12, 8]} />
      );
    }
    case 'chair-icon': {
      // Спинка + сиденье
      return (
        <>
          <Rect x={-w/2 + 40} y={-d/2 + 40} width={w - 80} height={d * 0.2} fill={fillSoft} stroke={stroke} strokeWidth={1.5} strokeScaleEnabled={false} cornerRadius={8} />
          <Circle x={cx} y={cy + d * 0.15} radius={Math.min(w, d) * 0.25} fill="transparent" stroke={stroke} strokeWidth={1.5} strokeScaleEnabled={false} dash={[10, 6]} />
        </>
      );
    }
    case 'tv-icon': {
      // Полоска экрана внутри тонкого прямоугольника
      return (
        <Rect x={-w/2 + 30} y={-d/2 + 15} width={w - 60} height={d - 30} fill="#1d2026" stroke={stroke} strokeWidth={1} strokeScaleEnabled={false} cornerRadius={4} />
      );
    }
    case 'breezer-icon': {
      // Решётка с горизонтальными линиями + стрелочки притока
      const lines: number[][] = [];
      const n = 4;
      for (let i = 0; i < n; i++) {
        const y = -d/2 + 30 + ((d - 60) * (i + 0.5)) / n;
        lines.push([-w/2 + 40, y, w/2 - 40, y]);
      }
      return (
        <>
          {lines.map((p, i) => (
            <Line key={i} points={p} stroke={stroke} strokeWidth={2} strokeScaleEnabled={false} />
          ))}
          {/* стрелочка притока сверху по центру */}
          <Line points={[0, -d/2 - 50, 0, -d/2 - 10]} stroke={stroke} strokeWidth={3} strokeScaleEnabled={false} lineCap="round" />
          <Line points={[-30, -d/2 - 25, 0, -d/2 - 60, 30, -d/2 - 25]} stroke={stroke} strokeWidth={3} strokeScaleEnabled={false} lineCap="round" />
        </>
      );
    }
    default:
      return null;
  }
}

// Универсальная L-форма (используется и для дивана, и для произвольных пользовательских L-предметов).
// legA — толщина горизонтальной «ноги», legB — вертикальной. Если не заданы — 40% от меньшей стороны.
// Точка для размещения текстовой подписи внутри L-формы. У L bbox-центр часто
// попадает в «пустой» угол — нужно явно выбрать центр одного из плечей.
function lLabelBox(w: number, d: number, corner: LCorner, legA?: number, legB?: number) {
  const lA = legA ?? Math.min(w, d) * 0.4;
  const lB = legB ?? Math.min(w, d) * 0.4;
  // Площадь горизонтального плеча vs вертикального — выбираем «жирнее»
  const hArea = w * lA;
  const vArea = lB * d;
  const useH = hArea >= vArea;
  if (useH) {
    // Горизонтальное плечо (вверху или внизу) — Y зависит от corner
    const cy = (corner === 'tl' || corner === 'tr') ? -d / 2 + lA / 2 : d / 2 - lA / 2;
    return { cx: 0, cy, bw: w, bh: lA };
  }
  // Вертикальное плечо (слева или справа) — X зависит от corner
  const cx = (corner === 'tl' || corner === 'bl') ? -w / 2 + lB / 2 : w / 2 - lB / 2;
  return { cx, cy: 0, bw: lB, bh: d };
}

function buildLPolygon(w: number, d: number, corner: LCorner, legA?: number, legB?: number): number[] {
  const lA = legA ?? Math.min(w, d) * 0.4; // толщина для нижней/верхней ноги (по горизонтали)
  const lB = legB ?? Math.min(w, d) * 0.4; // толщина для левой/правой ноги (по вертикали)
  switch (corner) {
    case 'bl':
      // L открыт в нижне-левый угол → широкий внизу + узкий слева вверх
      return [
        -w/2,        -d/2,
        -w/2 + lB,   -d/2,
        -w/2 + lB,   d/2 - lA,
         w/2,        d/2 - lA,
         w/2,        d/2,
        -w/2,        d/2,
      ];
    case 'br':
      return [
         w/2 - lB,   -d/2,
         w/2,        -d/2,
         w/2,         d/2,
        -w/2,         d/2,
        -w/2,         d/2 - lA,
         w/2 - lB,    d/2 - lA,
      ];
    case 'tl':
      return [
        -w/2,         -d/2,
         w/2,         -d/2,
         w/2,         -d/2 + lA,
        -w/2 + lB,    -d/2 + lA,
        -w/2 + lB,     d/2,
        -w/2,          d/2,
      ];
    case 'tr':
    default:
      return [
        -w/2,        -d/2,
         w/2,        -d/2,
         w/2,         d/2,
         w/2 - lB,    d/2,
         w/2 - lB,   -d/2 + lA,
        -w/2,        -d/2 + lA,
      ];
  }
}

function LShapeGeneric({ w, d, corner = 'bl', legA, legB, selected, color }: {
  w: number; d: number; corner?: LCorner; legA?: number; legB?: number; selected: boolean; color: string;
}) {
  const points = buildLPolygon(w, d, corner, legA, legB);
  return (
    <Line
      points={points}
      closed
      fill="#e9e0c5"
      stroke={selected ? '#0f62fe' : color}
      strokeWidth={selected ? 3 : 1.5}
      strokeScaleEnabled={false}
      opacity={0.92}
    />
  );
}

// Произвольный полигон (точки относительно центра объекта)
function PolygonShape({ points, selected, color }: { points: { x: number; y: number }[]; selected: boolean; color: string }) {
  if (!points || points.length < 3) return null;
  const flat = points.flatMap((p) => [p.x, p.y]);
  return (
    <Line
      points={flat}
      closed
      fill="#e9e0c5"
      stroke={selected ? '#0f62fe' : color}
      strokeWidth={selected ? 3 : 1.5}
      strokeScaleEnabled={false}
      opacity={0.92}
    />
  );
}

// L-образный диван (специфичная версия с пунктирной спинкой)
function LSofaShape({ w, d, corner = 'bl', selected, color }: { w: number; d: number; corner?: LCorner; selected: boolean; color: string }) {
  // Толщина «ног» L — 40% от меньшей стороны
  const leg = Math.min(w, d) * 0.4;
  // Угол располагается в одном из 4 положений; полигон описываем CCW
  // Базовая система: x: -w/2..w/2, y: -d/2..d/2
  // По умолчанию corner='bl' — внутренний угол слева-внизу, длинная нога вправо, короткая вверх
  const points: number[] = (() => {
    switch (corner) {
      case 'bl':
        return [
          -w/2, -d/2,
          -w/2 + leg, -d/2,
          -w/2 + leg, d/2 - leg,
           w/2,        d/2 - leg,
           w/2,        d/2,
          -w/2,        d/2,
        ];
      case 'br':
        return [
           w/2, -d/2,
           w/2,        d/2,
          -w/2,        d/2,
          -w/2,        d/2 - leg,
           w/2 - leg,  d/2 - leg,
           w/2 - leg, -d/2,
        ];
      case 'tl':
        return [
          -w/2, -d/2,
           w/2, -d/2,
           w/2, -d/2 + leg,
          -w/2 + leg, -d/2 + leg,
          -w/2 + leg,  d/2,
          -w/2,        d/2,
        ];
      case 'tr':
      default:
        return [
          -w/2, -d/2,
           w/2, -d/2,
           w/2,        d/2,
           w/2 - leg,  d/2,
           w/2 - leg, -d/2 + leg,
          -w/2,       -d/2 + leg,
        ];
    }
  })();
  return (
    <>
      <Line
        points={points}
        closed
        fill="#e9e0c5"
        stroke={selected ? '#0f62fe' : color}
        strokeWidth={selected ? 3 : 1.5}
        strokeScaleEnabled={false}
        opacity={0.92}
      />
      {/* Спинка по внешним сторонам — линия отступом 80мм */}
      <BackTrim corner={corner} w={w} d={d} leg={leg} />
    </>
  );
}

function BackTrim({ corner, w, d, leg }: { corner: LCorner; w: number; d: number; leg: number }) {
  const stroke = '#9a8e6f';
  const off = 80;
  const dash: number[] = [12, 10];
  // Внешние стороны L — две стороны напротив угла
  const segments: number[][] = (() => {
    switch (corner) {
      case 'bl':
        return [
          [-w/2 + off, -d/2 + off, -w/2 + leg - off, -d/2 + off], // верхняя кромка короткой ноги
          [-w/2 + off, -d/2 + off, -w/2 + off, d/2 - off],         // левая внешняя
        ];
      case 'br':
        return [
          [w/2 - off, -d/2 + off, w/2 - leg + off, -d/2 + off],
          [w/2 - off, -d/2 + off, w/2 - off, d/2 - off],
        ];
      case 'tl':
        return [
          [-w/2 + off, d/2 - off, -w/2 + leg - off, d/2 - off],
          [-w/2 + off, -d/2 + off, -w/2 + off, d/2 - off],
        ];
      case 'tr':
      default:
        return [
          [w/2 - off, d/2 - off, w/2 - leg + off, d/2 - off],
          [w/2 - off, -d/2 + off, w/2 - off, d/2 - off],
        ];
    }
  })();
  return (
    <>
      {segments.map((s, i) => (
        <Line key={i} points={s} stroke={stroke} strokeWidth={1.5} strokeScaleEnabled={false} dash={dash} />
      ))}
    </>
  );
}

// === Кровать-трансформер: корпус у стены + (когда разложен) спальное место ===
// «Стена» — сторона local-y = -depth/2 (top в локальных координатах объекта).
// Корпус толщиной cabinetThickness всегда рендерится у этого края, а ниже него —
// пустота (closed) или матрас (open).
function TransformerBed({ obj, symbol, color, selected }: {
  obj: PlacedObject; symbol: CatalogSymbol; color: string; selected: boolean;
}) {
  const dims = TRANSFORMER_DIMS[symbol];
  if (!dims) return null;
  const w = obj.width;
  const d = obj.depth;
  const isClosed = obj.state === 'closed';
  // Толщина корпуса не превышает текущую глубину объекта — иначе при closed просто
  // занимает всё пространство.
  const cabH = Math.min(dims.cabinetThickness, d);
  // Координата нижнего края корпуса (в локальных)
  const cabBot = -d / 2 + cabH;
  const stroke = selected ? '#0f62fe' : '#5a4a30';
  const cabFill = '#c9b78a';     // тёплый карамельный цвет корпуса
  const bedFill = '#f3ebd2';     // светлый матрас
  const accent = '#9a8260';

  return (
    <>
      {/* Корпус (всегда виден) */}
      <Rect
        x={-w / 2}
        y={-d / 2}
        width={w}
        height={cabH}
        fill={cabFill}
        stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
        strokeScaleEnabled={false}
        cornerRadius={6}
      />

      {/* Декорации корпуса в зависимости от типа */}
      {symbol === 'transformer-bed-v' && (
        // Вертикальная Murphy: 2 фасадные дверцы + ручки
        <>
          <Line points={[0, -d / 2 + 12, 0, cabBot - 12]} stroke={accent} strokeWidth={1.5} strokeScaleEnabled={false} />
          <Circle x={-w * 0.18} y={-d / 2 + cabH / 2} radius={28} fill={accent} />
          <Circle x={ w * 0.18} y={-d / 2 + cabH / 2} radius={28} fill={accent} />
        </>
      )}
      {symbol === 'transformer-bed-h' && (
        // Горизонтальная Murphy: одна большая дверца с боковой ручкой
        <>
          <Line points={[-w / 2 + 12, cabBot - 12, w / 2 - 12, cabBot - 12]} stroke={accent} strokeWidth={1} strokeScaleEnabled={false} dash={[8, 6]} />
          <Circle x={w / 2 - 80} y={-d / 2 + cabH / 2} radius={28} fill={accent} />
        </>
      )}
      {symbol === 'transformer-bed-cabinet' && (
        // Кровать-шкаф: 4 секции (две по бокам — полки, центральная — дверь кровати)
        <>
          <Line points={[-w * 0.28, -d / 2 + 12, -w * 0.28, cabBot - 12]} stroke={accent} strokeWidth={1.5} strokeScaleEnabled={false} />
          <Line points={[ w * 0.28, -d / 2 + 12,  w * 0.28, cabBot - 12]} stroke={accent} strokeWidth={1.5} strokeScaleEnabled={false} />
          {/* Полки в боковых секциях */}
          {[0.25, 0.5, 0.75].map((t, i) => (
            <Line
              key={i}
              points={[
                -w / 2 + 30, -d / 2 + cabH * t, -w * 0.28 - 8, -d / 2 + cabH * t,
              ]}
              stroke={accent}
              strokeWidth={1}
              strokeScaleEnabled={false}
              dash={[6, 4]}
            />
          ))}
          {[0.25, 0.5, 0.75].map((t, i) => (
            <Line
              key={`r-${i}`}
              points={[
                w * 0.28 + 8, -d / 2 + cabH * t, w / 2 - 30, -d / 2 + cabH * t,
              ]}
              stroke={accent}
              strokeWidth={1}
              strokeScaleEnabled={false}
              dash={[6, 4]}
            />
          ))}
          <Circle x={0} y={-d / 2 + cabH / 2} radius={32} fill={accent} />
        </>
      )}
      {symbol === 'transformer-sofa-bed' && (
        // Диван-кровать: спинка по верху, подлокотники по бокам, сиденье в середине
        <>
          <Rect x={-w / 2 + 30} y={-d / 2 + 30} width={w - 60} height={cabH * 0.32} fill={bedFill} stroke={accent} strokeWidth={1.2} strokeScaleEnabled={false} cornerRadius={6} />
          <Rect x={-w / 2 + 30} y={-d / 2 + cabH * 0.36} width={w * 0.08} height={cabH * 0.55} fill={bedFill} stroke={accent} strokeWidth={1.2} strokeScaleEnabled={false} cornerRadius={4} />
          <Rect x={ w / 2 - 30 - w * 0.08} y={-d / 2 + cabH * 0.36} width={w * 0.08} height={cabH * 0.55} fill={bedFill} stroke={accent} strokeWidth={1.2} strokeScaleEnabled={false} cornerRadius={4} />
        </>
      )}

      {/* Разложенная кровать (когда state !== 'closed' и есть место под кроватью) */}
      {!isClosed && d > cabH + 100 && (() => {
        const bedTop = cabBot;
        const bedH = d - cabH;
        const pillowH = Math.min(bedH * 0.18, 250);
        return (
          <>
            <Rect
              x={-w / 2}
              y={bedTop}
              width={w}
              height={bedH}
              fill={bedFill}
              stroke={selected ? '#0f62fe' : '#9a8e6f'}
              strokeWidth={selected ? 2.5 : 1.5}
              strokeScaleEnabled={false}
              cornerRadius={20}
            />
            {/* Подушки у изголовья (примыкают к корпусу) */}
            <Rect
              x={-w / 2 + 60}
              y={bedTop + 40}
              width={w - 120}
              height={pillowH}
              fill="rgba(154, 142, 111, 0.18)"
              stroke="#9a8e6f"
              strokeWidth={1.2}
              strokeScaleEnabled={false}
              cornerRadius={20}
            />
            {/* Складка одеяла */}
            <Line
              points={[-w / 2 + 80, bedTop + pillowH + 100, w / 2 - 80, bedTop + pillowH + 100]}
              stroke="#9a8e6f"
              strokeWidth={1.5}
              strokeScaleEnabled={false}
              dash={[20, 16]}
            />
            {/* Стрелка движения «откидывания» — лёгкий намёк, что это трансформер */}
            <Line
              points={[
                w / 2 + 30, -d / 2 + cabH / 2,
                w / 2 + 90, -d / 2 + cabH / 2 + 30,
                w / 2 + 30, -d / 2 + cabH / 2 + 60,
              ]}
              stroke="#0f62fe"
              strokeWidth={1.5}
              strokeScaleEnabled={false}
              opacity={0.5}
              listening={false}
            />
          </>
        );
      })()}
    </>
  );
}

// === Раковина-стиралка: корпус стиралки + плоская раковина-«лоток» сверху ===
// Видно с высоты птичьего полёта: контур = ширина машины, верх = раковина с
// дренажной чашей и краном у задней стенки.
function WasherSink({ w, d, color, selected }: { w: number; d: number; color: string; selected: boolean }) {
  const stroke = selected ? '#0f62fe' : '#4a8db5';
  return (
    <>
      {/* Корпус стиралки — прямоугольник с пунктирной обводкой (намёк, что снизу) */}
      <Rect
        x={-w / 2 + 20}
        y={-d / 2 + 20}
        width={w - 40}
        height={d - 40}
        fill="#e8eef3"
        stroke={stroke}
        strokeWidth={1.2}
        strokeScaleEnabled={false}
        dash={[8, 6]}
        cornerRadius={6}
      />
      {/* Сама раковина — плоский лоток поверх */}
      <Rect
        x={-w / 2 + 50}
        y={-d / 2 + 50}
        width={w - 100}
        height={d - 100}
        fill={color === 'plumbing' ? '#cfe7f5' : '#cfe7f5'}
        stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
        strokeScaleEnabled={false}
        cornerRadius={Math.min(40, (d - 100) * 0.2)}
      />
      {/* Сливное отверстие */}
      <Circle x={0} y={d * 0.1} radius={Math.min(40, d * 0.1)} fill="#f8f5ee" stroke={stroke} strokeWidth={1.5} strokeScaleEnabled={false} />
      <Circle x={0} y={d * 0.1} radius={Math.min(20, d * 0.05)} fill={stroke} />
      {/* Кран у задней стенки */}
      <Rect
        x={-w * 0.04}
        y={-d / 2 + 60}
        width={w * 0.08}
        height={Math.min(120, d * 0.2)}
        fill={stroke}
        cornerRadius={6}
      />
      {/* Иконка-«стиралка снизу»: люк-круг в правом нижнем */}
      <Circle x={w * 0.28} y={d * 0.28} radius={Math.min(40, w * 0.06)} fill="transparent" stroke={stroke} strokeWidth={1.2} strokeScaleEnabled={false} />
      <Text
        text="W"
        x={w * 0.28} y={d * 0.28}
        fontSize={Math.min(40, w * 0.06)}
        fontFamily="Inter, system-ui"
        fontStyle="700"
        fill={stroke}
        offsetX={Math.min(12, w * 0.018)}
        offsetY={Math.min(20, w * 0.03)}
        listening={false}
      />
    </>
  );
}

export function ObjectShape({ obj, catalog, selected, hovered, showLabel }: Props) {
  const layer = obj.layer;
  const color = LAYER_COLOR[layer];
  const symbol = (catalog?.symbol ?? 'rect') as CatalogSymbol;

  const stroke = useMemo(() => {
    if (selected) return '#0f62fe';
    if (hovered) return '#0d8c43';
    return undefined;
  }, [selected, hovered]);

  // Маркер
  if (isMarker(layer)) {
    // Розетки рендерим с переменным числом посадочных мест: количество = width / 80,
    // ширина корпуса = реальная obj.width (не «250 минимум», иначе одинарная и
    // четвёртная выглядят одинаково).
    if (symbol === 'socket') {
      const count = Math.max(1, Math.round(obj.width / 80));
      const w = Math.max(obj.width, 240);  // минимум 240 мм для читаемости одиночной
      const d = Math.max(obj.depth, 200);
      return (
        <Group rotation={obj.rotation}>
          {(selected || hovered) && (
            <Rect
              x={-w / 2 - 50}
              y={-d / 2 - 50}
              width={w + 100}
              height={d + 100}
              cornerRadius={(d + 100) / 2}
              fill="rgba(15, 98, 254, 0.10)"
              stroke={stroke}
              strokeWidth={2}
              strokeScaleEnabled={false}
              dash={selected ? [] : [6, 4]}
            />
          )}
          <SocketMarker count={count} w={w} d={d} color={color} />
          {/* Без числового бейджа — количество гнёзд считывается визуально по корпусу */}
          {showLabel && obj.label && (
            <Text x={0} y={d / 2 + 60} text={obj.label} fontSize={110} fontFamily="Inter, system-ui" fill="#3a3f4a" align="center" width={1800} offsetX={900} listening={false} />
          )}
          {showLabel && obj.mountHeight != null && (
            <Text x={0} y={d / 2 + 200} text={fmtHeight(obj.mountHeight)} fontSize={90} fontFamily="Inter, system-ui" fill="#7a6e54" align="center" width={1800} offsetX={900} listening={false} />
          )}
        </Group>
      );
    }

    const markerSize = Math.max(obj.width, obj.depth, 250);
    // Выключатели: число клавиш + «проходной» определяем из catalogId
    if (symbol === 'switch') {
      const { keys, pass } = parseSwitchType(obj.catalogId);
      return (
        <Group rotation={obj.rotation}>
          {(selected || hovered) && (
            <Circle
              radius={markerSize / 2 + 80}
              fill="rgba(15, 98, 254, 0.10)"
              stroke={stroke}
              strokeWidth={2}
              strokeScaleEnabled={false}
              dash={selected ? [] : [6, 4]}
            />
          )}
          <SwitchMarker keys={keys} pass={pass} size={markerSize} color={color} />
          {showLabel && obj.label && (
            <Text x={0} y={markerSize / 2 + 60} text={obj.label} fontSize={110} fontFamily="Inter, system-ui" fill="#3a3f4a" align="center" width={1400} offsetX={700} listening={false} />
          )}
          {showLabel && obj.mountHeight != null && (
            <Text x={0} y={markerSize / 2 + 200} text={fmtHeight(obj.mountHeight)} fontSize={90} fontFamily="Inter, system-ui" fill="#7a6e54" align="center" width={1400} offsetX={700} listening={false} />
          )}
        </Group>
      );
    }
    return (
      <Group rotation={obj.rotation}>
        {(selected || hovered) && (
          <Circle
            radius={markerSize / 2 + 80}
            fill="rgba(15, 98, 254, 0.10)"
            stroke={stroke}
            strokeWidth={2}
            strokeScaleEnabled={false}
            dash={selected ? [] : [6, 4]}
          />
        )}
        <MarkerShape kind={symbol} size={markerSize} color={color} />
        {showLabel && obj.label && (
          <Text x={0} y={markerSize / 2 + 60} text={obj.label} fontSize={110} fontFamily="Inter, system-ui" fill="#3a3f4a" align="center" width={1400} offsetX={700} listening={false} />
        )}
        {showLabel && obj.mountHeight != null && (
          <Text x={0} y={markerSize / 2 + 200} text={fmtHeight(obj.mountHeight)} fontSize={90} fontFamily="Inter, system-ui" fill="#7a6e54" align="center" width={1400} offsetX={700} listening={false} />
        )}
      </Group>
    );
  }

  // L-образный диван
  if (symbol === 'l-sofa') {
    const corner = obj.corner ?? 'bl';
    const lb = lLabelBox(obj.width, obj.depth, corner);
    return (
      <Group rotation={obj.rotation}>
        <LSofaShape w={obj.width} d={obj.depth} corner={corner} selected={selected} color={color} />
        {showLabel && obj.label && (
          <Text
            text={obj.label}
            fontSize={Math.min(lb.bw, lb.bh) > 600 ? 120 : 90}
            fontFamily="Inter, system-ui" fontStyle="600" fill="#3a3f4a"
            align="center" verticalAlign="middle"
            x={lb.cx} y={lb.cy}
            width={lb.bw} height={lb.bh}
            offsetX={lb.bw / 2} offsetY={lb.bh / 2}
            padding={Math.min(20, Math.min(lb.bw, lb.bh) * 0.1)}
            listening={false}
          />
        )}
      </Group>
    );
  }

  // Универсальная L-форма (пользовательский предмет с symbol='l-shape')
  if (symbol === 'l-shape') {
    const sd = obj.shapeData ?? catalog?.shapeData;
    const corner = obj.corner ?? sd?.corner ?? 'bl';
    const lb = lLabelBox(obj.width, obj.depth, corner, sd?.legA, sd?.legB);
    return (
      <Group rotation={obj.rotation}>
        <LShapeGeneric
          w={obj.width} d={obj.depth}
          corner={corner}
          legA={sd?.legA} legB={sd?.legB}
          selected={selected} color={color}
        />
        {showLabel && obj.label && (
          <Text
            text={obj.label}
            fontSize={Math.min(lb.bw, lb.bh) > 600 ? 120 : 90}
            fontFamily="Inter, system-ui" fontStyle="600" fill="#3a3f4a"
            align="center" verticalAlign="middle"
            x={lb.cx} y={lb.cy}
            width={lb.bw} height={lb.bh}
            offsetX={lb.bw / 2} offsetY={lb.bh / 2}
            padding={Math.min(20, Math.min(lb.bw, lb.bh) * 0.1)}
            listening={false}
          />
        )}
      </Group>
    );
  }

  // Произвольный полигон (пользовательский предмет с symbol='polygon')
  if (symbol === 'polygon') {
    const sd = obj.shapeData ?? catalog?.shapeData;
    if (sd?.points && sd.points.length >= 3) {
      return (
        <Group rotation={obj.rotation}>
          <PolygonShape points={sd.points} selected={selected} color={color} />
          {showLabel && obj.label && (
            <Text
              text={obj.label}
              fontSize={100}
              fontFamily="Inter, system-ui" fontStyle="600" fill="#3a3f4a"
              align="center" verticalAlign="middle"
              width={obj.width} height={obj.depth}
              offsetX={obj.width / 2} offsetY={obj.depth / 2}
              padding={20}
              listening={false}
            />
          )}
        </Group>
      );
    }
  }

  // Круглые
  if (symbol === 'circle') {
    const r = Math.min(obj.width, obj.depth) / 2;
    return (
      <Group rotation={obj.rotation}>
        <Circle
          radius={r}
          fill={catalog?.fill ?? '#e9e0c5'}
          stroke={stroke ?? color}
          strokeWidth={selected ? 3 : 1.5}
          strokeScaleEnabled={false}
          opacity={0.92}
        />
        {showLabel && obj.label && (
          <Text
            text={obj.label}
            fontSize={r > 400 ? 130 : 100}
            fontFamily="Inter, system-ui" fontStyle="600" fill="#3a3f4a"
            align="center" verticalAlign="middle"
            width={r * 2} height={r * 2}
            offsetX={r} offsetY={r}
            listening={false}
          />
        )}
      </Group>
    );
  }

  // Кровати-трансформеры (4 типа)
  if (
    symbol === 'transformer-bed-v' ||
    symbol === 'transformer-bed-h' ||
    symbol === 'transformer-bed-cabinet' ||
    symbol === 'transformer-sofa-bed'
  ) {
    return (
      <Group rotation={obj.rotation}>
        <TransformerBed obj={obj} symbol={symbol} color={color} selected={selected} />
        {showLabel && obj.label && (
          <Text
            text={obj.label}
            fontSize={Math.min(obj.width, obj.depth) > 800 ? 120 : 90}
            fontFamily="Inter, system-ui"
            fontStyle="600"
            fill="#3a3f4a"
            align="center"
            verticalAlign="middle"
            width={obj.width}
            height={Math.min(obj.depth, (TRANSFORMER_DIMS[symbol]?.cabinetThickness ?? obj.depth))}
            x={0}
            y={-obj.depth / 2 + Math.min(obj.depth, (TRANSFORMER_DIMS[symbol]?.cabinetThickness ?? obj.depth)) / 2}
            offsetX={obj.width / 2}
            offsetY={Math.min(obj.depth, (TRANSFORMER_DIMS[symbol]?.cabinetThickness ?? obj.depth)) / 2}
            padding={12}
            listening={false}
          />
        )}
        {showLabel && (
          <Text
            text={fmtDims(obj.width, obj.depth)}
            fontSize={70}
            fontFamily="Inter, system-ui"
            fill="#7a6e54"
            x={-obj.width / 2}
            y={obj.depth / 2 - 90}
            width={obj.width}
            align="center"
            listening={false}
          />
        )}
      </Group>
    );
  }

  // Раковина-стиралка
  if (symbol === 'washer-sink') {
    return (
      <Group rotation={obj.rotation}>
        <WasherSink w={obj.width} d={obj.depth} color={color} selected={selected} />
        {showLabel && obj.label && (
          <Text
            text={obj.label}
            fontSize={70}
            fontFamily="Inter, system-ui"
            fontStyle="600"
            fill="#3a3f4a"
            x={-obj.width / 2}
            y={obj.depth / 2 + 30}
            width={obj.width}
            align="center"
            listening={false}
          />
        )}
      </Group>
    );
  }

  // Прямоугольная мебель/техника/сантехника + опциональная иконка-силуэт
  return (
    <Group rotation={obj.rotation}>
      <Rect
        x={-obj.width / 2}
        y={-obj.depth / 2}
        width={obj.width}
        height={obj.depth}
        fill={catalog?.fill ?? '#e9e0c5'}
        stroke={stroke ?? color}
        strokeWidth={selected ? 3 : 1.5}
        strokeScaleEnabled={false}
        cornerRadius={20}
        opacity={layer === 'plumbing' ? 0.95 : 0.92}
      />
      {/* Силуэт-иконка поверх для понятных типов мебели */}
      <FurnitureIcon symbol={symbol} w={obj.width} d={obj.depth} />
      {/* Маркер фасада — только если нет силуэта */}
      {symbol === 'rect' && (
        <Line
          points={[
            -obj.width / 2 + 60, -obj.depth / 2 + 60,
            obj.width / 2 - 60, -obj.depth / 2 + 60,
          ]}
          stroke="#9a8e6f"
          strokeWidth={2}
          strokeScaleEnabled={false}
          dash={[12, 8]}
        />
      )}
      {showLabel && obj.label && (
        <Text
          text={obj.label}
          fontSize={Math.min(obj.width, obj.depth) > 800 ? 130 : 100}
          fontFamily="Inter, system-ui"
          fontStyle="600"
          fill="#3a3f4a"
          align="center"
          verticalAlign="middle"
          width={obj.width}
          height={obj.depth}
          offsetX={obj.width / 2}
          offsetY={obj.depth / 2}
          padding={20}
          listening={false}
        />
      )}
      {showLabel && (
        <Text
          text={fmtDims(obj.width, obj.depth)}
          fontSize={70}
          fontFamily="Inter, system-ui"
          fill="#7a6e54"
          x={-obj.width / 2}
          y={obj.depth / 2 - 90}
          width={obj.width}
          align="center"
          listening={false}
        />
      )}
    </Group>
  );
}
