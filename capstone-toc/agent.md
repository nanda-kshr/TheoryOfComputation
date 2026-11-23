# Capstone TOC - Agent Guidelines

## Stack & Environment
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS v4 (Classic Light Theme)
- **Language:** TypeScript (strict mode)
- **Test Framework:** Node.js native test runner (`node --experimental-strip-types --test`)
- **Test Command:** `npm test`

## Architecture & Automaton Definition
Formal 5-tuple: $M = (Q, \Sigma, \delta, q_0, F)$

1. **States ($Q$):**
   - $q_0$: `DRAFT` (Initial)
   - $q_1$: `SUBMITTED`
   - $q_2$: `UNDER_REVIEW`
   - $q_3$: `APPROVED` (Terminal Accept)
   - $q_4$: `REJECTED` (Terminal Reject / Withdrawn)
   - $q_{\text{trap}}$: Handled deterministically by blocking unmapped pairs

2. **Alphabet ($\Sigma$):**
   - `SAVE_DRAFT`, `SUBMIT`, `START_REVIEW`, `REQUEST_REVISION`, `APPROVE`, `REJECT`, `WITHDRAW`

3. **Transition Function ($\delta$):**
   - $\delta(q_0, \text{SAVE\_DRAFT}) = q_0$
   - $\delta(q_0, \text{SUBMIT}) = q_1$
   - $\delta(q_1, \text{START\_REVIEW}) = q_2$
   - $\delta(q_1, \text{WITHDRAW}) = q_4$
   - $\delta(q_2, \text{APPROVE}) = q_3$
   - $\delta(q_2, \text{REJECT}) = q_4$
   - $\delta(q_2, \text{REQUEST\_REVISION}) = q_0$
   - Any undefined transition halts or returns an error.

4. **Accepting / Final States ($F$):**
   - $F = \{q_3, q_4\}$

5. **Key Modules:**
   - [engine.ts](file:///Users/nandakishore/Development/college/capstone-toc/lib/automata/engine.ts): Core deterministic transition engine & formal string tracer
   - [DfaVisualizer.tsx](file:///Users/nandakishore/Development/college/capstone-toc/components/DfaVisualizer.tsx): Interactive SVG state transition diagram
   - [StringTraceSimulator.tsx](file:///Users/nandakishore/Development/college/capstone-toc/components/StringTraceSimulator.tsx): Formal language recognition simulator ($w \in L(M)$)
   - [TransitionTable.tsx](file:///Users/nandakishore/Development/college/capstone-toc/components/TransitionTable.tsx): Complete matrix representation of $\delta(Q, \Sigma)$
   - [LeaveClearanceSlip.tsx](file:///Users/nandakishore/Development/college/capstone-toc/components/LeaveClearanceSlip.tsx): Academic clearance certificate for state $q_3$
   - [page.tsx](file:///Users/nandakishore/Development/college/capstone-toc/app/page.tsx): Main dashboard with student/faculty perspective switcher (no login needed)
