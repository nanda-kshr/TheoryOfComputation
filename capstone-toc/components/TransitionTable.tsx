'use client';

import React, { useState } from 'react';
import { StateId, AlphabetSymbol, TransitionRule } from '../lib/automata/types.ts';
import { LeaveAutomatonEngine } from '../lib/automata/engine.ts';

interface TransitionTableProps {
  activeState?: StateId;
}

export function TransitionTable({ activeState }: TransitionTableProps) {
  const [selectedCell, setSelectedCell] = useState<{
    from: StateId;
    symbol: AlphabetSymbol;
    to: StateId | null;
    rule: TransitionRule | null;
  } | null>(null);

  const matrix = LeaveAutomatonEngine.getTransitionMatrix();
  const alphabet = LeaveAutomatonEngine.ALPHABET;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      <div className="mb-4 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            State Transition Table δ: Q × Σ → Q
          </h3>
          <p className="text-xs text-slate-500">
            Formal deterministic mapping of state qi ∈ Q and input symbol σ ∈ Σ. Empty cells represent trap transitions ∅.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
          |Q| = 5, |Σ| = 7
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-mono">
              <th className="py-2.5 px-3 font-semibold border-r border-slate-200">
                Current State ($Q$)
              </th>
              {alphabet.map((sym) => (
                <th key={sym} className="py-2.5 px-2 font-semibold text-center border-r border-slate-200">
                  {sym}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matrix.map((row) => {
              const isRowActive = activeState === row.state.id;

              return (
                <tr
                  key={row.state.id}
                  className={`transition-colors ${
                    isRowActive ? 'bg-blue-50/70' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="py-2.5 px-3 border-r border-slate-200 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">
                        {row.state.isInitial && '→ '}
                        {row.state.isFinal && '* '}
                        {row.state.code}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        ({row.state.label})
                      </span>
                      {isRowActive && (
                        <span className="ml-auto px-1.5 py-0.2 rounded bg-blue-600 text-white text-[10px] font-mono">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </td>

                  {alphabet.map((sym) => {
                    const cell = row.transitions[sym];
                    const hasTransition = !!cell.target;

                    return (
                      <td
                        key={sym}
                        onClick={() =>
                          setSelectedCell({
                            from: row.state.id,
                            symbol: sym,
                            to: cell.target ? cell.target.id : null,
                            rule: cell.rule,
                          })
                        }
                        className={`py-2 px-2 text-center border-r border-slate-200 cursor-pointer font-mono transition-colors ${
                          hasTransition
                            ? 'text-blue-700 font-bold hover:bg-blue-100/60'
                            : 'text-slate-300 hover:bg-slate-100/50'
                        }`}
                      >
                        {hasTransition ? cell.target!.code : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Transition Detail Box */}
      {selectedCell ? (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs">
          <div className="flex items-center justify-between font-mono font-medium text-slate-800 mb-1">
            <span>
              Function: δ({LeaveAutomatonEngine.STATES[selectedCell.from].code}, {selectedCell.symbol}) ={' '}
              {selectedCell.to
                ? `${LeaveAutomatonEngine.STATES[selectedCell.to].code} (${LeaveAutomatonEngine.STATES[selectedCell.to].label})`
                : '∅ (Trap State)'}
            </span>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-slate-400 hover:text-slate-700 text-sm font-sans"
            >
              ✕
            </button>
          </div>
          {selectedCell.rule ? (
            <p className="text-slate-600">
              {selectedCell.rule.description}{' '}
              <span className="font-semibold text-slate-800">
                [Authorized: {selectedCell.rule.allowedRole.join(', ')}]
              </span>
            </p>
          ) : (
            <p className="text-rose-600">
              Undefined transition: Input is rejected and triggers no state shift in deterministic automaton.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3 text-[11px] text-slate-400 italic">
          Click any cell in the matrix to inspect formal transition rules, authorization constraints, and descriptions.
        </div>
      )}
    </div>
  );
}
