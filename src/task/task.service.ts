import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import type { DbType, TransactionType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AddTaskDependencyDto } from './dto/add-task-dependency.dto';
import { GetAssignmentSuggestionsDto } from './dto/get-assignment-suggestions.dto';
import { GetUnassignedTasksDto } from './dto/get-unassigned-tasks.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { and, eq, inArray, sql, notExists, ne, notInArray } from 'drizzle-orm';
import { TaskReviewService } from '../review/task.review.service';

@Injectable()
export class TaskService {
  constructor(
    @Inject(DB) private readonly db: DbType,
    private readonly taskReviewService: TaskReviewService,
  ) {}

  async addFeedback(
    taskId: string,
    userId: string,
    createFeedbackDto: CreateFeedbackDto,
  ) {
    const task = await this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // TODO: Add authorization check to ensure user can add feedback

    const [newFeedback] = await this.db
      .insert(schema.feedback)
      .values({
        taskId,
        userId,
        projectId: task.projectId,
        comments: createFeedbackDto.comments,
      })
      .returning();

    return newFeedback;
  }

  async createTask(
    projectId: string,
    createTaskDto: CreateTaskDto,
    userId: string,
  ) {
    // Authorization check: Only Admin and Manager can create tasks
    const projectMembership = await this.db.query.projectUserRoles.findFirst({
      where: and(
        eq(schema.projectUserRoles.userId, userId),
        eq(schema.projectUserRoles.projectId, projectId),
      ),
      with: {
        role: true,
      },
    });

    if (
      !projectMembership ||
      !projectMembership.role ||
      !['Admin', 'Manager'].includes(projectMembership.role.name)
    ) {
      throw new ForbiddenException(
        'You do not have permission to create tasks in this project.',
      );
    }

    console.log('Create Task DTO in service:', createTaskDto);
    const {
      title,
      description,
      tags,
      estimateHours,
      dueDate,
      assignees,
      dependencies,
      priority,
      domainId,
      phaseId,
    } = createTaskDto;

    return await this.db.transaction(async (tx) => {
      const [createdTask] = await tx
        .insert(schema.tasks)
        .values({
          projectId,
          title,
          description,
          estimateHours,
          dueDate: dueDate ? new Date(dueDate) : null,
          priority,
          domainId,
          phaseId,
        })
        .returning();

      if (tags && tags.length > 0) {
        await this._handleTaskTags(tx, createdTask.id, tags);
      }

      if (assignees && assignees.length > 0) {
        await this.assignMultipleUsers(
          createdTask.id,
          assignees.map((a) => ({ userId: a.userId, role: a.role })),
          tx,
        );
      }

      if (dependencies && dependencies.length > 0) {
        await this.validateCircularDependencies(
          createdTask.id,
          dependencies,
          tx,
        );
        const dependencyValues = dependencies.map((depId) => ({
          taskId: createdTask.id,
          dependsOnTaskId: depId,
        }));
        await tx.insert(schema.taskDependencies).values(dependencyValues);
      }

      return await tx.query.tasks.findFirst({
        where: eq(schema.tasks.id, createdTask.id),
        with: {
          assignees: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          tags: {
            with: {
              tag: true,
            },
          },
        },
      });
    });
  }

