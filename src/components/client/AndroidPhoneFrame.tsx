import React from 'react';
import { useSupport } from '../../context/SupportContext';
import { AndroidStatusBar } from './AndroidStatusBar';
import { WelcomeScreen } from './WelcomeScreen';
import { PermissionSetupScreen } from './PermissionSetupScreen';
import { LoginScreen } from './LoginScreen';
import { UserDashboard } from './UserDashboard';

export const AndroidPhoneFrame: React.FC = () => {
  const { clientScreen, isPhoneFrame } = useSupport();

  const renderScreen = () => {
    switch (clientScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'permissions':
        return <PermissionSetupScreen />;
      case 'login':
        return <LoginScreen />;
      case 'dashboard':
        return <UserDashboard />;
      default:
        return <WelcomeScreen />;
    }
  };

  if (!isPhoneFrame) {
    return (
      <div className="w-full max-w-7xl mx-auto min-h-[700px] bg-[#0a0d10] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-4">
        <AndroidStatusBar />
        <div className="flex-1 overflow-y-auto">{renderScreen()}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-2 sm:p-6 w-full">
      {/* Physical Device Frame (Samsung Galaxy / Pixel Inspired) */}
      <div className="relative w-full max-w-[400px] h-[820px] max-h-[92vh] bg-slate-900 rounded-[48px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] ring-1 ring-slate-700/80 flex flex-col border-[4px] border-slate-800">
        {/* Device Outer Volume & Power Buttons Simulation */}
        <div className="absolute -left-[7px] top-28 w-[3px] h-12 bg-slate-700 rounded-l-md"></div>
        <div className="absolute -left-[7px] top-44 w-[3px] h-20 bg-slate-700 rounded-l-md"></div>
        <div className="absolute -right-[7px] top-32 w-[3px] h-16 bg-slate-700 rounded-r-md"></div>

        {/* Screen Bezel & Content Container */}
        <div className="relative w-full h-full bg-slate-950 rounded-[38px] overflow-hidden flex flex-col shadow-inner">
          {/* Status Bar */}
          <AndroidStatusBar />

          {/* Screen Body */}
          <div className="flex-1 overflow-y-auto relative scrollbar-none">
            {renderScreen()}
          </div>

          {/* Android Gesture Bar */}
          <div className="w-full py-2 bg-slate-950 flex items-center justify-center pointer-events-none select-none shrink-0 border-t border-slate-900">
            <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
