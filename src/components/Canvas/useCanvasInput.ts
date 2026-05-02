import { useEffect } from 'react';
import { useProject } from '../../store/projectStore';

export function useCanvasKeys() {
  const removeObjects = useProject((s) => s.removeObjects);
  const duplicateObjects = useProject((s) => s.duplicateObjects);
  const updateObject = useProject((s) => s.updateObject);
  const selectedIds = useProject((s) => s.selectedIds);
  const objects = useProject((s) => s.objects);
  const cancelPlacement = useProject((s) => s.cancelPlacement);
  const tool = useProject((s) => s.tool);
  const setTool = useProject((s) => s.setTool);
  const setShowGrid = useProject((s) => s.setShowGrid);
  const showGrid = useProject((s) => s.showGrid);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Игнорируем, если фокус в инпуте/textarea
      const target = e.target as HTMLElement;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) return;

      if (e.key === 'Escape') {
        if (tool === 'place') cancelPlacement();
        useProject.getState().clearSelect();
        useProject.getState().setMeasure(null);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length) {
          removeObjects(selectedIds);
          e.preventDefault();
        }
        return;
      }

      if ((e.key === 'd' || e.key === 'D') && (e.ctrlKey || e.metaKey)) {
        if (selectedIds.length) duplicateObjects(selectedIds);
        e.preventDefault();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        const delta = e.shiftKey ? -15 : 15;
        for (const id of selectedIds) {
          const obj = objects.find((o) => o.id === id);
          if (obj) updateObject(id, { rotation: (obj.rotation + delta) % 360 });
        }
        return;
      }

      if (e.key === 'g' || e.key === 'G') {
        setShowGrid(!showGrid);
        return;
      }

      if (e.key === 'v' || e.key === 'V') {
        setTool('select');
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        setTool('measure');
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setTool('pan');
        return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    selectedIds, objects, tool, showGrid,
    removeObjects, duplicateObjects, updateObject, cancelPlacement, setTool, setShowGrid,
  ]);
}
