import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  unique,
  customType,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

/**
 * ===========================
 * CORE: Users & Projects
 * ===========================
 */

// Users: system-level accounts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 150 }),
  // store hashed password (or empty when using SSO)
  passwordHash: text('password_hash'),
  role: varchar('role', { length: 50 }).default('Developer'), // global role
  createdAt: timestamp('created_at').defaultNow(),
});

// Projects: core container
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isDeleted: boolean('is_deleted').default(false), // soft-delete flag
  deletedAt: timestamp('deleted_at'),
});

/**
 * user_projects: membership / project-scoped roles & permissions
 * - permissions stored as text[] for flexibility (e.g. ['CRUD_DOCS','ASSIGN_TASKS'])
 */
export const userProjects = pgTable(
  'user_projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    role: varchar('role', { length: 50 }).default('Developer'), // project-level role
    permissions: text('permissions').array(), // e.g. ['CRUD_DOCS','MANAGE_TAGS']
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqueUserProject: unique('unique_user_project').on(t.userId, t.projectId),
    projectIdx: index('user_projects_project_idx').on(t.projectId),
  }),
);

/**
 * ===========================
 * SDLC: Project Phases & Domains
 * ===========================
 *
 * project_phases: configures which phases are active for a project and ordering
 */
export const projectPhases = pgTable(
  'project_phases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    key: varchar('key', { length: 50 }).notNull(), // internal key e.g. REQUIREMENTS
    title: varchar('title', { length: 150 }).notNull(), // display title
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniquePhasePerProject: unique('unique_project_phase').on(
      t.projectId,
      t.key,
    ),
    projectPhaseIdx: index('project_phases_project_idx').on(t.projectId),
  }),
);

/**
 * domains: document-level domains (Frontend, Backend, Database, etc.)
 * - documents will reference a primary domain (optional)
 * - block-level domains supported via block_domains join table
 */
export const domains = pgTable(
  'domains',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    key: varchar('key', { length: 50 }).notNull(), // e.g. FRONTEND
    title: varchar('title', { length: 120 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqueDomainPerProject: unique('unique_domain_per_project').on(
      t.projectId,
      t.key,
    ),
    domainProjectIdx: index('domains_project_idx').on(t.projectId),
  }),
);

/**
 * ===========================
 * DOCUMENTS & BLOCKS (notebook-style)
 * ===========================
 *
 * Documents: container object that belongs to a project and a phase.
 * - documents can optionally have a primary domain (documents.domainId).
 * - blocks: versioned pieces inside documents; stored as rows representing versions.
 * - blockGroupId: stable identifier for logical block across versions (allows identifying a block across edits).
 *
 * Searching: blocks_search_vector is a text placeholder; you should add a tsvector + GIN index
 * via a migration for production full-text search.
 */

// Documents
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 250 }).notNull(),
  // phaseId: reference to project_phases to group by SDLC phase (required for UI)
  phaseId: uuid('phase_id').references(() => projectPhases.id),
  // optional primary domain for the document (recommended for common-case filters)
  domainId: uuid('domain_id').references(() => domains.id),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
});

// Blocks: each row is a version of a logical block
export const blocks = pgTable(
  'blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(), // row id (version id)
    blockGroupId: uuid('block_group_id').notNull().defaultRandom(), // stable logical block identifier (same across versions)
    documentId: uuid('document_id')
      .references(() => documents.id, { onDelete: 'cascade' })
      .notNull(),
    type: varchar('type', { length: 50 }).notNull(), // markdown, code, table, image, etc.
    content: text('content').notNull(), // markdown/source content
    renderedHtml: text('rendered_html'), // optional cache of rendered markdown/HTML
    status: varchar('status', { length: 50 }).default('DRAFT'), // DRAFT | PENDING_REVIEW | APPROVED | REJECTED
    version: integer('version').default(1).notNull(), // incremented on each edit
    parentVersionId: uuid('parent_version_id').references((): any => blocks.id), // previous version id
    isCurrentVersion: boolean('is_current_version').default(true), // only one current per blockGroupId
    // simple search text column - create tsvector+GIN index in migration for production
    blocksSearchVector: tsvector('blocks_search_vector'),
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    // frequently query current version per document
    docCurrentIdx: index('blocks_document_current_idx').on(
      t.documentId,
      t.isCurrentVersion,
    ),
    blockGroupIdx: index('blocks_block_group_idx').on(
      t.blockGroupId,
      t.isCurrentVersion,
    ),
    searchIdx: index('blocks_search_idx').using('gin', t.blocksSearchVector),
  }),
);

