import React from 'react';
import { SupportProvider, useSupport } from './context/SupportContext';
import { HeaderBar } from './components/common/HeaderBar';
import { AndroidPhoneFrame } from './components/client/AndroidPhoneFrame';
import { AdminAuthGate } from './components/admin/AdminAuthGate';
import { SplitView } from './components/split/SplitView';
import { QrCodeModal } from './components/common/QrCodeModal';

const MainContent: React.FC = () => {
  const { currentView, isQrModalOpen, setIsQrModalOpen } = useSupport();
  const customerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?role=customer`
    : '/?role=customer';

  return (
    <div className="flex-1 flex flex-col">
      {currentView === 'client' && (
        <main className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <AndroidPhoneFrame />
        </main>
      )}

      {currentView === 'admin' && (
        <main className="flex-1 flex flex-col overflow-y-auto">
          <AdminAuthGate />
        </main>
      )}

      {currentView === 'split' && (
        <main className="flex-1 flex flex-col overflow-y-auto">
          <SplitView />
        </main>
      )}

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        url={customerUrl}
      />
    </div>
  );
};

export default function App() {
  return (
    <SupportProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
        <HeaderBar />
        <MainContent />
      </div>
    </SupportProvider>
  );
}