  async getUnassignedTasks(projectId: string, filters: GetUnassignedTasksDto) {
    const { phaseId, priority, tagIds } = filters;

    const assignedTaskIds = this.db
      .select({ id: schema.userTasks.taskId })
      .from(schema.userTasks);

    const whereClauses = [
      eq(schema.tasks.projectId, projectId),
      ne(schema.tasks.status, 'COMPLETED'),
      notInArray(schema.tasks.id, assignedTaskIds),
    ];

    if (phaseId) {
      whereClauses.push(eq(schema.tasks.phaseId, phaseId));
    }
    if (priority) {
      whereClauses.push(eq(schema.tasks.priority, priority));
    }
    if (tagIds && tagIds.length > 0) {
      const tasksWithTags = this.db
        .select({ taskId: schema.taskTags.taskId })
        .from(schema.taskTags)
        .where(inArray(schema.taskTags.tagId, tagIds));
      whereClauses.push(inArray(schema.tasks.id, tasksWithTags));
    }

    const unassignedTasks = await this.db.query.tasks.findMany({
      where: and(...whereClauses),
      with: {
        tags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: (task, { desc }) => [desc(task.createdAt)],
    });
    return unassignedTasks;
  }

  async getTasksForProject(projectId: string) {
    return await this.db.query.tasks.findMany({
      where: eq(schema.tasks.projectId, projectId),
      with: {
        assignees: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true, // Be mindful of exposing emails
              },
            },
          },
        },
        tags: {
          with: {
            tag: true,
          },
        },
        feedback: true,
      },
      orderBy: (task, { desc }) => [desc(task.createdAt)],
    });
  }

  async getTaskById(taskId: string) {
    const task = await this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
      with: {
        assignees: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tags: {
          with: {
            tag: true,
          },
        },
        domain: true,
        phase: true,
        feedback: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async updateTask(
    taskId: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ) {
    const { dueDate, assignees, assigneeId, ...rest } = updateTaskDto;

    // TODO: Implement proper role-based access control for task updates
    const task = await this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.db.transaction(async (tx) => {
      if (updateTaskDto.status === 'COMPLETED') {
        await tx
          .update(schema.tasks)
          .set({ status: 'IN_REVIEW', updatedAt: new Date() })
          .where(eq(schema.tasks.id, taskId));

        const existingReview = await tx.query.taskReviews.findFirst({
          where: and(
            eq(schema.taskReviews.taskId, taskId),
            eq(schema.taskReviews.status, 'CHANGES_REQUESTED'),
          ),
        });

        if (existingReview) {
          await tx
            .update(schema.taskReviews)
            .set({ status: 'PENDING', respondedAt: null })
            .where(eq(schema.taskReviews.id, existingReview.id));
        } else {
          await tx.insert(schema.taskReviews).values({
            taskId,
            requesterId: userId,
          });
        }
      } else if (Object.keys(rest).length > 0 || dueDate) {
        await tx
          .update(schema.tasks)
          .set({
            ...rest,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            updatedAt: new Date(),
          })
          .where(eq(schema.tasks.id, taskId));
      }

      if (assigneeId) {
        await tx
          .delete(schema.userTasks)
          .where(eq(schema.userTasks.taskId, taskId));
        await this.assignMultipleUsers(
          taskId,
          [{ userId: assigneeId, role: 'developer' }],
          tx,
        );
      } else if (assignees) {
        await tx
          .delete(schema.userTasks)
          .where(eq(schema.userTasks.taskId, taskId));
        if (assignees.length > 0) {
          await this.assignMultipleUsers(taskId, assignees, tx);
        }
      }

      return await tx.query.tasks.findFirst({
        where: eq(schema.tasks.id, taskId),
        with: {
          assignees: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          tags: {
            with: {
              tag: true,
            },
          },
        },
      });
    });
  }

  async addTaskDependency(
    taskId: string,
    addTaskDependencyDto: AddTaskDependencyDto,
  ) {
    const { dependsOnTaskId, dependencyType } = addTaskDependencyDto;

    return await this.db.transaction(async (tx) => {
      await this.validateCircularDependencies(taskId, [dependsOnTaskId], tx);

      const [newDependency] = await tx
        .insert(schema.taskDependencies)
        .values({
          taskId,
          dependsOnTaskId,
          dependencyType,
        })
        .returning();

      return newDependency;
    });
  }

  async assignMultipleUsers(
    taskId: string,
    assignments: { userId: string; role: string }[],
    tx: TransactionType | DbType = this.db,
  ) {
    const userTaskValues = assignments.map((a) => ({
      taskId,
      userId: a.userId,
      role: a.role,
    }));
    await tx
      .insert(schema.userTasks)
      .values(userTaskValues)
      .onConflictDoNothing();

    const notificationValues = assignments.map((a) => ({
      userId: a.userId,
      message: `You have been assigned to a task.`,
    }));
    await tx.insert(schema.notifications).values(notificationValues);
  }

  async getRecommendations(taskId: string) {
    console.log(`Fetching recommendations for taskId: ${taskId}`);
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    console.log('Task found:', { id: task.id, domainId: task.domainId });

    const projectId = task.projectId;
    const taskDomainId = task.domainId;

    const developerRole = await this.db.query.roles.findFirst({
      where: eq(schema.roles.name, 'Developer'),
    });

    if (!developerRole) {
      console.log('No "Developer" role found in the database.');
      return [];
    }
    console.log('Developer role ID:', developerRole.id);

    const projectDevelopers = await this.db.query.projectUserRoles.findMany({
      where: and(
        eq(schema.projectUserRoles.projectId, projectId),
        eq(schema.projectUserRoles.roleId, developerRole.id),
      ),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (projectDevelopers.length === 0) {
      console.log('No developers found in this project.');
      return [];
    }
    console.log(
      'Found developers:',
      projectDevelopers.map((p) => p.user.name),
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let suggestions = await Promise.all(
      projectDevelopers.map(async (member) => {
        const userId = member.user.id;
        console.log(`\nCalculating score for user: ${member.user.name} (${userId})`);

        const activeTasks = await this.db
          .select({ count: sql`count(*)` })
          .from(schema.userTasks)
          .leftJoin(schema.tasks, eq(schema.userTasks.taskId, schema.tasks.id))
          .where(
            and(
              eq(schema.userTasks.userId, userId),
              ne(schema.tasks.status, 'COMPLETED'),
            ),
          );
        const activeTaskLoad = Number(activeTasks[0].count);
        console.log(`- Active Task Load: ${activeTaskLoad}`);

        let taskDomainMatch = 0;
        if (taskDomainId) {
          const recentDomainTasks = await this.db
            .select({ count: sql`count(*)` })
            .from(schema.tasks)
            .leftJoin(
              schema.userTasks,
              eq(schema.tasks.id, schema.userTasks.taskId),
            )
            .where(
              and(
                eq(schema.userTasks.userId, userId),
                eq(schema.tasks.domainId, taskDomainId),
                sql`(${schema.tasks.createdAt} > ${thirtyDaysAgo})`,
              ),
            );
          taskDomainMatch = Number(recentDomainTasks[0].count) > 0 ? 1 : 0;
        }
        console.log(`- Task Domain Match: ${taskDomainMatch}`);

        const recentCommits = await this.db
          .select({ count: sql`count(*)` })
          .from(schema.commits)
          .where(
            and(
              eq(schema.commits.projectId, projectId),
              eq(schema.commits.authorEmail, member.user.email!),
              sql`(${schema.commits.committedAt} > ${thirtyDaysAgo})`,
            ),
          );
        const recentCommitActivity = Number(recentCommits[0].count);
        console.log(`- Recent Commit Activity: ${recentCommitActivity}`);

        const recentReviews = await this.db
          .select({ count: sql`count(*)` })
          .from(schema.reviewRequests)
          .where(
            and(
              eq(schema.reviewRequests.reviewerId, userId),
              sql`(${schema.reviewRequests.createdAt} > ${thirtyDaysAgo})`,
            ),
          );
        const recentReviewActivity = Number(recentReviews[0].count);
        console.log(`- Recent Review Activity: ${recentReviewActivity}`);

        const score =
          taskDomainMatch * 2 +
          recentCommitActivity * 1.5 +
          recentReviewActivity * 1 -
          activeTaskLoad * 2;
        console.log(`-> Final Score (raw): ${score}`);

        return {
          id: member.user.id,
          name: member.user.name,
          score: score,
          reasons: [
            `${activeTaskLoad} active tasks`,
            `${recentCommitActivity} recent commits`,
            `${recentReviewActivity} recent reviews`,
            taskDomainMatch > 0
              ? 'Familiar with this domain'
              : 'New to this domain',
          ],
        };
      }),
    );

    const maxScore = Math.max(...suggestions.map((s) => s.score), 0);
    console.log('\nMax raw score:', maxScore);

    // If all scores are 0 (or less), it's a cold start. Present all developers equally.
    if (maxScore <= 0) {
      console.log('Cold start detected. Presenting all developers equally.');
      return projectDevelopers.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        score: 50, // Neutral score
        skillMatch: 50,
        workload: 0,
        velocity: 50,
        reasons: ['New project or team member', 'Ready for new tasks'],
      }));
    }

    // Normalize scores to a 0-100 range for the frontend
    const finalSuggestions = suggestions.map((s) => ({
      ...s,
      score: Math.max(0, Math.round((s.score / maxScore) * 100)),
      skillMatch: Math.min(100, Math.round(s.reasons[1].length * 5)), // Mock breakdown
      workload: Math.min(100, Math.round(s.reasons[0].length * 20)), // Mock breakdown
      velocity: Math.min(100, Math.round(s.reasons[2].length * 10)), // Mock breakdown
    }));

    console.log('Final suggestions:', finalSuggestions);
    return finalSuggestions.sort((a, b) => b.score - a.score);
  }

  private async _handleTaskTags(
    tx: TransactionType,
    taskId: string,
    tagIds: string[],
  ) {
    const ancestorTags = await tx.query.tagClosure.findMany({
      where: inArray(schema.tagClosure.descendantId, tagIds),
    });
    const allTagIds = new Set(ancestorTags.map((t) => t.ancestorId));
    tagIds.forEach((id) => allTagIds.add(id));
    const tagValues = Array.from(allTagIds).map((tagId) => ({
      taskId,
      tagId,
    }));
    if (tagValues.length > 0) {
      await tx.insert(schema.taskTags).values(tagValues).onConflictDoNothing();
    }
  }

  async linkCommit(taskId: string, commitId: string) {
    await this.db
      .insert(schema.taskCommits)
      .values({ taskId, commitId })
      .onConflictDoNothing();
  }

  private async validateCircularDependencies(
    newTaskId: string,
    dependsOnIds: string[],
    tx: TransactionType,
  ) {
    const allDependencies = new Set<string>(dependsOnIds);
    const toCheck = [...dependsOnIds];
    while (toCheck.length > 0) {
      const currentId = toCheck.pop();
      if (currentId === newTaskId) {
        throw new BadRequestException('Circular dependency detected.');
      }
      const parentDeps = await tx.query.taskDependencies.findMany({
        where: eq(schema.taskDependencies.taskId, currentId!),
      });
      for (const dep of parentDeps) {
        if (!allDependencies.has(dep.dependsOnTaskId)) {
          allDependencies.add(dep.dependsOnTaskId);
          toCheck.push(dep.dependsOnTaskId);
        }
      }
    }
  }
}
