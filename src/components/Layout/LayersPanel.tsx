import { LAYER_COLOR, LAYER_NAME } from '../../catalog/catalog';
import { useProject } from '../../store/projectStore';
import type { LayerId } from '../../types';

const LAYER_ORDER: LayerId[] = [
  'walls', 'doors', 'windows', 'labels',
  'plumbing', 'furniture', 'appliances',
  'sockets', 'switches', 'lights', 'data',
  'notes',
];

export function LayersPanel() {
  const layerVisibility = useProject((s) => s.layerVisibility);
  const toggleLayer = useProject((s) => s.toggleLayer);
  const objects = useProject((s) => s.objects);
  const setLayerVisible = useProject((s) => s.setLayerVisible);

  const counts = LAYER_ORDER.reduce<Record<string, number>>((acc, l) => {
    acc[l] = objects.filter((o) => o.layer === l).length;
    return acc;
  }, {});

  const allOn = LAYER_ORDER.every((l) => layerVisibility[l]);
  const setAll = (v: boolean) => LAYER_ORDER.forEach((l) => setLayerVisible(l, v));

  return (
    <div className="panel">
      <div className="panel-header">
        Слои
        <button className="btn btn--ghost btn--small" style={{ marginLeft: 'auto' }}
          onClick={() => setAll(!allOn)}
        >
          {allOn ? 'Скрыть всё' : 'Показать всё'}
        </button>
      </div>
      <div className="panel-body" style={{ flex: 1 }}>
        {LAYER_ORDER.map((l) => {
          const visible = layerVisibility[l];
          return (
            <div key={l} className="layer-row" onClick={() => toggleLayer(l)} style={{ opacity: visible ? 1 : 0.5, cursor: 'pointer' }}>
              <span className="swatch" style={{ background: LAYER_COLOR[l] }} />
              <span className="name">{LAYER_NAME[l]}</span>
              <span className="count">{counts[l] || ''}</span>
              <button onClick={(e) => { e.stopPropagation(); toggleLayer(l); }}>
                {visible ? '👁' : '⊘'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