/**
 * block_domains: optional per-block domain tags (override or additional domains)
 * - store only when block-specific domains are required
 */
export const blockDomains = pgTable(
  'block_domains',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockId: uuid('block_id')
      .references(() => blocks.id, { onDelete: 'cascade' })
      .notNull(),
    domainId: uuid('domain_id')
      .references(() => domains.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => ({
    uniqueBlockDomain: unique('unique_block_domain').on(t.blockId, t.domainId),
    blockDomainIdx: index('block_domains_block_idx').on(t.blockId),
  }),
);

/**
 * ===========================
 * TAGS: hierarchical tag registry + closure table
 * ===========================
 *
 * tags: project-scoped tags, slug uniqueness per project
 * tag_closure: transitive closure for fast ancestor/descendant queries
 * - depth=0 is self, depth=1 is direct parent, etc.
 * - maintain closure rows when inserting/updating tags (app-side or DB trigger).
 */

// Tags registry
export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 150 }).notNull(), // e.g. authentication/login
    parentId: uuid('parent_id').references((): any => tags.id),
    level: integer('level').default(1), // depth level (1..5) - enforce in app layer
    color: varchar('color', { length: 7 }), // hex for UI
    description: text('description'),
    usageCount: integer('usage_count').default(0),
    isArchived: boolean('is_archived').default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    // unique slug per project (prevents duplicates)
    projectSlugIdx: unique('tags_project_slug_unique').on(t.projectId, t.slug),
    tagProjectIdx: index('tags_project_idx').on(t.projectId),
  }),
);

// Tag closure / transitive relationships - speeds up ancestor/desc queries
export const tagClosure = pgTable(
  'tag_closure',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ancestorId: uuid('ancestor_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    descendantId: uuid('descendant_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    depth: integer('depth').notNull(), // 0 = self, 1 = direct parent, etc.
  },
  (t) => ({
    uniqueClosure: unique('unique_tag_closure').on(
      t.ancestorId,
      t.descendantId,
    ),
    ancestorIdx: index('tag_closure_ancestor_idx').on(t.ancestorId),
    descendantIdx: index('tag_closure_descendant_idx').on(t.descendantId),
  }),
);

/**
 * block_tags: many-to-many mapping between blocks (current versions or version rows) and tags
 * - when tagging with a child tag, app should insert ancestor tag mappings too (or you can query closure at read time)
 */
export const blockTags = pgTable(
  'block_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockId: uuid('block_id')
      .references(() => blocks.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqueBlockTag: unique('unique_block_tag').on(t.blockId, t.tagId),
    blockTagIdx: index('block_tags_tag_idx').on(t.tagId),
  }),
);

/**
 * ===========================
 * TASKS & ASSIGNMENTS
 * ===========================
 */

// Tasks
export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 300 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).default('OPEN'), // OPEN, IN_PROGRESS, COMPLETED, BLOCKED
    priority: varchar('priority', { length: 20 }).default('MEDIUM'),
    dueDate: timestamp('due_date'),
    estimateHours: integer('estimate_hours'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    isDeleted: boolean('is_deleted').default(false),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => ({
    projectStatusIdx: index('tasks_project_status_idx').on(
      t.projectId,
      t.status,
    ),
  }),
);

// user_tasks: many-to-many supports multiple assignees/roles per task (Assignee, Reviewer, Watcher)
export const userTasks = pgTable(
  'user_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    taskId: uuid('task_id')
      .references(() => tasks.id, { onDelete: 'cascade' })
      .notNull(),
    role: varchar('role', { length: 50 }).default('Assignee'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqueUserTask: unique('unique_user_task').on(t.userId, t.taskId, t.role),
    userTaskIdx: index('user_tasks_task_idx').on(t.taskId),
  }),
);

