import { useEffect, useRef, useState } from 'react'

/** Slow, readable pacing — ~9s reasoning → results handoff */
const REASONING_HEADER_DELAY_MS = 400
const REASONING_STEP_GAP_MS = 1400
const REASONING_EXIT_MS = 700
const RESULTS_START_DELAY_MS = 200
const RESULTS_SECTION_GAP_MS = 550
const PROGRESS_COMPLETE_GAP_MS = 450
const SUGGESTION_CHIPS_DELAY_MS = 400

const REASONING_STEP_COUNT = 3
const RESULTS_SECTION_COUNT = 6 // lead, 3 summary blocks, need-action, footer

export type ProcessingPhase = 'reasoning' | 'results'

export function useAgentProcessingAnimation() {
  const [phase, setPhase] = useState<ProcessingPhase>('reasoning')
  const [reasoningHeaderVisible, setReasoningHeaderVisible] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [reasoningExiting, setReasoningExiting] = useState(false)
  const [resultsVisible, setResultsVisible] = useState(false)
  const [resultsSectionsVisible, setResultsSectionsVisible] = useState(0)
  const [activeProgressIndex, setActiveProgressIndex] = useState(-1)
  const [completedProgress, setCompletedProgress] = useState(0)
  const [showSuggestionChips, setShowSuggestionChips] = useState(false)
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const schedule = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay)
    timersRef.current.push(id)
    return id
  }

  useEffect(() => {
    clearTimers()
    let elapsed = 0

    schedule(() => setReasoningHeaderVisible(true), elapsed)
    elapsed += REASONING_HEADER_DELAY_MS

    for (let step = 1; step <= REASONING_STEP_COUNT; step += 1) {
      const stepIndex = step
      schedule(() => {
        setVisibleSteps(stepIndex)
        setActiveProgressIndex(stepIndex - 1)
      }, elapsed)
      elapsed += REASONING_STEP_GAP_MS
    }

    schedule(() => setReasoningExiting(true), elapsed)
    elapsed += REASONING_EXIT_MS

    schedule(() => {
      setPhase('results')
      setReasoningExiting(false)
      setActiveProgressIndex(-1)
      setResultsVisible(true)
    }, elapsed)
    elapsed += RESULTS_START_DELAY_MS

    for (let i = 1; i <= 3; i += 1) {
      const count = i
      schedule(() => setCompletedProgress(count), elapsed)
      elapsed += PROGRESS_COMPLETE_GAP_MS
    }

    for (let section = 1; section <= RESULTS_SECTION_COUNT; section += 1) {
      const count = section
      schedule(() => setResultsSectionsVisible(count), elapsed)
      elapsed += RESULTS_SECTION_GAP_MS
    }

    schedule(() => setShowSuggestionChips(true), elapsed + SUGGESTION_CHIPS_DELAY_MS)

    return clearTimers
  }, [])

  return {
    phase,
    reasoningHeaderVisible,
    visibleSteps,
    reasoningExiting,
    resultsVisible,
    resultsSectionsVisible,
    activeProgressIndex,
    completedProgress,
    showSuggestionChips,
  }
}
