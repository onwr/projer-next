'use client';

import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export const PanelShell = ({ title = 'Panel', children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid md:grid-cols-[240px_1fr]">
        <Sidebar />
        <div className="min-h-screen">
          <Topbar title={title} />
          <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default PanelShell;


