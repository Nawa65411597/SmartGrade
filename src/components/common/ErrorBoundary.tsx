import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Mail, RefreshCw, Copy, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

const SUPPORT_EMAIL = 'nawaratk65@gmail.com';

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      copied: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    });
    window.location.reload();
  };

  private handleCopyDetails = () => {
    const { error, errorInfo } = this.state;
    const details = [
      `=== รายงานข้อขัดข้องของระบบ KruSmart ===`,
      `วันเวลา: ${new Date().toLocaleString('th-TH')}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
      `ข้อผิดพลาด: ${error?.name || 'Error'}: ${error?.message || 'Unknown error'}`,
      `Stack Trace:`,
      error?.stack || 'No stack trace available',
      `Component Stack:`,
      errorInfo?.componentStack || 'No component stack available',
      `===========================================`
    ].join('\n');

    navigator.clipboard.writeText(details);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 3000);
  };

  private getMailtoUrl = () => {
    const { error, errorInfo } = this.state;
    const subject = encodeURIComponent(`[รายงานข้อผิดพลาดระบบ KruSmart] ${error?.message?.slice(0, 60) || 'ระบบขัดข้อง'}`);
    const body = encodeURIComponent(
      `สวัสดีครับ/ค่ะ ทีมผู้ดูแลระบบ (${SUPPORT_EMAIL}),\n\n` +
      `พบข้อขัดข้องระหว่างการใช้งานระบบ KruSmart ดังนี้:\n` +
      `-----------------------------------------\n` +
      `วันเวลา: ${new Date().toLocaleString('th-TH')}\n` +
      `หน้าเว็บ: ${window.location.href}\n` +
      `ข้อความข้อผิดพลาด: ${error?.message || 'ไม่ระบุ'}\n\n` +
      `Stack Trace:\n${error?.stack || 'N/A'}\n\n` +
      `Component Stack:\n${errorInfo?.componentStack || 'N/A'}\n` +
      `-----------------------------------------\n` +
      `รายละเอียดพฤติกรรมก่อนเกิดปัญหา (ผู้ใช้สามารถพิมพ์เพิ่มเติมตรงนี้):\n\n`
    );
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  public render() {
    if (this.state.hasError) {
      const { error, errorInfo, copied } = this.state;

      return (
        <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-slate-50 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 font-formal">
          <div className="max-w-xl w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-rose-200/80 dark:border-rose-900/40 shadow-2xl p-6 sm:p-8 space-y-6 animate-fadeIn">
            {/* Header with Pastel Icon */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-sm">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  ระบบตรวจพบข้อขัดข้อง
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  ขออภัยในความไม่สะดวก
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  แอปพลิเคชันพบข้อผิดพลาดที่ไม่คาดคิด ข้อมูลของท่านยังคงปลอดภัย
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs sm:text-sm space-y-2">
              <div className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>ข้อผิดพลาด: {error?.name || 'Error'}</span>
              </div>
              <p className="font-mono text-xs text-rose-700 dark:text-rose-300/90 break-words bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                {error?.message || 'เกิดข้อผิดพลาดในการประมวลผล'}
              </p>
            </div>

            {/* Support Guidance */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 text-xs sm:text-sm space-y-2">
              <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>ช่องทางแจ้งเตือนผู้ดูแลระบบโดยตรง</span>
              </div>
              <p className="text-indigo-800/80 dark:text-indigo-300/80 text-xs leading-relaxed">
                หากระบบขัดข้อง กรุณากดปุ่มด้านล่างเพื่อส่งอีเมลรายงานปัญหาไปยังทีมงานที่{' '}
                <a 
                  href={`mailto:${SUPPORT_EMAIL}`} 
                  className="font-bold underline text-indigo-700 dark:text-indigo-300 hover:text-indigo-900"
                >
                  {SUPPORT_EMAIL}
                </a>{' '}
                เพื่อรับการตรวจสอบและแก้ไขทันที
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a
                href={this.getMailtoUrl()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer text-xs sm:text-sm active:scale-95"
              >
                <Mail className="w-4 h-4" />
                <span>ส่งอีเมลแจ้ง {SUPPORT_EMAIL}</span>
              </a>

              <button
                onClick={this.handleCopyDetails}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl shadow-xs transition cursor-pointer text-xs sm:text-sm active:scale-95"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>คัดลอกรายละเอียด</span>
                  </>
                )}
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition cursor-pointer text-xs sm:text-sm active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>รีโหลดใหม่</span>
              </button>
            </div>

            {/* Technical stack collapsible details */}
            <details className="text-left text-xs border-t border-slate-200 dark:border-slate-800 pt-3">
              <summary className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium">
                ดูรายละเอียดทางเทคนิค (Technical Details)
              </summary>
              <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono max-h-48">
                {error?.stack}
                {'\n'}
                {errorInfo?.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
