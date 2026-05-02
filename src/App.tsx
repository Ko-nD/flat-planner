import { useState } from 'react';
import { Toolbar } from './components/Layout/Toolbar';
import { Library } from './components/Layout/Library';
import { SidePanels } from './components/Layout/SidePanels';
import { Statusbar } from './components/Layout/Statusbar';
import { PlanCanvas } from './components/Canvas/PlanCanvas';
import { MobileBanner } from './components/Layout/MobileBanner';
import { TutorialOverlay, hasSeenTutorial } from './components/Layout/TutorialOverlay';
import { useProject } from './store/projectStore';
import { useIsMobile } from './utils/useIsMobile';
import { exportPdf, exportPng, exportAiPackage } from './utils/export';
import './styles/tokens.css';

function App() {
  const exportJson = useProject((s) => s.exportJson);
  const geometry = useProject((s) => s.geometry);
  const isMobile = useIsMobile();
  // Туториал показываем только на десктопе и только при первом заходе. На мобильных
  // он бесполезен (там и так read-only). Кнопка «?» внизу диалога даёт «Пропустить».
  const [showTutorial, setShowTutorial] = useState<boolean>(() => !isMobile && !hasSeenTutorial());

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
    <div className={`app ${isMobile ? 'app--mobile' : ''}`}>
      <Toolbar
        onExportPng={handleExportPng}
        onExportPdf={handleExportPdf}
        onExportForAi={handleExportForAi}
        isMobile={isMobile}
      />
      {!isMobile && <Library />}
      <div className="canvas-wrap">
        <PlanCanvas />
        {isMobile && <MobileBanner />}
      </div>
      {!isMobile && (
        <div className="side">
          <SidePanels />
        </div>
      )}
      <Statusbar />
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
    </div>
  );
}

export default App;
