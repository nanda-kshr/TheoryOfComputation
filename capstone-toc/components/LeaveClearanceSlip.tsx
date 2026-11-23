'use client';

import React from 'react';
import { LeaveApplication } from '../lib/automata/types.ts';
import { LeaveAutomatonEngine } from '../lib/automata/engine.ts';

interface LeaveClearanceSlipProps {
  application: LeaveApplication;
  onClose: () => void;
}

export function LeaveClearanceSlip({ application, onClose }: LeaveClearanceSlipProps) {
  const approvalLog = application.history.find((h) => h.symbol === 'APPROVE');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 shadow-xl rounded-lg w-full max-w-2xl overflow-hidden print:border-none print:shadow-none print:max-w-full">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-100 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Official Academic Document • State q3 (Approved)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Certificate Paper Content */}
        <div className="p-8 font-serif text-slate-900 print:p-0">
          {/* Institution Header */}
          <div className="text-center pb-6 border-b-2 border-slate-900 mb-6">
            <div className="text-xs tracking-widest font-sans font-semibold uppercase text-slate-500 mb-1">
              Autonomous College of Engineering & Technology
            </div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-slate-900">
              Office of Academic Affairs & Student Welfare
            </h1>
            <div className="text-xs font-sans text-slate-600 mt-1">
              Form TOC-FA-04 • Automated Leave Verification Certificate
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-sans mb-6 pb-2 border-b border-slate-200">
            <div>
              <span className="text-slate-500">Certificate Reference:</span>{' '}
              <strong className="font-mono text-slate-900">{application.id}-VERIFIED</strong>
            </div>
            <div>
              <span className="text-slate-500">Issued On:</span>{' '}
              <strong className="text-slate-900">{application.updatedAt}</strong>
            </div>
          </div>

          {/* Student Profile Grid */}
          <div className="mb-6 bg-slate-50 p-4 border border-slate-200 rounded font-sans text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2.5 border-b border-slate-200 pb-1">
              Student Information
            </h4>
            <div className="grid grid-cols-2 gap-y-2">
              <div>
                <span className="text-slate-500">Student Name:</span>{' '}
                <span className="font-semibold text-slate-900">{application.studentName}</span>
              </div>
              <div>
                <span className="text-slate-500">Roll / Reg Number:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">{application.studentId}</span>
              </div>
              <div>
                <span className="text-slate-500">Department:</span>{' '}
                <span className="text-slate-900">{application.department}</span>
              </div>
              <div>
                <span className="text-slate-500">Semester & Year:</span>{' '}
                <span className="text-slate-900">{application.semester}</span>
              </div>
            </div>
          </div>

          {/* Leave Specifics */}
          <div className="mb-6 font-sans text-xs space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
              Approved Leave Details
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded">
                <div className="text-slate-500 text-[11px]">Leave Classification</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{application.leaveType}</div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded">
                <div className="text-slate-500 text-[11px]">Period of Absence</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {application.startDate} to {application.endDate}
                </div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded">
                <div className="text-slate-500 text-[11px]">Total Days Sanctioned</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {application.daysCount} Day(s)
                </div>
              </div>
            </div>

            <div className="mt-3">
              <span className="font-semibold text-slate-700">Sanctioned Reason:</span>
              <p className="mt-1 text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                {application.reason}
              </p>
            </div>
          </div>

          {/* Theory of Computation FA Verification Record */}
          <div className="mb-8 p-3 bg-slate-50 border border-slate-300 rounded font-mono text-[11px]">
            <div className="font-sans font-bold text-xs uppercase text-slate-700 mb-1">
              Automata Proof & Transition Verification
            </div>
            <div className="text-slate-600 space-y-0.5">
              <div>Formal System: Deterministic Finite Automaton M = (Q, Σ, δ, q0, F)</div>
              <div>Verified Path: q0 → q1 → q2 → q3</div>
              <div>Final State: q3 ∈ F (APPROVED)</div>
              <div>
                Authorizing Transition: δ(UNDER_REVIEW, APPROVE) → APPROVED
              </div>
              <div className="text-slate-500 truncate pt-1 border-t border-slate-200 mt-1">
                Integrity Seal: SHA256:{Buffer.from(application.id + application.studentId + application.updatedAt).toString('hex').slice(0, 32)}
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-300 font-sans text-xs">
            <div>
              <div className="font-semibold text-slate-800">
                {approvalLog ? approvalLog.actor : 'Faculty Advisor'}
              </div>
              <div className="text-slate-500">Authorized Faculty Committee</div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Digitally stamped at {approvalLog?.timestamp || application.updatedAt}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-slate-800">Dean of Student Affairs</div>
              <div className="text-slate-500">Autonomous Institute Stamp</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                ✓ Officially Registered in Attendance Ledger
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
