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
exports.GithubSignatureGuard = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const drizzle_module_1 = require("../db/drizzle.module");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
let GithubSignatureGuard = class GithubSignatureGuard {
    db;
    constructor(db) {
        this.db = db;
    }
    canActivate(context) {
        const request = context
            .switchToHttp()
            .getRequest();
        const signature = request.headers['x-hub-signature-256'];
        if (!signature) {
            return false;
        }
        const rawBody = request.rawBody;
        if (!rawBody) {
            return false;
        }
        const repoName = JSON.parse(rawBody.toString()).repository.full_name;
        return this.validateSignature(repoName, signature, rawBody);
    }
    async validateSignature(repoName, signature, rawBody) {
        const repo = await this.db.query.repositories.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.repositories.name, repoName),
        });
        if (!repo || !repo.webhookSecret) {
            return false;
        }
        const hmac = crypto.createHmac('sha256', repo.webhookSecret);
        const digest = 'sha256=' + hmac.update(rawBody).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    }
};
exports.GithubSignatureGuard = GithubSignatureGuard;
exports.GithubSignatureGuard = GithubSignatureGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(drizzle_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], GithubSignatureGuard);
//# sourceMappingURL=github-signature.guard.js.map