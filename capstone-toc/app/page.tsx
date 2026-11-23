'use client';

import React, { useState, useMemo } from 'react';
import {
  LeaveApplication,
  StateId,
  AlphabetSymbol,
  UserRole,
} from '../lib/automata/types.ts';
import { LeaveAutomatonEngine } from '../lib/automata/engine.ts';
import { INITIAL_APPLICATIONS } from '../lib/mock-data.ts';
import { DfaVisualizer } from '../components/DfaVisualizer.tsx';
import { TransitionTable } from '../components/TransitionTable.tsx';
import { StringTraceSimulator } from '../components/StringTraceSimulator.tsx';
import { LeaveClearanceSlip } from '../components/LeaveClearanceSlip.tsx';
import { LeaveApplicationModal } from '../components/LeaveApplicationModal.tsx';

type TabView = 'applications' | 'diagram' | 'simulator' | 'table';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabView>('applications');
  const [applications, setApplications] = useState<LeaveApplication[]>(INITIAL_APPLICATIONS);
  const [selectedAppId, setSelectedAppId] = useState<string>(INITIAL_APPLICATIONS[1].id);
  const [activeRole, setActiveRole] = useState<'ALL' | 'STUDENT' | 'FACULTY'>('ALL');
  const [filterState, setFilterState] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingSlipApp, setViewingSlipApp] = useState<LeaveApplication | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const selectedApp = useMemo(() => {
    return applications.find((a) => a.id === selectedAppId) || applications[0] || null;
  }, [applications, selectedAppId]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesState = filterState === 'ALL' || app.currentState === filterState;
      return matchesSearch && matchesState;
    });
  }, [applications, searchQuery, filterState]);

  // Compute state metrics
  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {
      TOTAL: applications.length,
      DRAFT: 0,
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    applications.forEach((a) => {
      counts[a.currentState] = (counts[a.currentState] || 0) + 1;
    });
    return counts;
  }, [applications]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Perform a state transition on an application using the FA Engine
  const handleExecuteTransition = (appId: string, symbol: AlphabetSymbol) => {
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp) return;

    const roleToCheck: UserRole | undefined =
      activeRole === 'ALL' ? undefined : activeRole;

    const result = LeaveAutomatonEngine.transition(
      targetApp.currentState,
      symbol,
      roleToCheck
    );

    if (!result.success) {
      showNotification(result.error || 'Transition denied by Automaton Engine', 'error');
      return;
    }

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const actorName =
      roleToCheck === 'STUDENT'
        ? `${targetApp.studentName} (${targetApp.studentId})`
        : roleToCheck === 'FACULTY'
        ? 'Faculty Review Committee'
        : 'Authorized System User';

    const defaultComment =
      symbol === 'APPROVE'
        ? 'Verification complete. Leave granted under academic rules.'
        : symbol === 'REJECT'
        ? 'Leave request rejected after review.'
        : symbol === 'REQUEST_REVISION'
        ? 'Clarification requested by review faculty.'
        : symbol === 'START_REVIEW'
        ? 'Application locked for committee evaluation.'
        : symbol === 'SUBMIT'
        ? 'Application submitted to review queue.'
        : symbol === 'WITHDRAW'
        ? 'Withdrawn by applicant.'
        : 'Application draft updated.';

    const newLog = {
      id: `log-${Date.now()}`,
      fromState: result.previousState,
      symbol,
      toState: result.nextState,
      timestamp,
      actor: actorName,
      role: (roleToCheck || 'SYSTEM') as UserRole,
      comments: actionComment.trim() || defaultComment,
    };

    const updatedApplications = applications.map((app) => {
      if (app.id === appId) {
        return {
          ...app,
          currentState: result.nextState,
          updatedAt: timestamp,
          history: [...app.history, newLog],
        };
      }
      return app;
    });

    setApplications(updatedApplications);
    setActionComment('');
    showNotification(
      `Transition Executed: δ(${LeaveAutomatonEngine.STATES[result.previousState].code}, ${symbol}) → ${LeaveAutomatonEngine.STATES[result.nextState].code} (${LeaveAutomatonEngine.STATES[result.nextState].label})`,
      'success'
    );
  };

  // Create new application
  const handleCreateApplication = (
    newAppData: Omit<LeaveApplication, 'id' | 'createdAt' | 'updatedAt' | 'history'>,
    actionSymbol: AlphabetSymbol
  ) => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newId = `LEV-2026-${String(applications.length + 1).padStart(3, '0')}`;
    const initialTransitionLog = {
      id: `log-${Date.now()}`,
      fromState: 'DRAFT' as StateId,
      symbol: actionSymbol,
      toState: newAppData.currentState,
      timestamp,
      actor: `${newAppData.studentName} (${newAppData.studentId})`,
      role: 'STUDENT' as UserRole,
      comments:
        actionSymbol === 'SUBMIT'
          ? 'Application formalized and placed in review pipeline.'
          : 'Draft application saved.',
    };

    const createdApp: LeaveApplication = {
      ...newAppData,
      id: newId,
      createdAt: timestamp,
      updatedAt: timestamp,
      history: [initialTransitionLog],
    };

    setApplications([createdApp, ...applications]);
    setSelectedAppId(newId);
    setIsModalOpen(false);
    showNotification(
      `Application ${newId} created in state ${LeaveAutomatonEngine.STATES[newAppData.currentState].code} (${LeaveAutomatonEngine.STATES[newAppData.currentState].label})`,
      'success'
    );
  };

  const handleResetData = () => {
    if (confirm('Reset all applications to original seed data?')) {
      setApplications(INITIAL_APPLICATIONS);
      setSelectedAppId(INITIAL_APPLICATIONS[1].id);
      showNotification('Dataset restored to default seed.', 'success');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-slate-900 text-white flex items-center justify-center font-serif font-bold text-sm">
              FA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  AutoLeave FA
                </h1>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  TOC Deterministic Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated Student Leave Verification & State Lifecycle Model
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border border-slate-200 bg-slate-100/80 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'applications'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Leave Desk
            </button>
            <button
              onClick={() => setActiveTab('diagram')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'diagram'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              State Diagram (M)
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              TOC String Trace
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transition Matrix (δ)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
            >
              + New Leave Application
            </button>
            <button
              onClick={handleResetData}
              title="Reset data"
              className="px-2.5 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-900 rounded text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div
            className={`px-4 py-2 text-xs font-mono border-t flex items-center justify-center gap-2 transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{notification.type === 'success' ? '✓' : '⚠'}</span>
            <span>{notification.message}</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col">
        {/* TAB 1: OPERATIONS / LEAVE DESK */}
        {activeTab === 'applications' && (
          <div className="space-y-5">
            {/* Control Bar: State Badges & Role Filter */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <button
                onClick={() => setFilterState('ALL')}
                className={`p-3 bg-white border rounded-lg text-left transition-all cursor-pointer ${
                  filterState === 'ALL'
                    ? 'border-slate-800 ring-1 ring-slate-800 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  All Records
                </div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {stateCounts.TOTAL}
                </div>
              </button>

              <button
                onClick={() => setFilterState('DRAFT')}
                className={`p-3 bg-white border rounded-lg text-left transition-all cursor-pointer ${
                  filterState === 'DRAFT'
                    ? 'border-slate-800 ring-1 ring-slate-800 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  q0 Draft
                </div>
                <div className="text-xl font-bold text-slate-700 mt-0.5">
                  {stateCounts.DRAFT}
                </div>
              </button>

              <button
                onClick={() => setFilterState('SUBMITTED')}
                className={`p-3 bg-white border rounded-lg text-left transition-all cursor-pointer ${
                  filterState === 'SUBMITTED'
                    ? 'border-blue-600 ring-1 ring-blue-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">
                  q1 Submitted
                </div>
                <div className="text-xl font-bold text-blue-700 mt-0.5">
                  {stateCounts.SUBMITTED}
                </div>
              </button>

              <button
                onClick={() => setFilterState('UNDER_REVIEW')}
                className={`p-3 bg-white border rounded-lg text-left transition-all cursor-pointer ${
                  filterState === 'UNDER_REVIEW'
                    ? 'border-amber-600 ring-1 ring-amber-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">
                  q2 Review
                </div>
                <div className="text-xl font-bold text-amber-700 mt-0.5">
                  {stateCounts.UNDER_REVIEW}
                </div>
              </button>

              <button
                onClick={() => setFilterState('APPROVED')}
                className={`p-3 bg-white border rounded-lg text-left transition-all cursor-pointer ${
                  filterState === 'APPROVED'
                    ? 'border-emerald-600 ring-1 ring-emerald-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">
                  q3 Approved
                </div>
                <div className="text-xl font-bold text-emerald-700 mt-0.5">
                  {stateCounts.APPROVED}
                </div>
              </button>

              <button
                onClick={() => setFilterState('REJECTED')}
                className={`p-3 bg-white border rounded-lg text-left transition-all cursor-pointer ${
                  filterState === 'REJECTED'
                    ? 'border-rose-600 ring-1 ring-rose-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">
                  q4 Rejected
                </div>
                <div className="text-xl font-bold text-rose-700 mt-0.5">
                  {stateCounts.REJECTED}
                </div>
              </button>
            </div>

            {/* Filter & Role Bar */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Filter by student name, roll number, or application ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>

              {/* Actor Perspective Switcher (No Login Needed) */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Actor Role:</span>
                <div className="flex items-center border border-slate-200 bg-slate-50 p-0.5 rounded">
                  <button
                    onClick={() => setActiveRole('ALL')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeRole === 'ALL'
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Allowed
                  </button>
                  <button
                    onClick={() => setActiveRole('STUDENT')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeRole === 'STUDENT'
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Student Perspective
                  </button>
                  <button
                    onClick={() => setActiveRole('FACULTY')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeRole === 'FACULTY'
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Faculty Reviewer
                  </button>
                </div>
              </div>
            </div>

            {/* Split Layout: Applications Table (Left) + Detailed Automata Inspector (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Applications Table (7 cols) */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Application Registry ({filteredApplications.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click row to inspect FA state
                  </span>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/60 text-slate-700 border-b border-slate-200 font-medium">
                        <th className="py-2.5 px-3">Ref ID</th>
                        <th className="py-2.5 px-3">Student Details</th>
                        <th className="py-2.5 px-3">Leave Type</th>
                        <th className="py-2.5 px-3">Dates</th>
                        <th className="py-2.5 px-3">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No applications match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((app) => {
                          const isSelected = selectedApp?.id === app.id;
                          const stateDef = LeaveAutomatonEngine.STATES[app.currentState];

                          return (
                            <tr
                              key={app.id}
                              onClick={() => setSelectedAppId(app.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-blue-50/80 font-medium'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                                {app.id}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-900">
                                  {app.studentName}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {app.studentId} • {app.department.split(' ')[0]}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-700 font-medium">
                                {app.leaveType}
                              </td>
                              <td className="py-3 px-3">
                                <div>{app.startDate}</div>
                                <div className="text-[11px] text-slate-500">
                                  {app.daysCount} day{app.daysCount > 1 ? 's' : ''}
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                                    app.currentState === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : app.currentState === 'REJECTED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : app.currentState === 'UNDER_REVIEW'
                                      ? 'bg-amber-100 text-amber-800'
                                      : app.currentState === 'SUBMITTED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {stateDef.code} • {stateDef.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Selected Application Inspector & Automaton Action Controller (5 cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                {selectedApp ? (
                  <>
                    {/* State Control Card */}
                    <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                        <div>
                          <span className="text-[11px] text-slate-400 font-mono uppercase">
                            State Machine Controller
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 font-mono">
                            {selectedApp.id}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                              selectedApp.currentState === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : selectedApp.currentState === 'REJECTED'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : selectedApp.currentState === 'UNDER_REVIEW'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : selectedApp.currentState === 'SUBMITTED'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            State: {LeaveAutomatonEngine.STATES[selectedApp.currentState].code} (
                            {LeaveAutomatonEngine.STATES[selectedApp.currentState].label})
                          </span>
                        </div>
                      </div>

                      {/* State Description */}
                      <p className="text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded border border-slate-100">
                        {LeaveAutomatonEngine.STATES[selectedApp.currentState].description}
                      </p>

                      {/* Transition Action Buttons */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider font-mono">
                          Permitted Transitions δ({LeaveAutomatonEngine.STATES[selectedApp.currentState].code}, σ):
                        </label>

                        {/* Comment input for faculty/student action */}
                        {!LeaveAutomatonEngine.isFinalState(selectedApp.currentState) && (
                          <input
                            type="text"
                            placeholder="Optional remark / reason for this transition..."
                            value={actionComment}
                            onChange={(e) => setActionComment(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600 bg-white mb-2"
                          />
                        )}

                        {/* Dynamic Transition Trigger Buttons */}
                        {(() => {
                          const available = LeaveAutomatonEngine.getAvailableTransitions(
                            selectedApp.currentState,
                            activeRole === 'ALL' ? undefined : activeRole
                          );

                          if (available.length === 0) {
                            return (
                              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 italic">
                                {LeaveAutomatonEngine.isFinalState(selectedApp.currentState)
                                  ? 'Terminal state reached. No further transitions permitted in automaton.'
                                  : `No transitions available for role '${activeRole}'. Switch actor role above.`}
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-1 gap-2">
                              {available.map((trans) => (
                                <button
                                  key={trans.symbol}
                                  onClick={() =>
                                    handleExecuteTransition(selectedApp.id, trans.symbol)
                                  }
                                  className={`p-2.5 rounded text-left border text-xs font-mono transition-all cursor-pointer ${
                                    trans.symbol === 'APPROVE'
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                                      : trans.symbol === 'REJECT'
                                      ? 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100'
                                      : trans.symbol === 'REQUEST_REVISION'
                                      ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                                      : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold">
                                    <span>
                                      Execute: {trans.symbol}
                                    </span>
                                    <span className="text-[11px] font-semibold text-blue-700">
                                      → {LeaveAutomatonEngine.STATES[trans.to].code}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                                    {trans.description}
                                  </div>
                                </button>
                              ))}
                            </div>
                          );
                        })()}

                        {/* If in Approved state, show certificate generator */}
                        {selectedApp.currentState === 'APPROVED' && (
                          <button
                            onClick={() => setViewingSlipApp(selectedApp)}
                            className="w-full mt-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                          >
                            <span>Official Clearance Slip (Print Certificate)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Application Details Summary */}
                    <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-4 text-xs space-y-2.5">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1.5">
                        Applicant Particulars
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div>
                          <span className="text-slate-400">Student:</span>{' '}
                          <strong className="text-slate-900">{selectedApp.studentName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Roll No:</span>{' '}
                          <span className="font-mono text-slate-900">{selectedApp.studentId}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Department:</span>{' '}
                          <span className="text-slate-900">{selectedApp.department}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Semester:</span>{' '}
                          <span className="text-slate-900">{selectedApp.semester}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Leave Period:</span>{' '}
                          <span className="text-slate-900">
                            {selectedApp.startDate} to {selectedApp.endDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Sanction Days:</span>{' '}
                          <span className="text-slate-900">{selectedApp.daysCount} Day(s)</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-400">Reason Stated:</span>
                        <p className="mt-1 text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                          {selectedApp.reason}
                        </p>
                      </div>
                    </div>

                    {/* Transition Audit Log / History Ledger */}
                    <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-4 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                          Automata Transition Audit Ledger
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          {selectedApp.history.length} Event{selectedApp.history.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {selectedApp.history.map((log, index) => (
                          <div
                            key={log.id}
                            className="relative pl-4 border-l-2 border-slate-200 text-slate-700 font-sans"
                          >
                            <div className="flex items-center justify-between font-mono text-[11px] font-semibold text-slate-900">
                              <span>
                                {LeaveAutomatonEngine.STATES[log.fromState].code} → (
                                {log.symbol}) → {LeaveAutomatonEngine.STATES[log.toState].code}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans font-normal">
                                {log.timestamp}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Actor: {log.actor} ({log.role})
                            </div>
                            {log.comments && (
                              <div className="text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded mt-1 border border-slate-100">
                                {log.comments}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-xs">
                    Select an application from the registry to inspect state automata.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VISUAL STATE DIAGRAM */}
        {activeTab === 'diagram' && (
          <div className="space-y-5">
            <DfaVisualizer
              activeState={selectedApp ? selectedApp.currentState : undefined}
            />

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs text-xs text-slate-600 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                Formal Automata Specification: M = (Q, Σ, δ, q0, F)
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Set of States (Q):</strong> {'{'}q0: Draft, q1: Submitted, q2: Under Review, q3: Approved, q4: Rejected{'}'}
                </li>
                <li>
                  <strong>Input Alphabet (Σ):</strong> {'{'}SAVE_DRAFT, SUBMIT, START_REVIEW, REQUEST_REVISION, APPROVE, REJECT, WITHDRAW{'}'}
                </li>
                <li>
                  <strong>Start State (q0):</strong> q0 = Draft
                </li>
                <li>
                  <strong>Terminal / Accepting States (F):</strong> F = {'{'}q3: Approved, q4: Rejected{'}'}
                </li>
                <li>
                  <strong>Determinism Guarantee:</strong> For any state q ∈ Q and input symbol σ ∈ Σ, there is at most one state q&apos; ∈ Q such that δ(q, σ) = q&apos;. Any undefined mapping transitions into an immutable trap state.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: TOC STRING SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-5">
            <StringTraceSimulator />
          </div>
        )}

        {/* TAB 4: TRANSITION MATRIX TABLE */}
        {activeTab === 'table' && (
          <div className="space-y-5">
            <TransitionTable
              activeState={selectedApp ? selectedApp.currentState : undefined}
            />
          </div>
        )}
      </main>

      {/* New Application Modal */}
      {isModalOpen && (
        <LeaveApplicationModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateApplication}
        />
      )}

      {/* Official Leave Clearance Slip Modal */}
      {viewingSlipApp && (
        <LeaveClearanceSlip
          application={viewingSlipApp}
          onClose={() => setViewingSlipApp(null)}
        />
      )}

      {/* Academic Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500 font-mono">
        Theory of Computation Capstone Project • Finite Automata State Management • Next.js & TypeScript
      </footer>
    </div>
  );
}