// task_dependencies: for Gantt and dependency checks
export const taskDependencies = pgTable(
  'task_dependencies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .references(() => tasks.id, { onDelete: 'cascade' })
      .notNull(),
    dependsOnTaskId: uuid('depends_on_task_id')
      .references(() => tasks.id, { onDelete: 'cascade' })
      .notNull(),
    dependencyType: varchar('dependency_type', { length: 50 }).default(
      'BLOCKS',
    ),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqueDependency: unique('unique_task_dependency').on(
      t.taskId,
      t.dependsOnTaskId,
    ),
    dependencyTaskIdx: index('task_dependencies_task_idx').on(t.taskId),
  }),
);

export const taskTags = pgTable(
  'task_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .references(() => tasks.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqueTaskTag: unique('unique_task_tag').on(t.taskId, t.tagId),
    taskTagIdx: index('task_tags_tag_idx').on(t.tagId),
  }),
);

/**
 * ===========================
 * GIT INTEGRATION: Repositories & Commits
 * ===========================
 */

// repositories: link GitHub repository to project (store webhook secret)
export const repositories = pgTable(
  'repositories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 300 }).notNull(), // e.g. org/repo
    webhookSecret: varchar('webhook_secret', { length: 255 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    projectRepoUnique: unique('project_repo_unique').on(t.projectId, t.name),
    repoProjectIdx: index('repositories_project_idx').on(t.projectId),
  }),
);

// commits: store commit metadata from webhook
export const commits = pgTable(
  'commits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    repoId: uuid('repo_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    commitHash: varchar('commit_hash', { length: 80 }).notNull(),
    message: text('message').notNull(),
    authorName: varchar('author_name', { length: 200 }),
    authorEmail: varchar('author_email', { length: 200 }),
    url: varchar('url', { length: 600 }),
    branch: varchar('branch', { length: 200 }),
    committedAt: timestamp('committed_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    repoCommitIdx: index('commits_repo_commit_idx').on(t.repoId, t.commitHash),
    commitsProjectIdx: index('commits_project_idx').on(t.projectId),
  }),
);

// task_commits: traceability between tasks and commits
export const taskCommits = pgTable(
  'task_commits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .references(() => tasks.id, { onDelete: 'cascade' })
      .notNull(),
    commitId: uuid('commit_id')
      .references(() => commits.id, { onDelete: 'cascade' })
      .notNull(),
    autoLinked: boolean('auto_linked').default(true),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqueTaskCommit: unique('unique_task_commit').on(t.taskId, t.commitId),
    taskCommitIdx: index('task_commits_task_idx').on(t.taskId),
  }),
);

/**
 * ===========================
 * ACTIVITY LOGS, REVIEWS, FEEDBACK
 * ===========================
 */

// activity_logs: audit trail (consider partitioning in production)
export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    projectId: uuid('project_id')
      .references(() => projects.id)
      .notNull(),
    action: varchar('action', { length: 120 }).notNull(), // e.g. CREATE_BLOCK
    entity: varchar('entity', { length: 60 }).notNull(), // TASK, BLOCK, DOCUMENT...
    entityId: uuid('entity_id').notNull(),
    description: text('description'),
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    entityIdx: index('activity_logs_entity_idx').on(t.entity, t.entityId),
    activityUserIdx: index('activity_logs_user_idx').on(t.userId),
  }),
);

// review_requests: simple review workflow linking block to reviewer
export const reviewRequests = pgTable(
  'review_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockId: uuid('block_id')
      .references(() => blocks.id, { onDelete: 'cascade' })
      .notNull(),
    requesterId: uuid('requester_id').references(() => users.id),
    reviewerId: uuid('reviewer_id')
      .references(() => users.id)
      .notNull(),
    status: varchar('status', { length: 30 }).default('PENDING'), // PENDING, APPROVED, CHANGES_REQUESTED
    createdAt: timestamp('created_at').defaultNow(),
    respondedAt: timestamp('responded_at'),
  },
  (t) => ({ reviewBlockIdx: index('review_requests_block_idx').on(t.blockId) }),
);

