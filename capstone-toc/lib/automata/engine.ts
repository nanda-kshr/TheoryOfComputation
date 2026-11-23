import type {
  StateId,
  AlphabetSymbol,
  StateDefinition,
  TransitionRule,
  TransitionResult,
  UserRole,
  TraceResult,
  TraceStep,
} from './types.ts';

export class LeaveAutomatonEngine {
  public static readonly STATES: Record<StateId, StateDefinition> = {
    DRAFT: {
      id: 'DRAFT',
      code: 'q0',
      label: 'Draft',
      isInitial: true,
      isFinal: false,
      description: 'Application is being prepared or revised by student.',
    },
    SUBMITTED: {
      id: 'SUBMITTED',
      code: 'q1',
      label: 'Submitted',
      isInitial: false,
      isFinal: false,
      description: 'Application successfully submitted and queued for review.',
    },
    UNDER_REVIEW: {
      id: 'UNDER_REVIEW',
      code: 'q2',
      label: 'Under Review',
      isInitial: false,
      isFinal: false,
      description: 'Application actively being evaluated by faculty mentor/advisor.',
    },
    APPROVED: {
      id: 'APPROVED',
      code: 'q3',
      label: 'Approved',
      isInitial: false,
      isFinal: true,
      description: 'Leave request approved; formal leave clearance generated.',
    },
    REJECTED: {
      id: 'REJECTED',
      code: 'q4',
      label: 'Rejected / Withdrawn',
      isInitial: false,
      isFinal: true,
      description: 'Leave request rejected by faculty or cancelled by student.',
    },
  };

  public static readonly ALPHABET: AlphabetSymbol[] = [
    'SAVE_DRAFT',
    'SUBMIT',
    'START_REVIEW',
    'REQUEST_REVISION',
    'APPROVE',
    'REJECT',
    'WITHDRAW',
  ];

  public static readonly TRANSITIONS: TransitionRule[] = [
    {
      from: 'DRAFT',
      symbol: 'SAVE_DRAFT',
      to: 'DRAFT',
      allowedRole: ['STUDENT'],
      description: 'Student saves updates while keeping application in draft.',
    },
    {
      from: 'DRAFT',
      symbol: 'SUBMIT',
      to: 'SUBMITTED',
      allowedRole: ['STUDENT'],
      description: 'Student formalizes and submits the leave application.',
    },
    {
      from: 'SUBMITTED',
      symbol: 'START_REVIEW',
      to: 'UNDER_REVIEW',
      allowedRole: ['FACULTY'],
      description: 'Faculty advisor locks application and initiates scrutiny.',
    },
    {
      from: 'SUBMITTED',
      symbol: 'WITHDRAW',
      to: 'REJECTED',
      allowedRole: ['STUDENT'],
      description: 'Student cancels their pending leave before review finishes.',
    },
    {
      from: 'UNDER_REVIEW',
      symbol: 'APPROVE',
      to: 'APPROVED',
      allowedRole: ['FACULTY'],
      description: 'Faculty verifies attendance & reasons, granting formal approval.',
    },
    {
      from: 'UNDER_REVIEW',
      symbol: 'REJECT',
      to: 'REJECTED',
      allowedRole: ['FACULTY'],
      description: 'Faculty rejects application with formal explanation.',
    },
    {
      from: 'UNDER_REVIEW',
      symbol: 'REQUEST_REVISION',
      to: 'DRAFT',
      allowedRole: ['FACULTY'],
      description: 'Faculty requests changes/documents, resetting state to draft for edit.',
    },
  ];

  public static readonly INITIAL_STATE: StateId = 'DRAFT';
  public static readonly FINAL_STATES: StateId[] = ['APPROVED', 'REJECTED'];

  /**
   * Deterministic transition function: δ(q, σ) -> q'
   */
  public static delta(fromState: StateId, symbol: AlphabetSymbol): StateId | null {
    const rule = this.TRANSITIONS.find(
      (t) => t.from === fromState && t.symbol === symbol
    );
    return rule ? rule.to : null;
  }

