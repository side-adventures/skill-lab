import type { TestComponentProps } from '../types'
import { DATA_OPTIONS } from './lab'
import { MatrixLab } from './MatrixLabTest'

/** The Matrix Data Lab: one fixed setup (`DATA_OPTIONS` in lab.ts), no settings, its own log. */
/** Bump together with any change to DATA_OPTIONS, so downloads from different setups never mix. */
const TAG = 'data-1'

export default function MatrixDataLabTest(props: TestComponentProps) {
  return (
    <MatrixLab
      {...props}
      fixed={DATA_OPTIONS}
      store="skill-lab:matrix-data"
      name="matrix-data"
      tag={TAG}
      about={
        <div className="space-y-2">
          <p className="text-zinc-300">Fixed setup, nothing to set.</p>
          <p>Every puzzle has 2 rules, at any level: on the figure, the dots or the stripes, along rows or down columns.</p>
          <p>Answer at your normal pace. <span className="text-zinc-300">Skip</span> a puzzle you can't give real attention; <span className="text-zinc-300">Don't count</span> an answer that was a guess.</p>
          <p className="text-zinc-500">The log keeps your answers in this browser. Download it from the log when you've played a batch.</p>
        </div>
      }
    />
  )
}
