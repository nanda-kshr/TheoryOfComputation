import test from 'node:test';
import assert from 'node:assert/strict';
import { LeaveAutomatonEngine } from '../lib/automata/engine.ts';

test('Initial state is q0 (DRAFT) and final states are q3 (APPROVED) and q4 (REJECTED)', () => {
  assert.equal(LeaveAutomatonEngine.INITIAL_STATE, 'DRAFT');
  assert.deepEqual(LeaveAutomatonEngine.FINAL_STATES, ['APPROVED', 'REJECTED']);
  assert.equal(LeaveAutomatonEngine.isFinalState('APPROVED'), true);
  assert.equal(LeaveAutomatonEngine.isFinalState('REJECTED'), true);
  assert.equal(LeaveAutomatonEngine.isFinalState('DRAFT'), false);
  assert.equal(LeaveAutomatonEngine.isFinalState('UNDER_REVIEW'), false);
});

test('Valid execution sequence: Draft -> Submitted -> Under Review -> Approved', () => {
  // Step 1: Draft -> Submitted via SUBMIT
  const step1 = LeaveAutomatonEngine.transition('DRAFT', 'SUBMIT', 'STUDENT');
  assert.equal(step1.success, true);
  assert.equal(step1.nextState, 'SUBMITTED');

  // Step 2: Submitted -> Under Review via START_REVIEW
  const step2 = LeaveAutomatonEngine.transition(step1.nextState, 'START_REVIEW', 'FACULTY');
  assert.equal(step2.success, true);
  assert.equal(step2.nextState, 'UNDER_REVIEW');

  // Step 3: Under Review -> Approved via APPROVE
  const step3 = LeaveAutomatonEngine.transition(step2.nextState, 'APPROVE', 'FACULTY');
  assert.equal(step3.success, true);
  assert.equal(step3.nextState, 'APPROVED');
  assert.equal(LeaveAutomatonEngine.isFinalState(step3.nextState), true);
});

test('Valid execution sequence: Draft -> Submitted -> Under Review -> Rejected', () => {
  const step1 = LeaveAutomatonEngine.transition('DRAFT', 'SUBMIT');
  assert.equal(step1.nextState, 'SUBMITTED');

  const step2 = LeaveAutomatonEngine.transition('SUBMITTED', 'START_REVIEW');
  assert.equal(step2.nextState, 'UNDER_REVIEW');

  const step3 = LeaveAutomatonEngine.transition('UNDER_REVIEW', 'REJECT');
  assert.equal(step3.success, true);
  assert.equal(step3.nextState, 'REJECTED');
  assert.equal(LeaveAutomatonEngine.isFinalState(step3.nextState), true);
});

test('Revision cycle: Under Review -> Draft -> Submitted -> Under Review -> Approved', () => {
  // Faculty requests revision
  const rev = LeaveAutomatonEngine.transition('UNDER_REVIEW', 'REQUEST_REVISION', 'FACULTY');
  assert.equal(rev.success, true);
  assert.equal(rev.nextState, 'DRAFT');

  // Student edits and re-submits
  const save = LeaveAutomatonEngine.transition('DRAFT', 'SAVE_DRAFT', 'STUDENT');
  assert.equal(save.nextState, 'DRAFT');

  const resubmit = LeaveAutomatonEngine.transition('DRAFT', 'SUBMIT', 'STUDENT');
  assert.equal(resubmit.nextState, 'SUBMITTED');
});

test('Student can withdraw application from Submitted state', () => {
  const withdrawal = LeaveAutomatonEngine.transition('SUBMITTED', 'WITHDRAW', 'STUDENT');
  assert.equal(withdrawal.success, true);
  assert.equal(withdrawal.nextState, 'REJECTED');
});

test('Invalid transitions are blocked as trap states (Preserves determinism)', () => {
  // Direct leap from Draft to Approved is invalid
  const invalid1 = LeaveAutomatonEngine.transition('DRAFT', 'APPROVE');
  assert.equal(invalid1.success, false);
  assert.equal(invalid1.nextState, 'DRAFT');
  assert.match(invalid1.error || '', /Trap state/);

  // Transitioning out of terminal state Approved is invalid
  const invalid2 = LeaveAutomatonEngine.transition('APPROVED', 'SUBMIT');
  assert.equal(invalid2.success, false);
});

test('Role-based enforcement prevents unauthorized actors', () => {
  // Student cannot APPROVE
  const studentApprove = LeaveAutomatonEngine.transition('UNDER_REVIEW', 'APPROVE', 'STUDENT');
  assert.equal(studentApprove.success, false);
  assert.match(studentApprove.error || '', /Permission denied/);

  // Faculty cannot SUBMIT student leave
  const facultySubmit = LeaveAutomatonEngine.transition('DRAFT', 'SUBMIT', 'FACULTY');
  assert.equal(facultySubmit.success, false);
  assert.match(facultySubmit.error || '', /Permission denied/);
});

test('String trace: Accepted string w ∈ L(M)', () => {
  const trace = LeaveAutomatonEngine.traceString(['SUBMIT', 'START_REVIEW', 'APPROVE']);
  assert.equal(trace.isAccepted, true);
  assert.equal(trace.finalState, 'APPROVED');
  assert.equal(trace.steps.length, 3);
  assert.match(trace.verdict, /ACCEPTED/);
});

test('String trace: Incomplete string terminating in non-final state w ∉ L(M)', () => {
  const trace = LeaveAutomatonEngine.traceString(['SUBMIT', 'START_REVIEW']);
  assert.equal(trace.isAccepted, false);
  assert.equal(trace.finalState, 'UNDER_REVIEW');
  assert.match(trace.verdict, /REJECTED.*non-final/);
});

test('String trace: Invalid string triggering trap state', () => {
  const trace = LeaveAutomatonEngine.traceString(['APPROVE', 'SUBMIT']);
  assert.equal(trace.isAccepted, false);
  assert.equal(trace.finalState, 'TRAP');
  assert.match(trace.verdict, /invalid state transition/);
});

test('Transition matrix δ(Q, Σ) covers all 5 states and 7 alphabet symbols', () => {
  const matrix = LeaveAutomatonEngine.getTransitionMatrix();
  assert.equal(matrix.length, 5);
  for (const row of matrix) {
    assert.equal(Object.keys(row.transitions).length, 7);
  }
});