  /**
   * Validate and perform transition with role check
   */
  public static transition(
    currentState: StateId,
    symbol: AlphabetSymbol,
    role?: UserRole
  ): TransitionResult {
    const rule = this.TRANSITIONS.find(
      (t) => t.from === currentState && t.symbol === symbol
    );

    if (!rule) {
      return {
        success: false,
        previousState: currentState,
        nextState: currentState,
        symbol,
        error: `Invalid transition: δ(${this.STATES[currentState].code}, ${symbol}) is undefined (Trap state).`,
      };
    }

    if (role && !rule.allowedRole.includes(role)) {
      return {
        success: false,
        previousState: currentState,
        nextState: currentState,
        symbol,
        error: `Permission denied: Role ${role} cannot execute symbol ${symbol}. Allowed: ${rule.allowedRole.join(', ')}.`,
      };
    }

    return {
      success: true,
      previousState: currentState,
      nextState: rule.to,
      symbol,
    };
  }

  /**
   * Retrieve valid outgoing transitions from a given state
   */
  public static getAvailableTransitions(
    currentState: StateId,
    role?: UserRole
  ): TransitionRule[] {
    return this.TRANSITIONS.filter(
      (t) => t.from === currentState && (!role || t.allowedRole.includes(role))
    );
  }

  /**
   * Check if a state is an accepting / final state in the FA
   */
  public static isFinalState(state: StateId): boolean {
    return this.FINAL_STATES.includes(state);
  }

  /**
   * Evaluates an arbitrary string of symbols w ∈ Σ* starting from q0
   * Used for formal TOC string trace and verification
   */
  public static traceString(
    symbols: AlphabetSymbol[],
    startState: StateId = this.INITIAL_STATE
  ): TraceResult {
    const steps: TraceStep[] = [];
    let current: StateId = startState;
    let halted = false;

    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      if (halted) {
        steps.push({
          step: i + 1,
          symbol: sym,
          fromState: current,
          toState: 'TRAP',
          isValid: false,
          explanation: `Automaton already halted in trap state. Symbol '${sym}' rejected.`,
        });
        continue;
      }

      const next = this.delta(current, sym);
      if (!next) {
        halted = true;
        steps.push({
          step: i + 1,
          symbol: sym,
          fromState: current,
          toState: 'TRAP',
          isValid: false,
          explanation: `δ(${this.STATES[current].code}, ${sym}) is undefined. Transitioned into dead/trap state.`,
        });
      } else {
        steps.push({
          step: i + 1,
          symbol: sym,
          fromState: current,
          toState: next,
          isValid: true,
          explanation: `δ(${this.STATES[current].code}, ${sym}) → ${this.STATES[next].code} (${this.STATES[next].label})`,
        });
        current = next;
      }
    }

    const isAccepted = !halted && this.isFinalState(current);
    let verdict = '';
    if (halted) {
      verdict = 'REJECTED: String entered an invalid state transition (Trap state).';
    } else if (isAccepted) {
      verdict = `ACCEPTED: String terminated in final accept state ${this.STATES[current].code} (${this.STATES[current].label}). w ∈ L(M).`;
    } else {
      verdict = `REJECTED: String terminated in non-final state ${this.STATES[current].code} (${this.STATES[current].label}). w ∉ L(M).`;
    }

    return {
      inputString: symbols,
      initialState: startState,
      finalState: halted ? 'TRAP' : current,
      isAccepted,
      steps,
      verdict,
    };
  }

  /**
   * Generates the complete State Transition Table matrix δ(Q, Σ)
   */
  public static getTransitionMatrix(): {
    state: StateDefinition;
    transitions: Record<AlphabetSymbol, { target: StateDefinition | null; rule: TransitionRule | null }>;
  }[] {
    const stateKeys = Object.keys(this.STATES) as StateId[];

    return stateKeys.map((stateId) => {
      const stateDef = this.STATES[stateId];
      const rowTransitions: Record<
        AlphabetSymbol,
        { target: StateDefinition | null; rule: TransitionRule | null }
      > = {} as any;

      this.ALPHABET.forEach((symbol) => {
        const targetId = this.delta(stateId, symbol);
        const rule = this.TRANSITIONS.find(
          (t) => t.from === stateId && t.symbol === symbol
        ) || null;

        rowTransitions[symbol] = {
          target: targetId ? this.STATES[targetId] : null,
          rule,
        };
      });

      return {
        state: stateDef,
        transitions: rowTransitions,
      };
    });
  }
}
