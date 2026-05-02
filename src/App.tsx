import { Toolbar } from './components/Layout/Toolbar';
import { Library } from './components/Layout/Library';
import { LayersPanel } from './components/Layout/LayersPanel';
import { Properties } from './components/Layout/Properties';
import { Statusbar } from './components/Layout/Statusbar';
import { PlanCanvas } from './components/Canvas/PlanCanvas';
import { useProject } from './store/projectStore';
import { exportPdf, exportPng, exportAiPackage } from './utils/export';
import './styles/tokens.css';

function App() {
  const exportJson = useProject((s) => s.exportJson);
  const geometry = useProject((s) => s.geometry);

  const handleExportPng = () => {
    const stage = (window as any).__konvaStage;
    if (stage) exportPng(stage, geometry, 'apartment-plan.png', 2);
  };
  const handleExportPdf = async () => {
    const stage = (window as any).__konvaStage;
    if (stage) await exportPdf(stage, geometry, exportJson(), 'apartment-plan.pdf');
  };
  const handleExportForAi = async () => {
    const stage = (window as any).__konvaStage;
    if (stage) await exportAiPackage(stage, geometry, exportJson());
  };

  return (
    <div className="app">
      <Toolbar
        onExportPng={handleExportPng}
        onExportPdf={handleExportPdf}
        onExportForAi={handleExportForAi}
      />
      <Library />
      <div className="canvas-wrap">
        <PlanCanvas />
      </div>
      <div className="side">
        <LayersPanel />
        <Properties />
      </div>
      <Statusbar />
    </div>
  );
}

export default App;
