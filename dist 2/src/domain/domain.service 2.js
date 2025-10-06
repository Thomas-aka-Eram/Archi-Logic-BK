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
exports.DomainService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../db/drizzle.module");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
let DomainService = class DomainService {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(createDomainDto, userId, projectId) {
        const { name } = createDomainDto;
        const key = name.toUpperCase().replace(/\s+/g, '_');
        const [newDomain] = await this.db
            .insert(schema_1.domains)
            .values({
            key,
            title: name,
            projectId,
            createdBy: userId,
        })
            .returning();
        return newDomain;
    }
    async findAll(projectId) {
        return this.db.select().from(schema_1.domains).where((0, drizzle_orm_1.eq)(schema_1.domains.projectId, projectId));
    }
};
exports.DomainService = DomainService;
exports.DomainService = DomainService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(drizzle_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], DomainService);
//# sourceMappingURL=domain.service.js.map