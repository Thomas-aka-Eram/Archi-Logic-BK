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
exports.TagService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../db/drizzle.module");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
function adjustColor(hex, percent) {
    const f = parseInt(hex.slice(1), 16);
    const t = percent < 0 ? 0 : 255;
    const p = percent < 0 ? percent * -1 : percent;
    const R = f >> 16;
    const G = (f >> 8) & 0x00ff;
    const B = f & 0x0000ff;
    return ('#' +
        (0x1000000 +
            (Math.round((t - R) * p) + R) * 0x10000 +
            (Math.round((t - G) * p) + G) * 0x100 +
            (Math.round((t - B) * p) + B))
            .toString(16)
            .slice(1));
}
let TagService = class TagService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getParentLevel(parentId) {
        const parent = await this.db.query.tags.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.tags.id, parentId),
            columns: { level: true },
        });
        return parent?.level ?? 0;
    }
    async getInheritedColor(parentId) {
        const parent = await this.db.query.tags.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.tags.id, parentId),
            columns: { color: true },
        });
        return adjustColor(parent?.color ?? '#cccccc', -0.2);
    }
    async create(createTagDto, userId) {
        const { name, projectId, parentId, color, phase } = createTagDto;
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        const existing = await this.db.query.tags.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tags.projectId, projectId), (0, drizzle_orm_1.eq)(schema_1.tags.slug, slug)),
        });
        if (existing) {
            throw new common_1.ConflictException('A tag with this name already exists for this project.');
        }
        const level = parentId ? (await this.getParentLevel(parentId)) + 1 : 0;
        const inheritedColor = parentId ? await this.getInheritedColor(parentId) : color ?? '#cccccc';
        const [newTag] = await this.db
            .insert(schema_1.tags)
            .values({
            name,
            slug,
            projectId,
            parentId,
            color: inheritedColor,
            level,
            phase,
            createdBy: userId,
        })
            .returning();
        return newTag;
    }
    async findAll(projectId) {
        const allTags = await this.db.select().from(schema_1.tags).where((0, drizzle_orm_1.eq)(schema_1.tags.projectId, projectId));
        const tagMap = new Map(allTags.map(tag => [tag.id, { ...tag, children: [] }]));
        for (const tag of allTags) {
            if (tag.parentId && tagMap.has(tag.parentId)) {
                tagMap.get(tag.parentId).children.push(tag.id);
            }
        }
        return Array.from(tagMap.values());
    }
};
exports.TagService = TagService;
exports.TagService = TagService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(drizzle_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], TagService);
//# sourceMappingURL=tag.service.js.map