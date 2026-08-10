DROP VIEW IF EXISTS org_usage_current_month;
DROP TRIGGER IF EXISTS set_workflow_steps_updated_at ON workflow_steps;
DROP TRIGGER IF EXISTS set_workflows_updated_at ON workflows;
DROP TRIGGER IF EXISTS set_organizations_updated_at ON organizations;
DROP FUNCTION IF EXISTS set_updated_at;

DROP TABLE IF EXISTS step_runs;
DROP TABLE IF EXISTS workflow_runs;
DROP TABLE IF EXISTS workflow_triggers;
DROP TABLE IF EXISTS workflow_steps;
DROP TABLE IF EXISTS workflows;
DROP TABLE IF EXISTS org_members;
DROP TABLE IF EXISTS organizations;