// feedback (optional)
export const feedback = pgTable(
  'feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    projectId: uuid('project_id')
      .references(() => projects.id)
      .notNull(),
    rating: integer('rating'),
    comments: text('comments'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    feedbackProjectIdx: index('feedback_project_idx').on(t.projectId),
  }),
);

export const userSkills = pgTable('user_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  tagId: uuid('tag_id')
    .references(() => tags.id, { onDelete: 'cascade' })
    .notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * ===========================
 * NOTES / CAUTIONS
 * ===========================
 *
 * 1) Full-text search:
 *    - The `blocks.blocks_search_vector` column is a plain text placeholder.
 *    - For production, create a tsvector column and a GIN index with a SQL migration:
 *
 *      ALTER TABLE blocks ADD COLUMN search_vector tsvector;
 *      UPDATE blocks SET search_vector = to_tsvector('english', coalesce(content,''));
 *      CREATE INDEX blocks_search_gin_idx ON blocks USING GIN(search_vector);
 *      -- Add trigger to keep it updated on insert/update
 *
 * 2) Tag closure maintenance:
 *    - When you CREATE a tag with parentId = P:
 *        a) insert tag row with level = P.level + 1 (validate <= 5).
 *        b) insert closure rows: for every ancestor A of P (including P) insert (A, newTag, depth = depth(A,P)+1).
 *        c) insert (newTag, newTag, depth=0).
 *    - When you reparent or merge tags, perform a careful migration updating closure and block_tags.
 *
 * 3) Block versioning:
 *    - When editing a block:
 *        a) Insert new blocks row with same blockGroupId and version = prevVersion+1.
 *        b) Update previous current row isCurrentVersion=false.
 *        c) Insert/update block_tags / block_domains for the new row (or copy from previous).
 *        d) Do steps a-c inside a transaction to ensure consistency.
 *
 * 4) Soft deletes:
 *    - The schema uses isDeleted flags on key tables. Ensure your application queries always add `isDeleted = false`.
 *    - Foreign keys use ON DELETE CASCADE; avoid calling hard DELETE in normal flows unless you intend to purge permanently.
 *
 * 5) Permissions:
 *    - Use `userProjects.permissions` to enforce CRUD rights on documents/blocks/tasks.
 *    - Map UI actions to specific permission strings (e.g. 'CRUD_DOCS', 'ASSIGN_TASKS').
 *
 * 6) Indexes:
 *    - Additional indexes were added for common queries. Monitor slow queries and add more indexes if needed.
 *
 * 7) Size & closure table growth:
 *    - `tag_closure` grows O(n^2) in extreme cases; with a 5-level max and project scoping this should be acceptable for MVP.
 *
 * 8) Transactions & optimistic locking:
 *    - Use optimistic concurrency for block edits: client supplies expectedVersion; server rejects if mismatch (409) to avoid accidental overwrite.
 */

/**
 * ===========================
 * END OF SCHEMA
 * ===========================
 */

/**
 * ===========================
 * RELATIONS
 * ===========================
 */

// One user can have many projects (through userProjects)
export const usersRelations = relations(users, ({ many }) => ({
  userProjects: many(userProjects),
}));

// One project can have many users (through userProjects) and many phases
export const projectsRelations = relations(projects, ({ many, one }) => ({
  userProjects: many(userProjects),
  phases: many(projectPhases),
  documents: many(documents),
  tags: many(tags),
  tasks: many(tasks),
  repositories: many(repositories),
  createdBy: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
}));

