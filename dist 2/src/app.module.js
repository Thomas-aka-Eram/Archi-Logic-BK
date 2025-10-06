"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const drizzle_module_1 = require("./db/drizzle.module");
const user_module_1 = require("./user/user.module");
const project_module_1 = require("./project/project.module");
const document_module_1 = require("./document/document.module");
const task_module_1 = require("./task/task.module");
const tag_module_1 = require("./tag/tag.module");
const repository_module_1 = require("./repository/repository.module");
const webhook_module_1 = require("./webhook/webhook.module");
const review_module_1 = require("./review/review.module");
const auth_module_1 = require("./auth/auth.module");
const search_module_1 = require("./search/search.module");
const invitation_module_1 = require("./invitation/invitation.module");
const domain_module_1 = require("./domain/domain.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            drizzle_module_1.DrizzleModule,
            user_module_1.UserModule,
            project_module_1.ProjectModule,
            document_module_1.DocumentModule,
            task_module_1.TaskModule,
            tag_module_1.TagModule,
            repository_module_1.RepositoryModule,
            webhook_module_1.WebhookModule,
            review_module_1.ReviewModule,
            auth_module_1.AuthModule,
            search_module_1.SearchModule,
            invitation_module_1.InvitationModule,
            domain_module_1.DomainModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map