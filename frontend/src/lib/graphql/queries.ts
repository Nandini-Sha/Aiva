export const GET_ORG_WORKFLOWS = `
query GetOrganizationWorkflows($orgId: uuid!) {
  workflows(where: {org_id: {_eq: $orgId}}) {
    id
    name
    description
    steps(order_by: {order_index: asc}) {
      id
      type
      config
      order_index
    }
    triggers {
      id
      type
      config
    }
    runs(order_by: {created_at: desc}, limit: 1) {
      id
      status
      created_at
    }
  }
}`;
