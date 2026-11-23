'use client';

import React, { useState } from 'react';
import { LeaveApplication, LeaveType, AlphabetSymbol } from '../lib/automata/types.ts';

interface LeaveApplicationModalProps {
  onClose: () => void;
  onSubmit: (app: Omit<LeaveApplication, 'id' | 'createdAt' | 'updatedAt' | 'history'>, symbol: AlphabetSymbol) => void;
  initialData?: LeaveApplication;
}

export function LeaveApplicationModal({ onClose, onSubmit, initialData }: LeaveApplicationModalProps) {
  const [studentName, setStudentName] = useState(initialData?.studentName || '');
  const [studentId, setStudentId] = useState(initialData?.studentId || '');
  const [department, setDepartment] = useState(initialData?.department || 'Computer Science & Engineering');
  const [semester, setSemester] = useState(initialData?.semester || '6th Semester');
  const [leaveType, setLeaveType] = useState<LeaveType>(initialData?.leaveType || 'Casual');
  const [startDate, setStartDate] = useState(initialData?.startDate || '2026-11-25');
  const [endDate, setEndDate] = useState(initialData?.endDate || '2026-11-26');
  const [reason, setReason] = useState(initialData?.reason || '');
  const [contactNumber, setContactNumber] = useState(initialData?.contactNumber || '');
  const [error, setError] = useState('');

  const calculateDays = () => {
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return isNaN(diffDays) ? 1 : diffDays;
    } catch {
      return 1;
    }
  };

  const handleSubmit = (actionSymbol: 'SAVE_DRAFT' | 'SUBMIT') => {
    if (!studentName.trim() || !studentId.trim() || !reason.trim()) {
      setError('Please provide student name, roll number, and reason.');
      return;
    }

    const daysCount = calculateDays();
    const payload = {
      studentName: studentName.trim(),
      studentId: studentId.trim().toUpperCase(),
      department,
      semester,
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason: reason.trim(),
      contactNumber: contactNumber.trim() || '+91 90000 00000',
      currentState: actionSymbol === 'SUBMIT' ? ('SUBMITTED' as const) : ('DRAFT' as const),
    };

    onSubmit(payload, actionSymbol);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-lg shadow-xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {initialData ? 'Revise Leave Application' : 'New Leave Application'}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Initial State: q0 (Draft) • State Automaton Input
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Student Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Verma"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Student Roll / Reg Number</label>
              <input
                type="text"
                required
                placeholder="e.g. CS22B099"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-600 bg-white font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="3rd Semester">3rd Semester</option>
                <option value="4th Semester">4th Semester</option>
                <option value="5th Semester">5th Semester</option>
                <option value="6th Semester">6th Semester</option>
                <option value="7th Semester">7th Semester</option>
                <option value="8th Semester">8th Semester</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Leave Category</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="Casual">Casual Leave</option>
                <option value="Medical">Medical Leave</option>
                <option value="Academic Duty">Academic Duty</option>
                <option value="Internship">Internship</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-600 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-600 bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Absence Reason & Academic Justification
            </label>
            <textarea
              rows={3}
              required
              placeholder="State clear reasons (e.g. Attending hackathon, doctor advised rest, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Emergency Contact Number</label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-600 bg-white font-mono"
            />
          </div>
        </div>

        {/* Footer with State Transition Triggers */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit('SAVE_DRAFT')}
              className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 rounded text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer font-mono"
            >
              Save as Draft [δ(q0, SAVE_DRAFT)]
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('SUBMIT')}
              className="px-3.5 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors cursor-pointer font-mono"
            >
              Submit Application [δ(q0, SUBMIT) → q1]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
