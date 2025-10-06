"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../db/drizzle.module");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
let TaskService = class TaskService {
    db;
    constructor(db) {
        this.db = db;
    }
    async createTask(projectId, createTaskDto, userId) {
        console.log("Create Task DTO in service:", createTaskDto);
        const { title, description, tags, estimateHours, dueDate, assignees, dependencies, } = createTaskDto;
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
                await this.assignMultipleUsers(createdTask.id, assignees.map((a) => ({ userId: a.userId, role: a.role })), tx);
            }
            if (dependencies && dependencies.length > 0) {
                await this.validateCircularDependencies(createdTask.id, dependencies, tx);
                const dependencyValues = dependencies.map((depId) => ({
                    taskId: createdTask.id,
                    dependsOnTaskId: depId,
                }));
                await tx.insert(schema.taskDependencies).values(dependencyValues);
            }
            return await tx.query.tasks.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.tasks.id, createdTask.id),
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
    async getTasksForProject(projectId) {
        return await this.db.query.tasks.findMany({
            where: (0, drizzle_orm_1.eq)(schema.tasks.projectId, projectId),
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
            orderBy: (task, { desc }) => [desc(task.createdAt)],
        });
    }
    async getTaskById(taskId) {
        const task = await this.db.query.tasks.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.tasks.id, taskId),
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
            throw new common_1.NotFoundException('Task not found');
        }
        return task;
    }
    async updateTask(taskId, updateTaskDto, userId) {
        const { dueDate, assignees, ...rest } = updateTaskDto;
        console.log(`Checking authorization for taskId: ${taskId}, userId: ${userId}`);
        const isAssignee = await this.db.query.userTasks.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.userTasks.taskId, taskId), (0, drizzle_orm_1.eq)(schema.userTasks.userId, userId)),
        });
        console.log(`Is user ${userId} an assignee of task ${taskId}? ${!!isAssignee}`);
        if (!isAssignee) {
            throw new common_1.UnauthorizedException('User is not authorized to update this task.');
        }
        return this.db.transaction(async (tx) => {
            if (Object.keys(rest).length > 0 || dueDate) {
                const [updatedTask] = await tx
                    .update(schema.tasks)
                    .set({
                    ...rest,
                    dueDate: dueDate ? new Date(dueDate) : undefined,
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema.tasks.id, taskId))
                    .returning();
                if (!updatedTask) {
                    throw new common_1.NotFoundException('Task not found');
                }
            }
            if (assignees) {
                await tx.delete(schema.userTasks).where((0, drizzle_orm_1.eq)(schema.userTasks.taskId, taskId));
                if (assignees.length > 0) {
                    await this.assignMultipleUsers(taskId, assignees, tx);
                }
            }
            return await tx.query.tasks.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.tasks.id, taskId),
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
    async addTaskDependency(taskId, addTaskDependencyDto) {
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
    async assignMultipleUsers(taskId, assignments, tx = this.db) {
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
    async getAssignmentSuggestions(projectId, dto) {
        const { tagIds } = dto;
        const projectMembers = await this.db.query.userProjects.findMany({
            where: (0, drizzle_orm_1.eq)(schema.userProjects.projectId, projectId),
            with: {
                user: true,
            },
        });
        const suggestions = await Promise.all(projectMembers.map(async (member) => {
            const userSkills = await this.db.query.userSkills.findMany({
                where: (0, drizzle_orm_1.eq)(schema.userSkills.userId, member.userId),
            });
            const skillTagIds = userSkills.map((s) => s.tagId);
            const matchingSkills = skillTagIds.filter((skillId) => tagIds.includes(skillId)).length;
            const skillMatchScore = tagIds.length > 0 ? matchingSkills / tagIds.length : 0;
            const capacityScore = Math.random();
            const reliabilityScore = Math.random();
            const finalScore = skillMatchScore * 0.6 +
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
        }));
        return suggestions.sort((a, b) => b.score - a.score);
    }
    async _handleTaskTags(tx, taskId, tagIds) {
        const ancestorTags = await tx.query.tagClosure.findMany({
            where: (0, drizzle_orm_1.inArray)(schema.tagClosure.descendantId, tagIds),
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
    async validateCircularDependencies(newTaskId, dependsOnIds, tx) {
        const allDependencies = new Set(dependsOnIds);
        const toCheck = [...dependsOnIds];
        while (toCheck.length > 0) {
            const currentId = toCheck.pop();
            if (currentId === newTaskId) {
                throw new common_1.BadRequestException('Circular dependency detected.');
            }
            const parentDeps = await tx.query.taskDependencies.findMany({
                where: (0, drizzle_orm_1.eq)(schema.taskDependencies.taskId, currentId),
            });
            for (const dep of parentDeps) {
                if (!allDependencies.has(dep.dependsOnTaskId)) {
                    allDependencies.add(dep.dependsOnTaskId);
                    toCheck.push(dep.dependsOnTaskId);
                }
            }
        }
    }
};
exports.TaskService = TaskService;
exports.TaskService = TaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(drizzle_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], TaskService);
//# sourceMappingURL=task.service.js.map