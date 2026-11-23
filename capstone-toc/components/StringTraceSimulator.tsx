'use client';

import React, { useState } from 'react';
import { AlphabetSymbol, TraceResult } from '../lib/automata/types.ts';
import { LeaveAutomatonEngine } from '../lib/automata/engine.ts';

export function StringTraceSimulator() {
  const [selectedTokens, setSelectedTokens] = useState<AlphabetSymbol[]>([
    'SUBMIT',
    'START_REVIEW',
    'APPROVE',
  ]);
  const [traceResult, setTraceResult] = useState<TraceResult | null>(() =>
    LeaveAutomatonEngine.traceString(['SUBMIT', 'START_REVIEW', 'APPROVE'])
  );

  const presets: { name: string; description: string; tokens: AlphabetSymbol[] }[] = [
    {
      name: 'Happy Path: Direct Approval',
      description: 'q0 → (SUBMIT) → q1 → (START_REVIEW) → q2 → (APPROVE) → q3 [ACCEPTED]',
      tokens: ['SUBMIT', 'START_REVIEW', 'APPROVE'],
    },
    {
      name: 'Revision Loopback Cycle',
      description: 'q0 → SUBMIT → q1 → REVIEW → q2 → REQUEST_REVISION → q0 → SUBMIT → q1 → REVIEW → q2 → APPROVE [ACCEPTED]',
      tokens: ['SUBMIT', 'START_REVIEW', 'REQUEST_REVISION', 'SUBMIT', 'START_REVIEW', 'APPROVE'],
    },
    {
      name: 'Student Self-Withdrawal',
      description: 'q0 → (SUBMIT) → q1 → (WITHDRAW) → q4 [ACCEPTED IN REJECTED STATE]',
      tokens: ['SUBMIT', 'WITHDRAW'],
    },
    {
      name: 'Faculty Denies Leave',
      description: 'q0 → (SUBMIT) → q1 → (START_REVIEW) → q2 → (REJECT) → q4 [ACCEPTED IN REJECTED STATE]',
      tokens: ['SUBMIT', 'START_REVIEW', 'REJECT'],
    },
    {
      name: 'Invalid String (Direct Approve from Draft)',
      description: 'q0 → (APPROVE) → TRAP [REJECTED: δ(q0, APPROVE) is undefined]',
      tokens: ['APPROVE'],
    },
    {
      name: 'Incomplete String (Halts in q2)',
      description: 'q0 → (SUBMIT) → q1 → (START_REVIEW) → q2 [REJECTED: q2 ∉ F]',
      tokens: ['SUBMIT', 'START_REVIEW'],
    },
  ];

  const handleRunSimulation = (tokens: AlphabetSymbol[]) => {
    const res = LeaveAutomatonEngine.traceString(tokens);
    setTraceResult(res);
  };

  const handleApplyPreset = (tokens: AlphabetSymbol[]) => {
    setSelectedTokens(tokens);
    handleRunSimulation(tokens);
  };

  const handleAddToken = (sym: AlphabetSymbol) => {
    const updated = [...selectedTokens, sym];
    setSelectedTokens(updated);
    handleRunSimulation(updated);
  };

  const handleRemoveToken = (idx: number) => {
    const updated = selectedTokens.filter((_, i) => i !== idx);
    setSelectedTokens(updated);
    handleRunSimulation(updated);
  };

  const handleClear = () => {
    setSelectedTokens([]);
    setTraceResult(null);
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      <div className="mb-4 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            TOC String Trace Simulator (w ∈ Σ*)
          </h3>
          <p className="text-xs text-slate-500">
            Verify whether a language sequence w is recognized by the automaton M: L(M) = {'{'}w | δ*(q0, w) ∈ F{'}'}.
          </p>
        </div>
        <button
          onClick={handleClear}
          className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50"
        >
          Clear String
        </button>
      </div>

      {/* Presets */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Theoretical Test Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p.tokens)}
              className="text-left p-2.5 rounded border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-xs group"
            >
              <div className="font-semibold text-slate-900 group-hover:text-blue-700 flex items-center justify-between">
                <span>{p.name}</span>
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-600">
                  |w|={p.tokens.length}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {p.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input String Display & Symbol Pad */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-md mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Input Tape String w:
          </label>
          <span className="text-xs font-mono text-slate-500">
            Length: {selectedTokens.length} symbol{selectedTokens.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-2 bg-white border border-slate-200 rounded">
          {selectedTokens.length === 0 ? (
            <span className="text-xs text-slate-400 italic">
              Empty string (ε). Click symbols below to compose test string.
            </span>
          ) : (
            selectedTokens.map((tok, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 rounded text-xs font-mono font-medium transition-colors cursor-pointer group"
                onClick={() => handleRemoveToken(idx)}
                title="Click to remove"
              >
                <span className="text-slate-400 text-[10px]">{idx + 1}:</span>
                {tok}
                <span className="text-slate-400 group-hover:text-rose-600 ml-0.5">×</span>
              </span>
            ))
          )}
        </div>

        {/* Alphabet Token Selector */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 mr-1 font-mono">Append σ ∈ Σ:</span>
          {LeaveAutomatonEngine.ALPHABET.map((sym) => (
            <button
              key={sym}
              onClick={() => handleAddToken(sym)}
              className="px-2 py-1 text-xs font-mono bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 hover:border-slate-400 transition-colors"
            >
              +{sym}
            </button>
          ))}
        </div>
      </div>

      {/* Trace Evaluation Results */}
      {traceResult && (
        <div className="border border-slate-200 rounded-md overflow-hidden">
          {/* Verdict Banner */}
          <div
            className={`p-3 border-b flex items-center justify-between font-mono text-xs font-bold ${
              traceResult.isAccepted
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  traceResult.isAccepted ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
              <span>{traceResult.verdict}</span>
            </div>
            <span>
              Final State: {traceResult.finalState}
            </span>
          </div>

          {/* Trace Steps Timeline */}
          <div className="p-3 bg-white divide-y divide-slate-100">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
              Extended Transition Execution: δ*(q0, w)
            </div>

            {traceResult.steps.length === 0 ? (
              <div className="text-xs text-slate-500 py-2 italic">
                Initial state remains $q_0$ (DRAFT). Since $q_0 \notin F$, the empty string $\epsilon$ is rejected.
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {traceResult.steps.map((st) => (
                  <div
                    key={st.step}
                    className={`flex items-start gap-3 p-2 rounded text-xs font-mono ${
                      st.isValid
                        ? 'bg-slate-50 border border-slate-100'
                        : 'bg-rose-50/70 border border-rose-200 text-rose-800'
                    }`}
                  >
                    <span className="w-6 font-bold text-slate-400">#{st.step}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">
                        {st.explanation}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                        st.isValid
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-rose-200 text-rose-800'
                      }`}
                    >
                      {st.isValid ? 'Valid' : 'Halt'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
