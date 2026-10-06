import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  PieChart,
  Database,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Layers,
  BarChart3,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';

export const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div
      className="min-h-screen overflow-hidden bg-[#f5faf7] text-slate-900"
      id="home-page-container"
    >
      <Header />

      {/* =====================================================
          HERO SECTION
      ===================================================== */}
      <section
        className="relative overflow-hidden bg-white"
        id="hero-section"
      >
        {/* Background decorations */}
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-10 h-[500px] w-[500px] rounded-full bg-green-100/50 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-100/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-14 sm:px-8 lg:px-10 lg:pb-28 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">

            {/* LEFT CONTENT */}
            <div className="text-center lg:text-left">

              {/* Badge */}
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-700 shadow-sm"
                id="project-tag-badge"
              >
                <Sparkles className="h-3.5 w-3.5" />
                B.Tech Mini Project
              </div>

              {/* Main Heading */}
              <h1
                className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-[4rem]"
                id="hero-project-title"
              >
                Understand Your Sales.
                <span className="mt-2 block bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-500 bg-clip-text text-transparent">
                  Compare. Discover. Analyze.
                </span>
              </h1>

              {/* Project title */}
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 sm:text-xl lg:text-left">
                Comparative Sales Analysis of{' '}
                <span className="font-semibold text-slate-800">
                  Stores, Customers and Demographics
                </span>{' '}
                using Supabase & React.js.
              </p>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                A modern analytical platform designed to help understand
                store performance, customer behavior and demographic patterns
                through structured data analysis.
              </p>

              {/* CTA */}
              <div
                className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
                id="hero-cta-buttons"
              >
                {user ? (
                  <Link
                    to="/dashboard"
                    id="cta-go-dashboard"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-800 hover:shadow-xl"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      id="cta-signup-btn"
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-800 hover:shadow-xl"
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>

                    <Link
                      to="/login"
                      id="cta-login-btn"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      Login
                    </Link>
                  </>
                )}
              </div>

              {/* Trust points */}
              <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500 lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Secure Authentication
                </span>

                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Supabase Powered
                </span>

                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  React Based
                </span>
              </div>
            </div>

            {/* RIGHT VISUAL */}
            <div
              className="relative mx-auto w-full max-w-xl"
              id="hero-analytics-preview"
            >
              {/* Main dashboard mockup */}
              <div className="relative rounded-[28px] border border-emerald-100 bg-white p-3 shadow-[0_30px_80px_rgba(16,80,45,0.16)]">

                {/* Browser header */}
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  </div>

                  <div className="rounded-lg bg-white px-4 py-1.5 text-[10px] font-semibold text-slate-400 shadow-sm">
                    Sales Analytics
                  </div>

                  <div className="h-6 w-6 rounded-full bg-emerald-100" />
                </div>

                {/* Dashboard preview */}
                <div className="p-5 sm:p-7">

                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                        Analytics Overview
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-slate-900">
                        Comparative Analysis
                      </h3>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Fake visual only — no numerical data */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <Building2 className="mb-3 h-5 w-5 text-emerald-600" />

                      <p className="text-xs font-semibold text-slate-700">
                        Stores
                      </p>

                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div className="h-2 w-3/4 rounded-full bg-emerald-500" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <Users className="mb-3 h-5 w-5 text-blue-500" />

                      <p className="text-xs font-semibold text-slate-700">
                        Customers
                      </p>

                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div className="h-2 w-2/3 rounded-full bg-blue-500" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <PieChart className="mb-3 h-5 w-5 text-purple-500" />

                      <p className="text-xs font-semibold text-slate-700">
                        Demographics
                      </p>

                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div className="h-2 w-4/5 rounded-full bg-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Chart visual */}
                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Comparative Performance
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          Store & Customer Trends
                        </p>
                      </div>

                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>

                    {/* Visual chart */}
                    <div className="flex h-32 items-end gap-3">
                      <div className="h-[35%] flex-1 rounded-t-lg bg-emerald-200" />
                      <div className="h-[55%] flex-1 rounded-t-lg bg-emerald-300" />
                      <div className="h-[45%] flex-1 rounded-t-lg bg-emerald-400" />
                      <div className="h-[72%] flex-1 rounded-t-lg bg-emerald-500" />
                      <div className="h-[62%] flex-1 rounded-t-lg bg-emerald-400" />
                      <div className="h-[85%] flex-1 rounded-t-lg bg-emerald-600" />
                      <div className="h-[72%] flex-1 rounded-t-lg bg-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Store card */}
              <div className="absolute -left-5 top-28 hidden w-44 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-xl backdrop-blur-md sm:block">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                    <Building2 className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      Analysis
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      Store Wise
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Customer card */}
              <div className="absolute -right-5 bottom-20 hidden w-48 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-xl backdrop-blur-md sm:block">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                    <Users className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      Insights
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      Customer Data
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ANALYTICAL DOMAINS
      ===================================================== */}
      <section
        className="relative border-y border-slate-200 bg-[#f5faf7] py-20"
        id="analytical-pillars-section"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
              <Layers className="h-4 w-4" />
              Core Analysis
            </div>

            <h2
              className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
              id="pillars-heading"
            >
              Three dimensions of
              <span className="text-emerald-700"> sales intelligence</span>
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              The platform is designed around three major research dimensions
              for comparative sales analysis.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3" id="project-pillars-grid">

            {/* Store */}
            <div
              className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5"
              id="card-store-analysis"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition-transform duration-300 group-hover:scale-110">
                  <Building2 className="h-7 w-7" />
                </div>

                <ArrowRight className="h-5 w-5 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-emerald-600" />
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                Store-Wise Analysis
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Compare performance across different store branches,
                transaction patterns and regional sales distribution.
              </p>

              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Multi-Store Comparison
              </div>
            </div>

            {/* Customer */}
            <div
              className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
              id="card-customer-analysis"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform duration-300 group-hover:scale-110">
                  <Users className="h-7 w-7" />
                </div>

                <ArrowRight className="h-5 w-5 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-600" />
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                Customer Analysis
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Study purchasing behavior, transaction frequency, customer
                patterns and potential loyalty segments.
              </p>

              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600">
                <CheckCircle2 className="h-4 w-4" />
                Customer Metrics
              </div>
            </div>

            {/* Demographic */}
            <div
              className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-900/5"
              id="card-demographic-analysis"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition-transform duration-300 group-hover:scale-110">
                  <PieChart className="h-7 w-7" />
                </div>

                <ArrowRight className="h-5 w-5 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-purple-600" />
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                Demographic Analysis
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Explore customer segmentation using demographic dimensions
                such as age, geography and other available attributes.
              </p>

              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-purple-600">
                <CheckCircle2 className="h-4 w-4" />
                Demographic Segments
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TECHNOLOGY SECTION
      ===================================================== */}
      <section
        className="border-b border-slate-200 bg-white py-16"
        id="tech-stack-section"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">

          <div className="relative overflow-hidden rounded-[28px] bg-slate-950 px-7 py-9 text-white shadow-2xl sm:px-10">
            {/* Green glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-20 h-52 w-52 rounded-full bg-green-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

              <div className="max-w-xl">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
                  Technical Foundation
                </span>

                <h3 className="mt-2 text-2xl font-black sm:text-3xl">
                  Built for modern data-driven analysis.
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  A React-based frontend combined with Supabase
                  authentication and cloud database capabilities provides the
                  foundation for the analytical modules that will be developed
                  later.
                </p>
              </div>

              <div
                className="flex max-w-md flex-wrap gap-3"
                id="tech-tags-list"
              >
                <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur">
                  <Database className="h-4 w-4 text-emerald-400" />
                  Supabase
                </span>

                <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  React.js
                </span>

                <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Secure Auth
                </span>

                <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  Data Analysis
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}
      <section className="bg-[#f5faf7] px-5 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <BarChart3 className="h-7 w-7" />
          </div>

          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Ready to explore the platform?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            Start with the secure workspace and build your comparative sales
            analysis journey from there.
          </p>

          <div className="mt-8">
            {user ? (
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-1 hover:bg-emerald-800"
              >
                Open Dashboard
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-1 hover:bg-emerald-800"
              >
                Create Your Account
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer
        className="border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-500"
        id="main-footer"
      >
        <div className="mx-auto max-w-6xl px-5">
          <p className="font-semibold text-slate-300">
            Comparative Sales Analysis of Stores, Customers and Demographics
          </p>

          <p className="mt-2">
            B.Tech Mini Project • Built with React.js & Supabase
          </p>
        </div>
      </footer>
    </div>
  );
};