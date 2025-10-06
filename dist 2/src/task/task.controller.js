"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const common_1 = require("@nestjs/common");
const task_service_1 = require("./task.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_task_dto_1 = require("./dto/create-task.dto");
const update_task_dto_1 = require("./dto/update-task.dto");
const add_task_dependency_dto_1 = require("./dto/add-task-dependency.dto");
const assign_users_dto_1 = require("./dto/assign-users.dto");
const get_assignment_suggestions_dto_1 = require("./dto/get-assignment-suggestions.dto");
let TaskController = class TaskController {
    taskService;
    constructor(taskService) {
        this.taskService = taskService;
    }
    async getAssignmentSuggestions(getAssignmentSuggestionsDto) {
        return this.taskService.getAssignmentSuggestions(getAssignmentSuggestionsDto.projectId, getAssignmentSuggestionsDto);
    }
    async createTask(projectId, createTaskDto, req) {
        console.log("Create Task DTO:", createTaskDto);
        const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        return this.taskService.createTask(projectId, createTaskDto, mockUserId);
    }
    async getTasksForProject(projectId) {
        return this.taskService.getTasksForProject(projectId);
    }
    async getTaskById(taskId) {
        return this.taskService.getTaskById(taskId);
    }
    async updateTask(taskId, updateTaskDto, req) {
        const userId = req.user.userId;
        return this.taskService.updateTask(taskId, updateTaskDto, userId);
    }
    async assignMultipleUsers(taskId, assignUsersDto) {
        return this.taskService.assignMultipleUsers(taskId, assignUsersDto.assignments);
    }
    async addTaskDependency(taskId, addTaskDependencyDto) {
        return this.taskService.addTaskDependency(taskId, addTaskDependencyDto);
    }
};
exports.TaskController = TaskController;
__decorate([
    (0, common_1.Post)('suggestions'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_assignment_suggestions_dto_1.GetAssignmentSuggestionsDto]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getAssignmentSuggestions", null);
__decorate([
    (0, common_1.Post)('/project/:projectId'),
    __param(0, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_task_dto_1.CreateTaskDto, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "createTask", null);
__decorate([
    (0, common_1.Get)('/project/:projectId'),
    __param(0, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getTasksForProject", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getTaskById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_task_dto_1.UpdateTaskDto, Object]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "updateTask", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_users_dto_1.AssignUsersDto]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "assignMultipleUsers", null);
__decorate([
    (0, common_1.Post)(':id/dependencies'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_task_dependency_dto_1.AddTaskDependencyDto]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "addTaskDependency", null);
exports.TaskController = TaskController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('tasks'),
    __metadata("design:paramtypes", [task_service_1.TaskService])
], TaskController);
//# sourceMappingURL=task.controller.js.map