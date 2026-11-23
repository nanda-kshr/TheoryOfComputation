'use client';

import React from 'react';
import { StateId, AlphabetSymbol } from '../lib/automata/types.ts';
import { LeaveAutomatonEngine } from '../lib/automata/engine.ts';

interface DfaVisualizerProps {
  activeState?: StateId;
  onSelectState?: (state: StateId) => void;
}

export function DfaVisualizer({ activeState, onSelectState }: DfaVisualizerProps) {
  // SVG Coordinates for states
  const nodePositions: Record<StateId, { x: number; y: number }> = {
    DRAFT: { x: 130, y: 160 },
    SUBMITTED: { x: 320, y: 160 },
    UNDER_REVIEW: { x: 510, y: 160 },
    APPROVED: { x: 740, y: 90 },
    REJECTED: { x: 740, y: 250 },
  };

  const states = Object.values(LeaveAutomatonEngine.STATES);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Finite State Transition Diagram M = (Q, Σ, δ, q0, F)
          </h3>
          <p className="text-xs text-slate-500">
            Double border indicates terminal states F = {'{'}q3, q4{'}'}. Active state is highlighted in blue.
          </p>
        </div>
        {activeState && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs font-medium text-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Current State: <strong>{LeaveAutomatonEngine.STATES[activeState].code}</strong> ({LeaveAutomatonEngine.STATES[activeState].label})
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 880 320"
          className="w-full min-w-[760px] h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Standard arrow marker */}
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
            </marker>

            {/* Active arrow marker */}
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
            </marker>
          </defs>

          {/* 1. Start Pointer into q0 */}
          <path
            d="M 50 160 L 92 160"
            stroke="#475569"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrow)"
          />
          <text x="50" y="148" className="text-[11px] fill-slate-500 font-mono font-medium">
            Start
          </text>

          {/* 2. Self-loop: DRAFT -> DRAFT (SAVE_DRAFT) */}
          <path
            d="M 115 125 C 100 80, 160 80, 145 125"
            stroke={activeState === 'DRAFT' ? '#2563eb' : '#94a3b8'}
            strokeWidth={activeState === 'DRAFT' ? '2.5' : '1.75'}
            fill="none"
            markerEnd={activeState === 'DRAFT' ? 'url(#arrow-active)' : 'url(#arrow)'}
          />
          <text
            x="130"
            y="72"
            textAnchor="middle"
            className="text-[10px] font-mono fill-slate-600 font-medium"
          >
            SAVE_DRAFT
          </text>

          {/* 3. DRAFT -> SUBMITTED (SUBMIT) */}
          <path
            d="M 166 160 L 282 160"
            stroke={activeState === 'DRAFT' ? '#2563eb' : '#94a3b8'}
            strokeWidth={activeState === 'DRAFT' ? '2.5' : '1.75'}
            fill="none"
            markerEnd={activeState === 'DRAFT' ? 'url(#arrow-active)' : 'url(#arrow)'}
          />
          <text
            x="225"
            y="150"
            textAnchor="middle"
            className="text-[11px] font-mono font-semibold fill-slate-700"
          >
            SUBMIT
          </text>

          {/* 4. SUBMITTED -> UNDER_REVIEW (START_REVIEW) */}
          <path
            d="M 356 160 L 472 160"
            stroke={activeState === 'SUBMITTED' ? '#2563eb' : '#94a3b8'}
            strokeWidth={activeState === 'SUBMITTED' ? '2.5' : '1.75'}
            fill="none"
            markerEnd={activeState === 'SUBMITTED' ? 'url(#arrow-active)' : 'url(#arrow)'}
          />
          <text
            x="415"
            y="150"
            textAnchor="middle"
            className="text-[11px] font-mono font-semibold fill-slate-700"
          >
            START_REVIEW
          </text>

          {/* 5. SUBMITTED -> REJECTED (WITHDRAW) */}
          <path
            d="M 340 192 C 380 270, 600 280, 702 258"
            stroke={activeState === 'SUBMITTED' ? '#2563eb' : '#94a3b8'}
            strokeWidth={activeState === 'SUBMITTED' ? '2.5' : '1.75'}
            strokeDasharray="4,4"
            fill="none"
            markerEnd={activeState === 'SUBMITTED' ? 'url(#arrow-active)' : 'url(#arrow)'}
          />
          <text
            x="490"
            y="280"
            textAnchor="middle"
            className="text-[10px] font-mono fill-slate-600 font-medium"
          >
            WITHDRAW
          </text>

          {/* 6. UNDER_REVIEW -> APPROVED (APPROVE) */}
          <path
            d="M 542 142 L 704 102"
            stroke={activeState === 'UNDER_REVIEW' ? '#2563eb' : '#94a3b8'}
            strokeWidth={activeState === 'UNDER_REVIEW' ? '2.5' : '1.75'}
            fill="none"
            markerEnd={activeState === 'UNDER_REVIEW' ? 'url(#arrow-active)' : 'url(#arrow)'}
          />
          <text
            x="620"
            y="114"
            textAnchor="middle"
            className="text-[11px] font-mono font-semibold fill-emerald-700"
          >
            APPROVE
          </text>

          {/* 7. UNDER_REVIEW -> REJECTED (REJECT) */}
          <path
            d="M 542 178 L 704 238"
            stroke={activeState === 'UNDER_REVIEW' ? '#2563eb' : '#94a3b8'}
            strokeWidth={activeState === 'UNDER_REVIEW' ? '2.5' : '1.75'}
            fill="none"
            markerEnd={activeState === 'UNDER_REVIEW' ? 'url(#arrow-active)' : 'url(#arrow)'}
          />
          <text
            x="620"
            y="222"
            textAnchor="middle"
            className="text-[11px] font-mono font-semibold fill-rose-700"
          >
            REJECT
          </text>

          {/* 8. UNDER_REVIEW -> DRAFT (REQUEST_REVISION loopback) */}
          <path
            d="M 495 125 C 440 25, 200 25, 145 125"
            stroke={activeState === 'UNDER_REVIEW' ? '#2563eb' : '#94a3b8'}
            strokeWidth={activeState === 'UNDER_REVIEW' ? '2.5' : '1.75'}
            strokeDasharray="5,4"
            fill="none"
            markerEnd={activeState === 'UNDER_REVIEW' ? 'url(#arrow-active)' : 'url(#arrow)'}
          />
          <text
            x="320"
            y="38"
            textAnchor="middle"
            className="text-[10px] font-mono font-medium fill-amber-700"
          >
            REQUEST_REVISION (Loopback)
          </text>

          {/* Nodes (States) */}
          {states.map((st) => {
            const pos = nodePositions[st.id];
            const isActive = activeState === st.id;
            const isTerminal = st.isFinal;

            return (
              <g
                key={st.id}
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => onSelectState && onSelectState(st.id)}
              >
                {/* Outer Ring for Active State */}
                {isActive && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="44"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    className="animate-pulse opacity-75"
                  />
                )}

                {/* Double circle for terminal states */}
                {isTerminal && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="39"
                    fill="none"
                    stroke={
                      isActive
                        ? '#2563eb'
                        : st.id === 'APPROVED'
                        ? '#059669'
                        : '#e11d48'
                    }
                    strokeWidth="2"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="34"
                  fill={
                    isActive
                      ? '#eff6ff'
                      : st.id === 'APPROVED'
                      ? '#f0fdf4'
                      : st.id === 'REJECTED'
                      ? '#fff1f2'
                      : '#ffffff'
                  }
                  stroke={
                    isActive
                      ? '#2563eb'
                      : st.id === 'APPROVED'
                      ? '#10b981'
                      : st.id === 'REJECTED'
                      ? '#f43f5e'
                      : '#64748b'
                  }
                  strokeWidth={isActive ? '3' : '2'}
                />

                {/* State Code: q0, q1, etc. */}
                <text
                  x={pos.x}
                  y={pos.y - 4}
                  textAnchor="middle"
                  className={`text-sm font-bold font-mono ${
                    isActive ? 'fill-blue-700' : 'fill-slate-900'
                  }`}
                >
                  {st.code}
                </text>

                {/* State Label */}
                <text
                  x={pos.x}
                  y={pos.y + 12}
                  textAnchor="middle"
                  className={`text-[9px] font-sans font-medium tracking-tight ${
                    isActive ? 'fill-blue-800' : 'fill-slate-600'
                  }`}
                >
                  {st.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
        {states.map((st) => (
          <div
            key={st.id}
            onClick={() => onSelectState && onSelectState(st.id)}
            className={`p-2 rounded border cursor-pointer transition-colors ${
              activeState === st.id
                ? 'bg-blue-50 border-blue-300 font-semibold text-blue-900'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold">{st.code}</span>
              {st.isInitial && (
                <span className="px-1 text-[9px] rounded bg-slate-200 text-slate-700">Start</span>
              )}
              {st.isFinal && (
                <span className="px-1 text-[9px] rounded bg-emerald-100 text-emerald-800 font-medium">Final</span>
              )}
            </div>
            <div className="text-[11px] truncate mt-0.5">{st.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