// Junction table relations
export const userProjectsRelations = relations(userProjects, ({ one }) => ({
  user: one(users, {
    fields: [userProjects.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [userProjects.projectId],
    references: [projects.id],
  }),
}));

export const projectPhasesRelations = relations(projectPhases, ({ one }) => ({
  project: one(projects, {
    fields: [projectPhases.projectId],
    references: [projects.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  phase: one(projectPhases, {
    fields: [documents.phaseId],
    references: [projectPhases.id],
  }),
  domain: one(domains, {
    fields: [documents.domainId],
    references: [domains.id],
  }),
  creator: one(users, {
    fields: [documents.createdBy],
    references: [users.id],
  }),
  blocks: many(blocks),
}));

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  document: one(documents, {
    fields: [blocks.documentId],
    references: [documents.id],
  }),
  creator: one(users, {
    fields: [blocks.createdBy],
    references: [users.id],
  }),
  parentVersion: one(blocks, {
    fields: [blocks.parentVersionId],
    references: [blocks.id],
    relationName: 'block_versions',
  }),
  childVersions: many(blocks, {
    relationName: 'block_versions',
  }),
  tags: many(blockTags),
  domains: many(blockDomains),
  reviewRequests: many(reviewRequests),
}));

export const domainsRelations = relations(domains, ({ one }) => ({
  project: one(projects, {
    fields: [domains.projectId],
    references: [projects.id],
  }),
}));

export const blockDomainsRelations = relations(blockDomains, ({ one }) => ({
  block: one(blocks, {
    fields: [blockDomains.blockId],
    references: [blocks.id],
  }),
  domain: one(domains, {
    fields: [blockDomains.domainId],
    references: [domains.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  project: one(projects, {
    fields: [tags.projectId],
    references: [projects.id],
  }),
  parent: one(tags, {
    fields: [tags.parentId],
    references: [tags.id],
    relationName: 'tag_hierarchy',
  }),
  children: many(tags, {
    relationName: 'tag_hierarchy',
  }),
  ancestors: many(tagClosure, { relationName: 'tag_ancestors' }),
  descendants: many(tagClosure, { relationName: 'tag_descendants' }),
}));

export const tagClosureRelations = relations(tagClosure, ({ one }) => ({
  ancestor: one(tags, {
    fields: [tagClosure.ancestorId],
    references: [tags.id],
    relationName: 'tag_ancestors',
  }),
  descendant: one(tags, {
    fields: [tagClosure.descendantId],
    references: [tags.id],
    relationName: 'tag_descendants',
  }),
}));

export const blockTagsRelations = relations(blockTags, ({ one }) => ({
  block: one(blocks, {
    fields: [blockTags.blockId],
    references: [blocks.id],
  }),
  tag: one(tags, {
    fields: [blockTags.tagId],
    references: [tags.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignees: many(userTasks),
  dependencies: many(taskDependencies, { relationName: 'task_dependencies' }),
  dependents: many(taskDependencies, { relationName: 'task_dependents' }),
  tags: many(taskTags),
  commits: many(taskCommits),
}));

export const userTasksRelations = relations(userTasks, ({ one }) => ({
  user: one(users, {
    fields: [userTasks.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [userTasks.taskId],
    references: [tasks.id],
  }),
}));

export const taskDependenciesRelations = relations(
  taskDependencies,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskDependencies.taskId],
      references: [tasks.id],
      relationName: 'task_dependents',
    }),
    dependsOn: one(tasks, {
      fields: [taskDependencies.dependsOnTaskId],
      references: [tasks.id],
      relationName: 'task_dependencies',
    }),
  }),
);

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, {
    fields: [taskTags.taskId],
    references: [tasks.id],
  }),
  tag: one(tags, {
    fields: [taskTags.tagId],
    references: [tags.id],
  }),
}));

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  project: one(projects, {
    fields: [repositories.projectId],
    references: [projects.id],
  }),
  commits: many(commits),
}));

export const commitsRelations = relations(commits, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [commits.repoId],
    references: [repositories.id],
  }),
  project: one(projects, {
    fields: [commits.projectId],
    references: [projects.id],
  }),
  tasks: many(taskCommits),
}));

export const taskCommitsRelations = relations(taskCommits, ({ one }) => ({
  task: one(tasks, {
    fields: [taskCommits.taskId],
    references: [tasks.id],
  }),
  commit: one(commits, {
    fields: [taskCommits.commitId],
    references: [commits.id],
  }),
}));

export const reviewRequestsRelations = relations(reviewRequests, ({ one }) => ({
  block: one(blocks, {
    fields: [reviewRequests.blockId],
    references: [blocks.id],
  }),
  requester: one(users, {
    fields: [reviewRequests.requesterId],
    references: [users.id],
    relationName: 'review_requester',
  }),
  reviewer: one(users, {
    fields: [reviewRequests.reviewerId],
    references: [users.id],
    relationName: 'review_reviewer',
  }),
}));

