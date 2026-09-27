import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DashboardView } from './components/teacher/DashboardView';
import { SubmissionCheckerView } from './components/teacher/SubmissionCheckerView';
import { ScoreEntryView } from './components/teacher/ScoreEntryView';
import { AssignmentManager } from './components/teacher/AssignmentManager';
import { ScoreProportionsView } from './components/teacher/ScoreProportionsView';
import { GradeSummaryView } from './components/teacher/GradeSummaryView';
import { StudentAnalysisAndTools } from './components/teacher/StudentAnalysisAndTools';
import { StudentManager } from './components/teacher/StudentManager';
import { SubjectClassManager } from './components/teacher/SubjectClassManager';
import { SchoolSettingsView } from './components/teacher/SchoolSettingsView';
import { AttendanceView } from './components/teacher/AttendanceView';
import { TimelineView } from './components/teacher/TimelineView';
import { DriveView } from './components/teacher/DriveView';
import { StudentPortal } from './components/student/StudentPortal';
import { PrintReportModal } from './components/teacher/PrintReportModal';

const MainLayout: React.FC = () => {
  const { mode, activeTab, sidebarCollapsed } = useApp();
  const [showPrintModal, setShowPrintModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-formal">
      {mode === 'student' ? (
        /* Student Check Mode (Optimized for Mobile with Official Thai Sarabun Font) */
        <div className="flex-1 flex flex-col">
          <Header onOpenPrint={() => setShowPrintModal(true)} />
          <main className="flex-1 max-w-3xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
            <StudentPortal />
          </main>
        </div>
      ) : (
        /* Teacher Mode with Collapsible Left Sidebar */
        <div className="min-h-screen flex flex-col">
          {/* Collapsible Sidebar */}
          <Sidebar onOpenPrint={() => setShowPrintModal(true)} />

          {/* Main content shifted right by sidebar width on desktop */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
          }`}>
            <Header onOpenPrint={() => setShowPrintModal(true)} />

            <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5">
              {activeTab === 'dashboard' && <DashboardView />}
              {activeTab === 'attendance' && <AttendanceView />}
              {activeTab === 'timeline' && <TimelineView />}
              {activeTab === 'drive' && <DriveView />}
              {activeTab === 'check_submissions' && <SubmissionCheckerView />}
              {activeTab === 'enter_scores' && <ScoreEntryView />}
              {activeTab === 'assignments' && <AssignmentManager />}
              {activeTab === 'proportions' && <ScoreProportionsView />}
              {activeTab === 'summary' && <GradeSummaryView />}
              {activeTab === 'tools' && <StudentAnalysisAndTools />}
              {activeTab === 'students' && <StudentManager />}
              {activeTab === 'classes' && <SubjectClassManager />}
              {activeTab === 'school_settings' && <SchoolSettingsView />}
            </main>
          </div>
        </div>
      )}

      {/* Print Report Modal */}
      {showPrintModal && (
        <PrintReportModal onClose={() => setShowPrintModal(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
