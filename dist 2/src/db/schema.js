"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationsRelations = exports.reviewRequestsRelations = exports.taskCommitsRelations = exports.commitsRelations = exports.repositoriesRelations = exports.taskTagsRelations = exports.taskDependenciesRelations = exports.userTasksRelations = exports.tasksRelations = exports.blockTagsRelations = exports.tagClosureRelations = exports.tagsRelations = exports.blockDomainsRelations = exports.domainsRelations = exports.blocksRelations = exports.documentsRelations = exports.projectPhasesRelations = exports.userProjectsRelations = exports.projectsRelations = exports.usersRelations = exports.notifications = exports.userSkills = exports.feedback = exports.reviewRequests = exports.activityLogs = exports.invitations = exports.taskCommits = exports.commits = exports.repositories = exports.taskTags = exports.taskDependencies = exports.userTasks = exports.tasks = exports.blockTags = exports.tagClosure = exports.tags = exports.blockDomains = exports.blocks = exports.documents = exports.domains = exports.projectPhases = exports.userProjects = exports.projects = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const tsvector = (0, pg_core_1.customType)({
    dataType() {
        return 'tsvector';
    },
});
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    name: (0, pg_core_1.varchar)('name', { length: 150 }),
    passwordHash: (0, pg_core_1.text)('password_hash'),
    role: (0, pg_core_1.varchar)('role', { length: 50 }).default('Developer'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.projects = (0, pg_core_1.pgTable)('projects', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    createdBy: (0, pg_core_1.uuid)('created_by')
        .references(() => exports.users.id)
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
    isDeleted: (0, pg_core_1.boolean)('is_deleted').default(false),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
});
exports.userProjects = (0, pg_core_1.pgTable)('user_projects', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .references(() => exports.projects.id, { onDelete: 'cascade' })
        .notNull(),
    role: (0, pg_core_1.varchar)('role', { length: 50 }).default('Developer'),
    permissions: (0, pg_core_1.text)('permissions').array(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    uniqueUserProject: (0, pg_core_1.unique)('unique_user_project').on(t.userId, t.projectId),
    projectIdx: (0, pg_core_1.index)('user_projects_project_idx').on(t.projectId),
}));
exports.projectPhases = (0, pg_core_1.pgTable)('project_phases', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .references(() => exports.projects.id, { onDelete: 'cascade' })
        .notNull(),
    key: (0, pg_core_1.varchar)('key', { length: 50 }).notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 150 }).notNull(),
    sortOrder: (0, pg_core_1.integer)('sort_order').default(0),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    uniquePhasePerProject: (0, pg_core_1.unique)('unique_project_phase').on(t.projectId, t.key),
    projectPhaseIdx: (0, pg_core_1.index)('project_phases_project_idx').on(t.projectId),
}));
exports.domains = (0, pg_core_1.pgTable)('domains', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .references(() => exports.projects.id, { onDelete: 'cascade' })
        .notNull(),
    key: (0, pg_core_1.varchar)('key', { length: 50 }).notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 120 }).notNull(),
    createdBy: (0, pg_core_1.uuid)('created_by')
        .references(() => exports.users.id)
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    uniqueDomainPerProject: (0, pg_core_1.unique)('unique_domain_per_project').on(t.projectId, t.key),
    domainProjectIdx: (0, pg_core_1.index)('domains_project_idx').on(t.projectId),
}));
exports.documents = (0, pg_core_1.pgTable)('documents', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .references(() => exports.projects.id, { onDelete: 'cascade' })
        .notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 250 }).notNull(),
    phaseId: (0, pg_core_1.uuid)('phase_id').references(() => exports.projectPhases.id),
    domainId: (0, pg_core_1.uuid)('domain_id').references(() => exports.domains.id),
    createdBy: (0, pg_core_1.uuid)('created_by')
        .references(() => exports.users.id)
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
    isDeleted: (0, pg_core_1.boolean)('is_deleted').default(false),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
});
exports.blocks = (0, pg_core_1.pgTable)('blocks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    blockGroupId: (0, pg_core_1.uuid)('block_group_id').notNull().defaultRandom(),
    documentId: (0, pg_core_1.uuid)('document_id')
        .references(() => exports.documents.id, { onDelete: 'cascade' })
        .notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(),
    content: (0, pg_core_1.text)('content').notNull(),
    renderedHtml: (0, pg_core_1.text)('rendered_html'),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('DRAFT'),
    version: (0, pg_core_1.integer)('version').default(1).notNull(),
    parentVersionId: (0, pg_core_1.uuid)('parent_version_id').references(() => exports.blocks.id),
    isCurrentVersion: (0, pg_core_1.boolean)('is_current_version').default(true),
    blocksSearchVector: tsvector('blocks_search_vector'),
    createdBy: (0, pg_core_1.uuid)('created_by')
        .references(() => exports.users.id)
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    orderIndex: (0, pg_core_1.integer)('order_index').default(0),
}, (t) => ({
    docCurrentIdx: (0, pg_core_1.index)('blocks_document_current_idx').on(t.documentId, t.isCurrentVersion),
    blockGroupIdx: (0, pg_core_1.index)('blocks_block_group_idx').on(t.blockGroupId, t.isCurrentVersion),
    searchIdx: (0, pg_core_1.index)('blocks_search_idx').using('gin', t.blocksSearchVector),
}));
exports.blockDomains = (0, pg_core_1.pgTable)('block_domains', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    blockId: (0, pg_core_1.uuid)('block_id')
        .references(() => exports.blocks.id, { onDelete: 'cascade' })
        .notNull(),
    domainId: (0, pg_core_1.uuid)('domain_id')
        .references(() => exports.domains.id, { onDelete: 'cascade' })
        .notNull(),
}, (t) => ({
    uniqueBlockDomain: (0, pg_core_1.unique)('unique_block_domain').on(t.blockId, t.domainId),
    blockDomainIdx: (0, pg_core_1.index)('block_domains_block_idx').on(t.blockId),
}));
exports.tags = (0, pg_core_1.pgTable)('tags', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .references(() => exports.projects.id, { onDelete: 'cascade' })
        .notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 120 }).notNull(),
    slug: (0, pg_core_1.varchar)('slug', { length: 150 }).notNull(),
    parentId: (0, pg_core_1.uuid)('parent_id').references(() => exports.tags.id),
    level: (0, pg_core_1.integer)('level').default(1),
    color: (0, pg_core_1.varchar)('color', { length: 7 }),
    phase: (0, pg_core_1.varchar)('phase', { length: 50 }),
    description: (0, pg_core_1.text)('description'),
    usageCount: (0, pg_core_1.integer)('usage_count').default(0),
    isArchived: (0, pg_core_1.boolean)('is_archived').default(false),
    createdBy: (0, pg_core_1.uuid)('created_by')
        .references(() => exports.users.id)
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    projectSlugIdx: (0, pg_core_1.unique)('tags_project_slug_unique').on(t.projectId, t.slug),
    tagProjectIdx: (0, pg_core_1.index)('tags_project_idx').on(t.projectId),
}));
exports.tagClosure = (0, pg_core_1.pgTable)('tag_closure', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    ancestorId: (0, pg_core_1.uuid)('ancestor_id')
        .references(() => exports.tags.id, { onDelete: 'cascade' })
        .notNull(),
    descendantId: (0, pg_core_1.uuid)('descendant_id')
        .references(() => exports.tags.id, { onDelete: 'cascade' })
        .notNull(),
    depth: (0, pg_core_1.integer)('depth').notNull(),
}, (t) => ({
    uniqueClosure: (0, pg_core_1.unique)('unique_tag_closure').on(t.ancestorId, t.descendantId),
    ancestorIdx: (0, pg_core_1.index)('tag_closure_ancestor_idx').on(t.ancestorId),
    descendantIdx: (0, pg_core_1.index)('tag_closure_descendant_idx').on(t.descendantId),
}));
exports.blockTags = (0, pg_core_1.pgTable)('block_tags', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    blockId: (0, pg_core_1.uuid)('block_id')
        .references(() => exports.blocks.id, { onDelete: 'cascade' })
        .notNull(),
    tagId: (0, pg_core_1.uuid)('tag_id')
        .references(() => exports.tags.id, { onDelete: 'cascade' })
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    uniqueBlockTag: (0, pg_core_1.unique)('unique_block_tag').on(t.blockId, t.tagId),
    blockTagIdx: (0, pg_core_1.index)('block_tags_tag_idx').on(t.tagId),
}));
exports.tasks = (0, pg_core_1.pgTable)('tasks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .references(() => exports.projects.id, { onDelete: 'cascade' })
        .notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 300 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('OPEN'),
    priority: (0, pg_core_1.varchar)('priority', { length: 20 }).default('MEDIUM'),
    dueDate: (0, pg_core_1.timestamp)('due_date'),
    estimateHours: (0, pg_core_1.integer)('estimate_hours'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
    isDeleted: (0, pg_core_1.boolean)('is_deleted').default(false),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    projectStatusIdx: (0, pg_core_1.index)('tasks_project_status_idx').on(t.projectId, t.status),
}));
exports.userTasks = (0, pg_core_1.pgTable)('user_tasks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    taskId: (0, pg_core_1.uuid)('task_id')
        .references(() => exports.tasks.id, { onDelete: 'cascade' })
        .notNull(),
    role: (0, pg_core_1.varchar)('role', { length: 50 }).default('Assignee'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    uniqueUserTask: (0, pg_core_1.unique)('unique_user_task').on(t.userId, t.taskId, t.role),
    userTaskIdx: (0, pg_core_1.index)('user_tasks_task_idx').on(t.taskId),
}));
exports.taskDependencies = (0, pg_core_1.pgTable)('task_dependencies', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    taskId: (0, pg_core_1.uuid)('task_id')
        .references(() => exports.tasks.id, { onDelete: 'cascade' })
        .notNull(),
    dependsOnTaskId: (0, pg_core_1.uuid)('depends_on_task_id')
        .references(() => exports.tasks.id, { onDelete: 'cascade' })
        .notNull(),
    dependencyType: (0, pg_core_1.varchar)('dependency_type', { length: 50 }).default('BLOCKS'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    uniqueDependency: (0, pg_core_1.unique)('unique_task_dependency').on(t.taskId, t.dependsOnTaskId),
    dependencyTaskIdx: (0, pg_core_1.index)('task_dependencies_task_idx').on(t.taskId),
}));
exports.taskTags = (0, pg_core_1.pgTable)('task_tags', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    taskId: (0, pg_core_1.uuid)('task_id')
        .references(() => exports.tasks.id, { onDelete: 'cascade' })
        .notNull(),
    tagId: (0, pg_core_1.uuid)('tag_id')
        .references(() => exports.tags.id, { onDelete: 'cascade' })
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    uniqueTaskTag: (0, pg_core_1.unique)('unique_task_tag').on(t.taskId, t.tagId),
    taskTagIdx: (0, pg_core_1.index)('task_tags_tag_idx').on(t.tagId),
}));
exports.repositories = (0, pg_core_1.pgTable)('repositories', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .references(() => exports.projects.id, { onDelete: 'cascade' })
        .notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 300 }).notNull(),
    webhookSecret: (0, pg_core_1.varchar)('webhook_secret', { length: 255 }),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    projectRepoUnique: (0, pg_core_1.unique)('project_repo_unique').on(t.projectId, t.name),
    repoProjectIdx: (0, pg_core_1.index)('repositories_project_idx').on(t.projectId),
}));
exports.commits = (0, pg_core_1.pgTable)('commits', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    repoId: (0, pg_core_1.uuid)('repo_id')
        .references(() => exports.repositories.id, { onDelete: 'cascade' })
        .notNull(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .references(() => exports.projects.id, { onDelete: 'cascade' })
        .notNull(),
    commitHash: (0, pg_core_1.varchar)('commit_hash', { length: 80 }).notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    authorName: (0, pg_core_1.varchar)('author_name', { length: 200 }),
    authorEmail: (0, pg_core_1.varchar)('author_email', { length: 200 }),
    url: (0, pg_core_1.varchar)('url', { length: 600 }),
    branch: (0, pg_core_1.varchar)('branch', { length: 200 }),
    committedAt: (0, pg_core_1.timestamp)('committed_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    repoCommitIdx: (0, pg_core_1.index)('commits_repo_commit_idx').on(t.repoId, t.commitHash),
    commitsProjectIdx: (0, pg_core_1.index)('commits_project_idx').on(t.projectId),
}));
exports.taskCommits = (0, pg_core_1.pgTable)('task_commits', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    taskId: (0, pg_core_1.uuid)('task_id')
        .references(() => exports.tasks.id, { onDelete: 'cascade' })
        .notNull(),
    commitId: (0, pg_core_1.uuid)('commit_id')
        .references(() => exports.commits.id, { onDelete: 'cascade' })
        .notNull(),
    autoLinked: (0, pg_core_1.boolean)('auto_linked').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    uniqueTaskCommit: (0, pg_core_1.unique)('unique_task_commit').on(t.taskId, t.commitId),
    taskCommitIdx: (0, pg_core_1.index)('task_commits_task_idx').on(t.taskId),
}));
exports.invitations = (0, pg_core_1.pgTable)('invitations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .references(() => exports.projects.id, { onDelete: 'cascade' })
        .notNull(),
    codeHash: (0, pg_core_1.text)('code_hash').notNull(),
    createdBy: (0, pg_core_1.uuid)('created_by')
        .references(() => exports.users.id)
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    status: (0, pg_core_1.varchar)('status', {
        length: 20,
        enum: ['active', 'used', 'expired', 'revoked'],
    })
        .default('active')
        .notNull(),
    usedBy: (0, pg_core_1.uuid)('used_by').references(() => exports.users.id),
    usedAt: (0, pg_core_1.timestamp)('used_at'),
    maxUses: (0, pg_core_1.integer)('max_uses').default(1),
    roleOnJoin: (0, pg_core_1.varchar)('role_on_join', { length: 50 }).default('Developer'),
    note: (0, pg_core_1.text)('note'),
}, (t) => ({
    projectStatusIdx: (0, pg_core_1.index)('invitations_project_status_idx').on(t.projectId, t.status),
    expiresAtIdx: (0, pg_core_1.index)('invitations_expires_at_idx').on(t.expiresAt),
}));
exports.activityLogs = (0, pg_core_1.pgTable)('activity_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => exports.users.id)
        .notNull(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .references(() => exports.projects.id)
        .notNull(),
    action: (0, pg_core_1.varchar)('action', { length: 120 }).notNull(),
    entity: (0, pg_core_1.varchar)('entity', { length: 60 }).notNull(),
    entityId: (0, pg_core_1.uuid)('entity_id').notNull(),
    description: (0, pg_core_1.text)('description'),
    oldValues: (0, pg_core_1.jsonb)('old_values'),
    newValues: (0, pg_core_1.jsonb)('new_values'),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }),
    userAgent: (0, pg_core_1.text)('user_agent'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    entityIdx: (0, pg_core_1.index)('activity_logs_entity_idx').on(t.entity, t.entityId),
    activityUserIdx: (0, pg_core_1.index)('activity_logs_user_idx').on(t.userId),
}));
exports.reviewRequests = (0, pg_core_1.pgTable)('review_requests', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    blockId: (0, pg_core_1.uuid)('block_id')
        .references(() => exports.blocks.id, { onDelete: 'cascade' })
        .notNull(),
    requesterId: (0, pg_core_1.uuid)('requester_id').references(() => exports.users.id),
    reviewerId: (0, pg_core_1.uuid)('reviewer_id')
        .references(() => exports.users.id)
        .notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 30 }).default('PENDING'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    respondedAt: (0, pg_core_1.timestamp)('responded_at'),
}, (t) => ({ reviewBlockIdx: (0, pg_core_1.index)('review_requests_block_idx').on(t.blockId) }));
exports.feedback = (0, pg_core_1.pgTable)('feedback', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => exports.users.id)
        .notNull(),
    projectId: (0, pg_core_1.uuid)('project_id')
        .references(() => exports.projects.id)
        .notNull(),
    rating: (0, pg_core_1.integer)('rating'),
    comments: (0, pg_core_1.text)('comments'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    feedbackProjectIdx: (0, pg_core_1.index)('feedback_project_idx').on(t.projectId),
}));
exports.userSkills = (0, pg_core_1.pgTable)('user_skills', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    tagId: (0, pg_core_1.uuid)('tag_id')
        .references(() => exports.tags.id, { onDelete: 'cascade' })
        .notNull(),
});
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    projectId: (0, pg_core_1.uuid)('project_id').references(() => exports.projects.id),
    message: (0, pg_core_1.text)('message').notNull(),
    isRead: (0, pg_core_1.boolean)('is_read').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    userProjects: many(exports.userProjects),
}));
exports.projectsRelations = (0, drizzle_orm_1.relations)(exports.projects, ({ many, one }) => ({
    userProjects: many(exports.userProjects),
    phases: many(exports.projectPhases),
    documents: many(exports.documents),
    tags: many(exports.tags),
    tasks: many(exports.tasks),
    repositories: many(exports.repositories),
    createdBy: one(exports.users, {
        fields: [exports.projects.createdBy],
        references: [exports.users.id],
    }),
}));
exports.userProjectsRelations = (0, drizzle_orm_1.relations)(exports.userProjects, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.userProjects.userId],
        references: [exports.users.id],
    }),
    project: one(exports.projects, {
        fields: [exports.userProjects.projectId],
        references: [exports.projects.id],
    }),
}));
exports.projectPhasesRelations = (0, drizzle_orm_1.relations)(exports.projectPhases, ({ one }) => ({
    project: one(exports.projects, {
        fields: [exports.projectPhases.projectId],
        references: [exports.projects.id],
    }),
}));
exports.documentsRelations = (0, drizzle_orm_1.relations)(exports.documents, ({ one, many }) => ({
    project: one(exports.projects, {
        fields: [exports.documents.projectId],
        references: [exports.projects.id],
    }),
    phase: one(exports.projectPhases, {
        fields: [exports.documents.phaseId],
        references: [exports.projectPhases.id],
    }),
    domain: one(exports.domains, {
        fields: [exports.documents.domainId],
        references: [exports.domains.id],
    }),
    creator: one(exports.users, {
        fields: [exports.documents.createdBy],
        references: [exports.users.id],
    }),
    blocks: many(exports.blocks),
}));
exports.blocksRelations = (0, drizzle_orm_1.relations)(exports.blocks, ({ one, many }) => ({
    document: one(exports.documents, {
        fields: [exports.blocks.documentId],
        references: [exports.documents.id],
    }),
    creator: one(exports.users, {
        fields: [exports.blocks.createdBy],
        references: [exports.users.id],
    }),
    parentVersion: one(exports.blocks, {
        fields: [exports.blocks.parentVersionId],
        references: [exports.blocks.id],
        relationName: 'block_versions',
    }),
    childVersions: many(exports.blocks, {
        relationName: 'block_versions',
    }),
    tags: many(exports.blockTags),
    domains: many(exports.blockDomains),
    reviewRequests: many(exports.reviewRequests),
}));
exports.domainsRelations = (0, drizzle_orm_1.relations)(exports.domains, ({ one }) => ({
    project: one(exports.projects, {
        fields: [exports.domains.projectId],
        references: [exports.projects.id],
    }),
    creator: one(exports.users, {
        fields: [exports.domains.createdBy],
        references: [exports.users.id],
    }),
}));
exports.blockDomainsRelations = (0, drizzle_orm_1.relations)(exports.blockDomains, ({ one }) => ({
    block: one(exports.blocks, {
        fields: [exports.blockDomains.blockId],
        references: [exports.blocks.id],
    }),
    domain: one(exports.domains, {
        fields: [exports.blockDomains.domainId],
        references: [exports.domains.id],
    }),
}));
exports.tagsRelations = (0, drizzle_orm_1.relations)(exports.tags, ({ one, many }) => ({
    project: one(exports.projects, {
        fields: [exports.tags.projectId],
        references: [exports.projects.id],
    }),
    creator: one(exports.users, {
        fields: [exports.tags.createdBy],
        references: [exports.users.id],
    }),
    parent: one(exports.tags, {
        fields: [exports.tags.parentId],
        references: [exports.tags.id],
        relationName: 'tag_hierarchy',
    }),
    children: many(exports.tags, {
        relationName: 'tag_hierarchy',
    }),
    ancestors: many(exports.tagClosure, { relationName: 'tag_ancestors' }),
    descendants: many(exports.tagClosure, { relationName: 'tag_descendants' }),
}));
exports.tagClosureRelations = (0, drizzle_orm_1.relations)(exports.tagClosure, ({ one }) => ({
    ancestor: one(exports.tags, {
        fields: [exports.tagClosure.ancestorId],
        references: [exports.tags.id],
        relationName: 'tag_ancestors',
    }),
    descendant: one(exports.tags, {
        fields: [exports.tagClosure.descendantId],
        references: [exports.tags.id],
        relationName: 'tag_descendants',
    }),
}));
exports.blockTagsRelations = (0, drizzle_orm_1.relations)(exports.blockTags, ({ one }) => ({
    block: one(exports.blocks, {
        fields: [exports.blockTags.blockId],
        references: [exports.blocks.id],
    }),
    tag: one(exports.tags, {
        fields: [exports.blockTags.tagId],
        references: [exports.tags.id],
    }),
}));
exports.tasksRelations = (0, drizzle_orm_1.relations)(exports.tasks, ({ one, many }) => ({
    project: one(exports.projects, {
        fields: [exports.tasks.projectId],
        references: [exports.projects.id],
    }),
    assignees: many(exports.userTasks),
    dependencies: many(exports.taskDependencies, { relationName: 'task_dependencies' }),
    dependents: many(exports.taskDependencies, { relationName: 'task_dependents' }),
    tags: many(exports.taskTags),
    commits: many(exports.taskCommits),
}));
exports.userTasksRelations = (0, drizzle_orm_1.relations)(exports.userTasks, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.userTasks.userId],
        references: [exports.users.id],
    }),
    task: one(exports.tasks, {
        fields: [exports.userTasks.taskId],
        references: [exports.tasks.id],
    }),
}));
exports.taskDependenciesRelations = (0, drizzle_orm_1.relations)(exports.taskDependencies, ({ one }) => ({
    task: one(exports.tasks, {
        fields: [exports.taskDependencies.taskId],
        references: [exports.tasks.id],
        relationName: 'task_dependents',
    }),
    dependsOn: one(exports.tasks, {
        fields: [exports.taskDependencies.dependsOnTaskId],
        references: [exports.tasks.id],
        relationName: 'task_dependencies',
    }),
}));
exports.taskTagsRelations = (0, drizzle_orm_1.relations)(exports.taskTags, ({ one }) => ({
    task: one(exports.tasks, {
        fields: [exports.taskTags.taskId],
        references: [exports.tasks.id],
    }),
    tag: one(exports.tags, {
        fields: [exports.taskTags.tagId],
        references: [exports.tags.id],
    }),
}));
exports.repositoriesRelations = (0, drizzle_orm_1.relations)(exports.repositories, ({ one, many }) => ({
    project: one(exports.projects, {
        fields: [exports.repositories.projectId],
        references: [exports.projects.id],
    }),
    commits: many(exports.commits),
}));
exports.commitsRelations = (0, drizzle_orm_1.relations)(exports.commits, ({ one, many }) => ({
    repository: one(exports.repositories, {
        fields: [exports.commits.repoId],
        references: [exports.repositories.id],
    }),
    project: one(exports.projects, {
        fields: [exports.commits.projectId],
        references: [exports.projects.id],
    }),
    tasks: many(exports.taskCommits),
}));
exports.taskCommitsRelations = (0, drizzle_orm_1.relations)(exports.taskCommits, ({ one }) => ({
    task: one(exports.tasks, {
        fields: [exports.taskCommits.taskId],
        references: [exports.tasks.id],
    }),
    commit: one(exports.commits, {
        fields: [exports.taskCommits.commitId],
        references: [exports.commits.id],
    }),
}));
exports.reviewRequestsRelations = (0, drizzle_orm_1.relations)(exports.reviewRequests, ({ one }) => ({
    block: one(exports.blocks, {
        fields: [exports.reviewRequests.blockId],
        references: [exports.blocks.id],
    }),
    requester: one(exports.users, {
        fields: [exports.reviewRequests.requesterId],
        references: [exports.users.id],
        relationName: 'review_requester',
    }),
    reviewer: one(exports.users, {
        fields: [exports.reviewRequests.reviewerId],
        references: [exports.users.id],
        relationName: 'review_reviewer',
    }),
}));
exports.invitationsRelations = (0, drizzle_orm_1.relations)(exports.invitations, ({ one }) => ({
    project: one(exports.projects, {
        fields: [exports.invitations.projectId],
        references: [exports.projects.id],
    }),
    creator: one(exports.users, {
        fields: [exports.invitations.createdBy],
        references: [exports.users.id],
        relationName: 'invitation_creator',
    }),
    usedByUser: one(exports.users, {
        fields: [exports.invitations.usedBy],
        references: [exports.users.id],
        relationName: 'invitation_user',
    }),
}));
//# sourceMappingURL=schema.js.map