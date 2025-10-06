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
import { and, eq, inArray, sql, notExists, ne, notInArray } from 'drizzle-orm';

@Injectable()
export class TaskService {
  constructor(@Inject(DB) private readonly db: DbType) {}

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

    console.log("Create Task DTO in service:", createTaskDto);
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
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const { dueDate, assignees, assigneeId, ...rest } = updateTaskDto;

    // TODO: Implement proper role-based access control for task updates

    return this.db.transaction(async (tx) => {
      if (Object.keys(rest).length > 0 || dueDate) {
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
        await tx.delete(schema.userTasks).where(eq(schema.userTasks.taskId, taskId));
        await this.assignMultipleUsers(taskId, [{ userId: assigneeId, role: 'developer' }], tx);
      } else if (assignees) {
        await tx.delete(schema.userTasks).where(eq(schema.userTasks.taskId, taskId));
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
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const tagIds = task.tags.map(t => t.tag.id);
    const projectId = task.projectId;

    const projectMembers = await this.db.query.projectUserRoles.findMany({
      where: eq(schema.projectUserRoles.projectId, projectId),
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

    const suggestions = await Promise.all(
      projectMembers.map(async (member) => {
        const userSkills = await this.db.query.userSkills.findMany({
          where: eq(schema.userSkills.userId, member.user.id),
        });
        const skillTagIds = userSkills.map((s) => s.tagId);

        const matchingSkills = skillTagIds.filter((skillId) =>
          tagIds.includes(skillId),
        ).length;
        const skillMatchScore =
          tagIds.length > 0 ? (matchingSkills / tagIds.length) * 100 : 0;

        // In a real app, you would calculate capacity and reliability
        const workload = Math.random() * 100;
        const velocity = Math.random() * 100;

        const finalScore =
          skillMatchScore * 0.6 +
          (100 - workload) * 0.25 + // Use capacity (100 - workload)
          velocity * 0.15;

        return {
          id: member.user.id,
          name: member.user.name,
          score: Math.round(finalScore),
          skillMatch: Math.round(skillMatchScore),
          workload: Math.round(workload),
          velocity: Math.round(velocity),
          reasons: ['Skill match', 'High capacity', 'Good velocity'].slice(0, 1 + Math.floor(Math.random() * 3)), // Mock reasons
        };
      }),
    );

    return suggestions.sort((a, b) => b.score - a.score);
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
