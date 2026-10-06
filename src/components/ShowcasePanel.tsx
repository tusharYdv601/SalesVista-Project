import React from 'react';
import { 
  Building2, 
  Users, 
  PieChart, 
  BarChart3, 
  Layers, 
  ArrowRight, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface ShowcasePanelProps {
  mode: 'login' | 'signup';
  onToggleMode: (newMode: 'login' | 'signup') => void;
}

export const ShowcasePanel: React.FC<ShowcasePanelProps> = ({ mode, onToggleMode }) => {
  const isLogin = mode === 'login';

  return (
    <div 
      className="relative w-full h-full p-7 sm:p-8 lg:p-9 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0c2f20] via-[#174f36] to-[#092218] text-white select-none"
      id="showcase-panel-inner"
    >
      {/* Subtle Dotted Matrix & Ambient Glows */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Badge */}
      <div className="relative z-10">
        <div 
          id="showcase-top-badge"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-emerald-200 text-[11px] font-bold tracking-[0.16em] uppercase shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span>Sales Intelligence Platform</span>
        </div>
      </div>

      {/* Dynamic Main Body based on Active Mode */}
      <div className="relative z-10 my-auto py-2">
        {isLogin ? (
          /* ======================== LOGIN MODE SHOWCASE ======================== */
          <div className="space-y-4 transition-all duration-300 animate-fadeIn" id="showcase-login-content">
            
            {/* Main Heading & Description */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-[2.05rem] font-black tracking-tight text-white leading-[1.14]">
                Turn Sales Data into{' '}
                <span className="block text-emerald-300 drop-shadow-xs">
                  Actionable Insights
                </span>
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 font-normal leading-relaxed max-w-sm">
                Compare store performance, understand customer behavior, and uncover demographic patterns through structured sales analysis.
              </p>
            </div>

            {/* Feature Cards Grid/Stack */}
            <div className="space-y-2 pt-0.5" id="showcase-login-cards">
              
              {/* CARD 1: Store Performance */}
              <div className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] hover:border-emerald-300/40 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 transition-all duration-300 hover:translate-x-1 group cursor-default shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-emerald-300 group-hover:bg-emerald-400 group-hover:text-emerald-950 transition-all duration-200 shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white tracking-tight">Store Performance</h4>
                      <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-emerald-300/90 group-hover:text-emerald-200 transition-colors">
                        Comparative Store Analysis
                        <ChevronRight className="w-3 h-3 ml-0.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/75 mt-0.5 leading-snug">
                      Compare sales performance across different stores and identify variations in business activity.
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 2: Customer Insights */}
              <div className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] hover:border-emerald-300/40 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 transition-all duration-300 hover:translate-x-1 group cursor-default shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-emerald-300 group-hover:bg-emerald-400 group-hover:text-emerald-950 transition-all duration-200 shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white tracking-tight">Customer Insights</h4>
                      <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-emerald-300/90 group-hover:text-emerald-200 transition-colors">
                        Customer Behavior Analysis
                        <ChevronRight className="w-3 h-3 ml-0.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/75 mt-0.5 leading-snug">
                      Analyze purchasing behavior, transaction patterns, and customer segments.
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 3: Demographic Analysis */}
              <div className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] hover:border-emerald-300/40 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 transition-all duration-300 hover:translate-x-1 group cursor-default shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-emerald-300 group-hover:bg-emerald-400 group-hover:text-emerald-950 transition-all duration-200 shrink-0 mt-0.5">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white tracking-tight">Demographic Analysis</h4>
                      <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-emerald-300/90 group-hover:text-emerald-200 transition-colors">
                        Demographic Segmentation
                        <ChevronRight className="w-3 h-3 ml-0.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/75 mt-0.5 leading-snug">
                      Explore sales patterns across demographic groups to identify meaningful trends.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RESEARCH ANALYSIS STRIP (Abstract Visualization Only - No Fake Numbers) */}
            <div className="pt-1" id="research-analysis-strip-login">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.09] backdrop-blur-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-white tracking-tight truncate">
                      Comparative Research Analysis
                    </h5>
                    <p className="text-[11px] text-emerald-200/70 truncate">
                      Explore relationships between stores, customers, and demographic factors.
                    </p>
                  </div>
                </div>

                {/* Abstract Data Visualization: Vertical bars, tiny dots, thin trend line */}
                <div className="flex items-center gap-2 shrink-0 pl-2 opacity-85">
                  {/* Subtle SVG Trend Line */}
                  <svg className="w-10 h-4 text-emerald-300/80 stroke-current fill-none" viewBox="0 0 40 16" aria-hidden="true">
                    <path d="M2 12 L12 8 L22 10 L30 4 L38 2" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="38" cy="2" r="1.5" className="fill-emerald-300" />
                  </svg>
                  {/* Abstract vertical mini bars */}
                  <div className="flex items-end gap-1 h-5">
                    <span className="w-1 h-2 rounded-full bg-emerald-400/50" />
                    <span className="w-1 h-3.5 rounded-full bg-emerald-400/75" />
                    <span className="w-1 h-2.5 rounded-full bg-emerald-400/60" />
                    <span className="w-1 h-4.5 rounded-full bg-emerald-300" />
                    <span className="w-1 h-3.5 rounded-full bg-emerald-400/80" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* ======================== SIGNUP MODE SHOWCASE ======================== */
          <div className="space-y-4 transition-all duration-300 animate-fadeIn" id="showcase-signup-content">
            
            {/* Main Heading & Description */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-[2.05rem] font-black tracking-tight text-white leading-[1.14]">
                Already Have an{' '}
                <span className="block text-emerald-300 drop-shadow-xs">
                  Account?
                </span>
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 font-normal leading-relaxed max-w-sm">
                Sign in to continue exploring your comparative sales workspace and analytical research environment.
              </p>
            </div>

            {/* Feature Cards Grid/Stack */}
            <div className="space-y-2 pt-0.5" id="showcase-signup-cards">
              
              {/* CARD 1: Data-Driven Insights */}
              <div className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] hover:border-emerald-300/40 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 transition-all duration-300 hover:translate-x-1 group cursor-default shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-emerald-300 group-hover:bg-emerald-400 group-hover:text-emerald-950 transition-all duration-200 shrink-0 mt-0.5">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white tracking-tight">Data-Driven Insights</h4>
                      <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-emerald-300/90 group-hover:text-emerald-200 transition-colors">
                        Empirical Data Analysis
                        <ChevronRight className="w-3 h-3 ml-0.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/75 mt-0.5 leading-snug">
                      Analyze structured sales information to discover meaningful patterns.
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 2: Comparative Analysis */}
              <div className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] hover:border-emerald-300/40 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 transition-all duration-300 hover:translate-x-1 group cursor-default shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-emerald-300 group-hover:bg-emerald-400 group-hover:text-emerald-950 transition-all duration-200 shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white tracking-tight">Comparative Analysis</h4>
                      <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-emerald-300/90 group-hover:text-emerald-200 transition-colors">
                        Multi-Dimensional Assessment
                        <ChevronRight className="w-3 h-3 ml-0.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/75 mt-0.5 leading-snug">
                      Compare stores, customers, and demographic groups from multiple perspectives.
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 3: Research-Oriented */}
              <div className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] hover:border-emerald-300/40 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 transition-all duration-300 hover:translate-x-1 group cursor-default shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-emerald-300 group-hover:bg-emerald-400 group-hover:text-emerald-950 transition-all duration-200 shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white tracking-tight">Research-Oriented</h4>
                      <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-emerald-300/90 group-hover:text-emerald-200 transition-colors">
                        Evidence-Based Exploration
                        <ChevronRight className="w-3 h-3 ml-0.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/75 mt-0.5 leading-snug">
                      Build evidence-based insights from comparative sales analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RESEARCH ANALYSIS STRIP (Signup Mode) */}
            <div className="pt-1" id="research-analysis-strip-signup">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.09] backdrop-blur-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-white tracking-tight truncate">
                      Ready to Continue?
                    </h5>
                    <p className="text-[11px] text-emerald-200/70 truncate">
                      Return to your sales intelligence workspace.
                    </p>
                  </div>
                </div>

                {/* Abstract Node / Trend Visual */}
                <div className="flex items-center gap-1.5 shrink-0 pl-2 opacity-85">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="w-3.5 h-3.5 rounded-full border border-emerald-300/60 flex items-center justify-center">
                    <span className="w-1 h-1 rounded-full bg-emerald-200" />
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Bottom Sliding Trigger Button */}
      <div className="relative z-10 pt-3.5 border-t border-white/10" id="showcase-bottom-action-bar">
        {isLogin ? (
          <button
            type="button"
            onClick={() => onToggleMode('signup')}
            id="showcase-btn-slide-signup"
            className="w-full flex items-center justify-between px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-white text-[#0c2f20] font-bold text-sm shadow-lg shadow-black/15 hover:bg-emerald-50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group cursor-pointer"
          >
            <span className="tracking-tight font-extrabold">Slide for Sign Up</span>
            <ArrowRight className="w-4 h-4 text-emerald-800 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onToggleMode('login')}
            id="showcase-btn-slide-login"
            className="w-full flex items-center justify-between px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-white text-[#0c2f20] font-bold text-sm shadow-lg shadow-black/15 hover:bg-emerald-50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group cursor-pointer"
          >
            <span className="tracking-tight font-extrabold">Slide for Login</span>
            <ArrowRight className="w-4 h-4 text-emerald-800 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        )}
      </div>
    </div>
  );
};
