import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { DbType, TransactionType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AddTaskDependencyDto } from './dto/add-task-dependency.dto';
import { GetAssignmentSuggestionsDto } from './dto/get-assignment-suggestions.dto';
import { and, eq, inArray, sql } from 'drizzle-orm';

@Injectable()
export class TaskService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async createTask(
    projectId: string,
    createTaskDto: CreateTaskDto,
    userId: string,
  ) {
    const {
      title,
      description,
      tags,
      estimateHours,
      dueDate,
      assignees,
      dependencies,
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
      });
    });
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

  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto) {
    const { dueDate, ...rest } = updateTaskDto;
    const [updatedTask] = await this.db
      .update(schema.tasks)
      .set({
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(schema.tasks.id, taskId))
      .returning();

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }
    return updatedTask;
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

  async getAssignmentSuggestions(
    projectId: string,
    dto: GetAssignmentSuggestionsDto,
  ) {
    const { tagIds } = dto;

    const projectMembers = await this.db.query.userProjects.findMany({
      where: eq(schema.userProjects.projectId, projectId),
      with: {
        user: true,
      },
    });

    const suggestions = await Promise.all(
      projectMembers.map(async (member) => {
        const userSkills = await this.db.query.userSkills.findMany({
          where: eq(schema.userSkills.userId, member.userId),
        });
        const skillTagIds = userSkills.map((s) => s.tagId);

        const matchingSkills = skillTagIds.filter((skillId) =>
          tagIds.includes(skillId),
        ).length;
        const skillMatchScore =
          tagIds.length > 0 ? matchingSkills / tagIds.length : 0;

        // In a real app, you would calculate capacity and reliability
        const capacityScore = Math.random();
        const reliabilityScore = Math.random();

        const finalScore =
          skillMatchScore * 0.6 +
          capacityScore * 0.25 +
          reliabilityScore * 0.15;

        return {
          user: member.user,
          score: finalScore,
          details: {
            skillMatch: `${matchingSkills}/${tagIds.length}`,
            availability: `${Math.round(capacityScore * 100)}%`,
            reliability: `${Math.round(reliabilityScore * 100)}%`,
          },
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
