export type StateId = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type AlphabetSymbol =
  | 'SAVE_DRAFT'
  | 'SUBMIT'
  | 'START_REVIEW'
  | 'REQUEST_REVISION'
  | 'APPROVE'
  | 'REJECT'
  | 'WITHDRAW';

export type UserRole = 'STUDENT' | 'FACULTY' | 'SYSTEM';

export type LeaveType = 'Medical' | 'Academic Duty' | 'Casual' | 'Emergency' | 'Internship';

export interface StateDefinition {
  id: StateId;
  code: string; // e.g. "q0", "q1"
  label: string;
  isInitial: boolean;
  isFinal: boolean;
  description: string;
}

export interface TransitionRule {
  from: StateId;
  symbol: AlphabetSymbol;
  to: StateId;
  allowedRole: UserRole[];
  description: string;
}

export interface TransitionLog {
  id: string;
  fromState: StateId;
  symbol: AlphabetSymbol;
  toState: StateId;
  timestamp: string;
  actor: string;
  role: UserRole;
  comments?: string;
}

export interface LeaveApplication {
  id: string;
  studentName: string;
  studentId: string;
  department: string;
  semester: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  contactNumber: string;
  currentState: StateId;
  createdAt: string;
  updatedAt: string;
  history: TransitionLog[];
}

export interface TransitionResult {
  success: boolean;
  previousState: StateId;
  nextState: StateId;
  symbol: AlphabetSymbol;
  error?: string;
}

export interface TraceStep {
  step: number;
  symbol: AlphabetSymbol;
  fromState: StateId;
  toState: StateId | 'TRAP';
  isValid: boolean;
  explanation: string;
}

export interface TraceResult {
  inputString: AlphabetSymbol[];
  initialState: StateId;
  finalState: StateId | 'TRAP';
  isAccepted: boolean;
  steps: TraceStep[];
  verdict: string;
}
