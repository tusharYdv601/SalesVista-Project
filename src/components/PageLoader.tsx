import React from 'react';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message, fullScreen = true }) => (
  <div
    className={`flex flex-col items-center justify-center bg-[#f4f9f6] ${fullScreen ? 'min-h-screen' : 'flex-1 py-24'}`}
    role="status"
  >
    <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin" />
    {message && <p className="mt-4 text-sm text-slate-600 font-medium">{message}</p>}
  </div>
);
