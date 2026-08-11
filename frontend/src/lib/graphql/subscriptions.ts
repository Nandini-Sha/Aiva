export const WATCH_STEP_RUNS = `
subscription WatchStepRuns($runId: uuid!) {
  step_runs(where: {workflow_run_id: {_eq: $runId}}) {
    id
    status
    result
    created_at
  }
}`;
