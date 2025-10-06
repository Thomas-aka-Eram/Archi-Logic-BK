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
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../db/drizzle.module");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
let WebhookService = class WebhookService {
    db;
    constructor(db) {
        this.db = db;
    }
    async processPushEvent(payload) {
        const { ref, commits, repository } = payload;
        const branch = ref.split('/').pop();
        const repoName = repository.full_name;
        const repo = await this.db.query.repositories.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.repositories.name, repoName),
        });
        if (!repo) {
            return;
        }
        const commitValues = commits.map((c) => ({
            repoId: repo.id,
            projectId: repo.projectId,
            commitHash: c.id,
            message: c.message,
            authorName: c.author.name,
            authorEmail: c.author.email,
            url: c.url,
            branch,
            committedAt: new Date(c.timestamp),
        }));
        if (commitValues.length > 0) {
            await this.db
                .insert(schema.commits)
                .values(commitValues)
                .onConflictDoNothing();
        }
        for (const commit of commits) {
            const taskIds = this.parseTaskIdsFromMessage(commit.message);
            if (taskIds.length > 0) {
                const dbCommit = await this.db.query.commits.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema.commits.commitHash, commit.id),
                });
                if (dbCommit) {
                    await this.linkTasksToCommit(taskIds, dbCommit.id);
                }
            }
        }
    }
    parseTaskIdsFromMessage(message) {
        const regex = /TASK-([0-9a-fA-F-]+)/g;
        const matches = message.match(regex);
        if (!matches) {
            return [];
        }
        return matches.map((m) => m.split('-')[1]);
    }
    async linkTasksToCommit(taskIds, commitId) {
        const taskCommitValues = taskIds.map((taskId) => ({
            taskId,
            commitId,
        }));
        if (taskCommitValues.length > 0) {
            await this.db
                .insert(schema.taskCommits)
                .values(taskCommitValues)
                .onConflictDoNothing();
        }
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(drizzle_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map