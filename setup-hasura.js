const fs = require('fs');

const publicTables = [
  {
    "table": {
      "name": "leads",
      "schema": "public"
    },
    "object_relationships": [
      {
        "name": "organization",
        "using": {
          "foreign_key_constraint_on": "org_id"
        }
      }
    ],
    "insert_permissions": [
      {
        "role": "editor",
        "permission": {
          "check": {
            "organization": {
              "org_members": {
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          },
          "columns": [
            "email",
            "org_id",
            "status"
          ]
        }
      },
      {
        "role": "owner",
        "permission": {
          "check": {
            "organization": {
              "org_members": {
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          },
          "columns": [
            "email",
            "org_id",
            "status"
          ]
        }
      }
    ],
    "select_permissions": [
      {
        "role": "editor",
        "permission": {
          "columns": [
            "id",
            "org_id",
            "email",
            "status",
            "created_at"
          ],
          "filter": {
            "organization": {
              "org_members": {
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          }
        }
      },
      {
        "role": "owner",
        "permission": {
          "columns": [
            "id",
            "org_id",
            "email",
            "status",
            "created_at"
          ],
          "filter": {
            "organization": {
              "org_members": {
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          }
        }
      },
      {
        "role": "viewer",
        "permission": {
          "columns": [
            "id",
            "org_id",
            "email",
            "status",
            "created_at"
          ],
          "filter": {
            "organization": {
              "org_members": {
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          }
        }
      }
    ],
    "event_triggers": [
      {
        "name": "lead_inserted_trigger",
        "definition": {
          "enable_manual": true,
          "insert": {
            "columns": "*"
          }
        },
        "retry_conf": {
          "interval_sec": 10,
          "num_retries": 0,
          "timeout_sec": 60
        },
        "webhook": "{{FRONTEND_URL}}/api/webhook/db_event"
      }
    ]
  },
  {
    "table": {
      "name": "org_members",
      "schema": "public"
    },
    "object_relationships": [
      {
        "name": "organization",
        "using": {
          "foreign_key_constraint_on": "org_id"
        }
      }
    ],
    "select_permissions": [
      {
        "role": "editor",
        "permission": {
          "columns": [
            "id",
            "org_id",
            "user_id",
            "role",
            "created_at"
          ],
          "filter": {
            "organization": {
              "org_members": {
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          }
        }
      },
      {
        "role": "owner",
        "permission": {
          "columns": [
            "id",
            "org_id",
            "user_id",
            "role",
            "created_at"
          ],
          "filter": {
            "organization": {
              "org_members": {
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          }
        }
      },
      {
        "role": "viewer",
        "permission": {
          "columns": [
            "id",
            "org_id",
            "user_id",
            "role",
            "created_at"
          ],
          "filter": {
            "organization": {
              "org_members": {
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          }
        }
      }
    ]
  },
  {
    "table": {
      "name": "org_usage_current_month",
      "schema": "public"
    }
  },
  {
    "table": {
      "name": "organizations",
      "schema": "public"
    },
    "array_relationships": [
      {
        "name": "org_members",
        "using": {
          "foreign_key_constraint_on": {
            "column": "org_id",
            "table": {
              "name": "org_members",
              "schema": "public"
            }
          }
        }
      },
      {
        "name": "workflows",
        "using": {
          "foreign_key_constraint_on": {
            "column": "org_id",
            "table": {
              "name": "workflows",
              "schema": "public"
            }
          }
        }
      }
    ],
    "update_permissions": [
      {
        "role": "admin",
        "permission": {
          "columns": [
            "quota_used"
          ],
          "filter": {},
          "check": null
        }
      }
    ]
  },
  {
    "table": {
      "name": "step_runs",
      "schema": "public"
    },
    "object_relationships": [
      {
        "name": "workflow_run",
        "using": {
          "foreign_key_constraint_on": "workflow_run_id"
        }
      },
      {
        "name": "workflow_step",
        "using": {
          "foreign_key_constraint_on": "step_id"
        }
      }
    ],
    "insert_permissions": [
      {
        "role": "admin",
        "permission": {
          "check": {},
          "columns": [
            "workflow_run_id",
            "step_id",
            "status",
            "input"
          ]
        }
      }
    ],
    "update_permissions": [
      {
        "role": "admin",
        "permission": {
          "columns": [
            "status",
            "output",
            "error",
            "attempt_count",
            "completed_at",
            "approved_by",
            "approved_at"
          ],
          "filter": {},
          "check": null
        }
      }
    ],
    "event_triggers": [
      {
        "name": "notify_step_trigger",
        "definition": {
          "enable_manual": true,
          "insert": {
            "columns": "*"
          },
          "update": {
            "columns": [
              "status"
            ]
          }
        },
        "retry_conf": {
          "interval_sec": 10,
          "num_retries": 0,
          "timeout_sec": 60
        },
        "webhook": "{{FRONTEND_URL}}/api/notify"
      }
    ]
  },
  {
    "table": {
      "name": "workflow_outputs",
      "schema": "public"
    }
  },
  {
    "table": {
      "name": "workflow_runs",
      "schema": "public"
    },
    "object_relationships": [
      {
        "name": "workflow",
        "using": {
          "foreign_key_constraint_on": "workflow_id"
        }
      }
    ],
    "array_relationships": [
      {
        "name": "step_runs",
        "using": {
          "foreign_key_constraint_on": {
            "column": "workflow_run_id",
            "table": {
              "name": "step_runs",
              "schema": "public"
            }
          }
        }
      }
    ],
    "insert_permissions": [
      {
        "role": "editor",
        "permission": {
          "check": {
            "workflow": {
              "organization": {
                "org_members": {
                  "_and": [
                    {
                      "user_id": {
                        "_eq": "X-Hasura-User-Id"
                      }
                    },
                    {
                      "role": {
                        "_in": [
                          "editor",
                          "owner"
                        ]
                      }
                    }
                  ]
                }
              }
            }
          },
          "columns": [
            "status",
            "workflow_id"
          ]
        }
      },
      {
        "role": "owner",
        "permission": {
          "check": {
            "workflow": {
              "organization": {
                "org_members": {
                  "_and": [
                    {
                      "user_id": {
                        "_eq": "X-Hasura-User-Id"
                      }
                    },
                    {
                      "role": {
                        "_eq": "owner"
                      }
                    }
                  ]
                }
              }
            }
          },
          "columns": [
            "status",
            "workflow_id"
          ]
        }
      }
    ],
    "select_permissions": [
      {
        "role": "editor",
        "permission": {
          "columns": "*",
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "user_id": {
                    "_eq": "X-Hasura-User-Id"
                  }
                }
              }
            }
          }
        }
      },
      {
        "role": "owner",
        "permission": {
          "columns": "*",
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "user_id": {
                    "_eq": "X-Hasura-User-Id"
                  }
                }
              }
            }
          }
        }
      },
      {
        "role": "viewer",
        "permission": {
          "columns": "*",
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "user_id": {
                    "_eq": "X-Hasura-User-Id"
                  }
                }
              }
            }
          }
        }
      }
    ],
    "update_permissions": [
      {
        "role": "editor",
        "permission": {
          "columns": [
            "status"
          ],
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "_and": [
                    {
                      "user_id": {
                        "_eq": "X-Hasura-User-Id"
                      }
                    },
                    {
                      "role": {
                        "_in": [
                          "editor",
                          "owner"
                        ]
                      }
                    }
                  ]
                }
              }
            }
          },
          "check": null
        }
      },
      {
        "role": "owner",
        "permission": {
          "columns": [
            "status"
          ],
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "_and": [
                    {
                      "user_id": {
                        "_eq": "X-Hasura-User-Id"
                      }
                    },
                    {
                      "role": {
                        "_eq": "owner"
                      }
                    }
                  ]
                }
              }
            }
          },
          "check": null
        }
      }
    ],
    "delete_permissions": [
      {
        "role": "owner",
        "permission": {
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "user_id": {
                    "_eq": "X-Hasura-User-Id"
                  }
                }
              }
            }
          }
        }
      }
    ]
  },
  {
    "table": {
      "name": "workflow_steps",
      "schema": "public"
    },
    "object_relationships": [
      {
        "name": "workflow",
        "using": {
          "foreign_key_constraint_on": "workflow_id"
        }
      }
    ],
    "insert_permissions": [
      {
        "role": "editor",
        "permission": {
          "check": {
            "_and": [
              {
                "workflow": {
                  "organization": {
                    "org_members": {
                      "_and": [
                        {
                          "user_id": {
                            "_eq": "X-Hasura-User-Id"
                          }
                        },
                        {
                          "role": {
                            "_in": [
                              "editor",
                              "owner"
                            ]
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                "type": {
                  "_nin": [
                    "db_write",
                    "notify",
                    "webhook"
                  ]
                }
              }
            ]
          },
          "columns": "*"
        }
      },
      {
        "role": "owner",
        "permission": {
          "check": {
            "workflow": {
              "organization": {
                "org_members": {
                  "_and": [
                    {
                      "user_id": {
                        "_eq": "X-Hasura-User-Id"
                      }
                    },
                    {
                      "role": {
                        "_eq": "owner"
                      }
                    }
                  ]
                }
              }
            }
          },
          "columns": "*"
        }
      }
    ],
    "select_permissions": [
      {
        "role": "editor",
        "permission": {
          "columns": "*",
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "user_id": {
                    "_eq": "X-Hasura-User-Id"
                  }
                }
              }
            }
          }
        }
      },
      {
        "role": "owner",
        "permission": {
          "columns": "*",
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "user_id": {
                    "_eq": "X-Hasura-User-Id"
                  }
                }
              }
            }
          }
        }
      },
      {
        "role": "viewer",
        "permission": {
          "columns": "*",
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "user_id": {
                    "_eq": "X-Hasura-User-Id"
                  }
                }
              }
            }
          }
        }
      }
    ],
    "update_permissions": [
      {
        "role": "editor",
        "permission": {
          "columns": [
            "config",
            "order_index"
          ],
          "filter": {
            "_and": [
              {
                "workflow": {
                  "organization": {
                    "org_members": {
                      "_and": [
                        {
                          "user_id": {
                            "_eq": "X-Hasura-User-Id"
                          }
                        },
                        {
                          "role": {
                            "_in": [
                              "editor",
                              "owner"
                            ]
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                "type": {
                  "_nin": [
                    "db_write",
                    "notify",
                    "webhook"
                  ]
                }
              }
            ]
          },
          "check": null
        }
      },
      {
        "role": "owner",
        "permission": {
          "columns": [
            "config",
            "order_index"
          ],
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "_and": [
                    {
                      "user_id": {
                        "_eq": "X-Hasura-User-Id"
                      }
                    },
                    {
                      "role": {
                        "_eq": "owner"
                      }
                    }
                  ]
                }
              }
            }
          },
          "check": null
        }
      }
    ],
    "delete_permissions": [
      {
        "role": "editor",
        "permission": {
          "filter": {
            "_and": [
              {
                "workflow": {
                  "organization": {
                    "org_members": {
                      "_and": [
                        {
                          "user_id": {
                            "_eq": "X-Hasura-User-Id"
                          }
                        },
                        {
                          "role": {
                            "_in": [
                              "editor",
                              "owner"
                            ]
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                "type": {
                  "_nin": [
                    "db_write",
                    "notify",
                    "webhook"
                  ]
                }
              }
            ]
          }
        }
      },
      {
        "role": "owner",
        "permission": {
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "_and": [
                    {
                      "user_id": {
                        "_eq": "X-Hasura-User-Id"
                      }
                    },
                    {
                      "role": {
                        "_eq": "owner"
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    ]
  },
  {
    "table": {
      "name": "workflow_triggers",
      "schema": "public"
    },
    "object_relationships": [
      {
        "name": "workflow",
        "using": {
          "foreign_key_constraint_on": "workflow_id"
        }
      }
    ],
    "insert_permissions": [
      {
        "role": "editor",
        "permission": {
          "check": {
            "_and": [
              {
                "workflow": {
                  "organization": {
                    "org_members": {
                      "_and": [
                        {
                          "user_id": {
                            "_eq": "X-Hasura-User-Id"
                          }
                        },
                        {
                          "role": {
                            "_in": [
                              "editor",
                              "owner"
                            ]
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                "type": {
                  "_neq": "webhook"
                        }
              }
            ]
          },
          "columns": "*"
        }
      },
      {
        "role": "owner",
        "permission": {
          "check": {
            "workflow": {
              "organization": {
                "org_members": {
                  "_and": [
                    {
                      "user_id": {
                        "_eq": "X-Hasura-User-Id"
                      }
                    },
                    {
                      "role": {
                        "_eq": "owner"
                      }
                    }
                  ]
                }
              }
            }
          },
          "columns": "*"
        }
      }
    ],
    "select_permissions": [
      {
        "role": "editor",
        "permission": {
          "columns": "*",
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "user_id": {
                    "_eq": "X-Hasura-User-Id"
                  }
                }
              }
            }
          }
        }
      },
      {
        "role": "owner",
        "permission": {
          "columns": "*",
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "user_id": {
                    "_eq": "X-Hasura-User-Id"
                  }
                }
              }
            }
          }
        }
      },
      {
        "role": "viewer",
        "permission": {
          "columns": "*",
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "user_id": {
                    "_eq": "X-Hasura-User-Id"
                  }
                }
              }
            }
          }
        }
      }
    ],
    "update_permissions": [
      {
        "role": "editor",
        "permission": {
          "columns": [
            "config"
          ],
          "filter": {
            "_and": [
              {
                "workflow": {
                  "organization": {
                    "org_members": {
                      "_and": [
                        {
                          "user_id": {
                            "_eq": "X-Hasura-User-Id"
                          }
                        },
                        {
                          "role": {
                            "_in": [
                              "editor",
                              "owner"
                            ]
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                "type": {
                  "_neq": "webhook"
                }
              }
            ]
          },
          "check": null
        }
      },
      {
        "role": "owner",
        "permission": {
          "columns": [
            "config"
          ],
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "_and": [
                    {
                      "user_id": {
                        "_eq": "X-Hasura-User-Id"
                      }
                    },
                    {
                      "role": {
                        "_eq": "owner"
                      }
                    }
                  ]
                }
              }
            }
          },
          "check": null
        }
      }
    ],
    "delete_permissions": [
      {
        "role": "editor",
        "permission": {
          "filter": {
            "_and": [
              {
                "workflow": {
                  "organization": {
                    "org_members": {
                      "_and": [
                        {
                          "user_id": {
                            "_eq": "X-Hasura-User-Id"
                          }
                        },
                        {
                          "role": {
                            "_in": [
                              "editor",
                              "owner"
                            ]
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                "type": {
                  "_neq": "webhook"
                }
              }
            ]
          }
        }
      },
      {
        "role": "owner",
        "permission": {
          "filter": {
            "workflow": {
              "organization": {
                "org_members": {
                  "_and": [
                    {
                      "user_id": {
                        "_eq": "X-Hasura-User-Id"
                      }
                    },
                    {
                      "role": {
                        "_eq": "owner"
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    ]
  },
  {
    "table": {
      "name": "workflows",
      "schema": "public"
    },
    "object_relationships": [
      {
        "name": "organization",
        "using": {
          "foreign_key_constraint_on": "org_id"
        }
      }
    ],
    "array_relationships": [
      {
        "name": "runs",
        "using": {
          "foreign_key_constraint_on": {
            "column": "workflow_id",
            "table": {
              "name": "workflow_runs",
              "schema": "public"
            }
          }
        }
      },
      {
        "name": "steps",
        "using": {
          "foreign_key_constraint_on": {
            "column": "workflow_id",
            "table": {
              "name": "workflow_steps",
              "schema": "public"
            }
          }
        }
      },
      {
        "name": "triggers",
        "using": {
          "foreign_key_constraint_on": {
            "column": "workflow_id",
            "table": {
              "name": "workflow_triggers",
              "schema": "public"
            }
          }
        }
      }
    ],
    "insert_permissions": [
      {
        "role": "editor",
        "permission": {
          "check": {
            "organization": {
              "org_members": {
                "role": {
                  "_in": [
                    "editor",
                    "owner"
                  ]
                },
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          },
          "columns": [
            "name",
            "description",
            "org_id",
            "status"
          ]
        }
      },
      {
        "role": "owner",
        "permission": {
          "check": {
            "organization": {
              "org_members": {
                "role": {
                  "_eq": "owner"
                },
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          },
          "columns": [
            "name",
            "description",
            "org_id",
            "status"
          ]
        }
      }
    ],
    "select_permissions": [
      {
        "role": "editor",
        "permission": {
          "columns": [
            "id",
            "org_id",
            "name",
            "description",
            "status",
            "created_at",
            "updated_at"
          ],
          "filter": {
            "organization": {
              "org_members": {
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          }
        }
      },
      {
        "role": "owner",
        "permission": {
          "columns": [
            "id",
            "org_id",
            "name",
            "description",
            "status",
            "created_at",
            "updated_at"
          ],
          "filter": {
            "organization": {
              "org_members": {
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          }
        }
      },
      {
        "role": "viewer",
        "permission": {
          "columns": [
            "id",
            "org_id",
            "name",
            "description",
            "status",
            "created_at",
            "updated_at"
          ],
          "filter": {
            "organization": {
              "org_members": {
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          }
        }
      }
    ],
    "update_permissions": [
      {
        "role": "editor",
        "permission": {
          "columns": [
            "name",
            "description",
            "status"
          ],
          "filter": {
            "organization": {
              "org_members": {
                "role": {
                  "_in": [
                    "editor",
                    "owner"
                  ]
                },
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          },
          "check": null
        }
      },
      {
        "role": "owner",
        "permission": {
          "columns": [
            "name",
            "description",
            "status"
          ],
          "filter": {
            "organization": {
              "org_members": {
                "role": {
                  "_eq": "owner"
                },
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          },
          "check": null
        }
      }
    ],
    "delete_permissions": [
      {
        "role": "owner",
        "permission": {
          "filter": {
            "organization": {
              "org_members": {
                "role": {
                  "_eq": "owner"
                },
                "user_id": {
                  "_eq": "X-Hasura-User-Id"
                }
              }
            }
          }
        }
      }
    ]
  }
];

const fetch = require('node-fetch');

async function applyMetadata() {
  const HASURA_URL = process.env.HASURA_URL;
  const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;

  if (!HASURA_URL || !HASURA_ADMIN_SECRET) {
    console.error("Please set HASURA_URL and HASURA_ADMIN_SECRET environment variables.");
    process.exit(1);
  }

  const endpoint = `${HASURA_URL}/v1/metadata`;
  
  console.log("Fetching current Hasura metadata...");
  const fetchRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET
    },
    body: JSON.stringify({
      type: 'export_metadata',
      args: {}
    })
  });

  if (!fetchRes.ok) {
    console.error("Failed to fetch metadata:", await fetchRes.text());
    process.exit(1);
  }

  const metadata = await fetchRes.json();
  
  // Find the 'default' source where tables are defined
  const source = metadata.sources.find(s => s.name === 'default');
  if (!source) {
    console.error("No 'default' data source found in metadata.");
    process.exit(1);
  }

  // Remove existing public tables from the current metadata to avoid duplicates
  const publicTableNames = publicTables.map(t => t.table.name);
  source.tables = source.tables.filter(t => 
    t.table.schema !== 'public' || !publicTableNames.includes(t.table.name)
  );

  // Inject our custom public tables
  source.tables.push(...publicTables);

  console.log("Applying updated metadata with custom public schema configuration...");
  const replaceRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET
    },
    body: JSON.stringify({
      type: 'replace_metadata',
      version: 2,
      args: {
        allow_inconsistent_metadata: true,
        metadata: metadata
      }
    })
  });

  if (!replaceRes.ok) {
    console.error("Failed to replace metadata:", await replaceRes.text());
    process.exit(1);
  }

  console.log("Successfully applied custom metadata! The database is fully configured and ready to use.");
}

applyMetadata().catch(console.error);
