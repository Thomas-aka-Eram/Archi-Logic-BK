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
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../db/drizzle.module");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
let DocumentService = class DocumentService {
    db;
    constructor(db) {
        this.db = db;
    }
    async updateDocument(docId, updateDocumentDto) {
        const { name } = updateDocumentDto;
        const [updatedDocument] = await this.db
            .update(schema.documents)
            .set({ title: name })
            .where((0, drizzle_orm_1.eq)(schema.documents.id, docId))
            .returning();
        if (!updatedDocument) {
            throw new common_1.NotFoundException('Document not found.');
        }
        return updatedDocument;
    }
    async createDocument(projectId, createDocumentDto, userId) {
        const { title, phaseKey, domainId } = createDocumentDto;
        const phase = await this.db.query.projectPhases.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.projectPhases.projectId, projectId), (0, drizzle_orm_1.eq)(schema.projectPhases.key, phaseKey)),
        });
        if (!phase) {
            throw new common_1.NotFoundException(`Phase with key "${phaseKey}" not found in this project.`);
        }
        const [newDocument] = await this.db
            .insert(schema.documents)
            .values({
            projectId,
            title,
            phaseId: phase.id,
            domainId,
            createdBy: userId,
        })
            .returning();
        return newDocument;
    }
    async deleteDocument(docId) {
        await this.db.delete(schema.documents).where((0, drizzle_orm_1.eq)(schema.documents.id, docId));
        return { message: 'Document deleted successfully' };
    }
    async getDocument(docId) {
        const document = await this.db.query.documents.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.documents.id, docId),
        });
        if (!document) {
            throw new common_1.NotFoundException('Document not found.');
        }
        return document;
    }
    async getDocumentsForProject(projectId, phaseKey) {
        let phaseId;
        if (phaseKey) {
            const phase = await this.db.query.projectPhases.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.projectPhases.projectId, projectId), (0, drizzle_orm_1.eq)(schema.projectPhases.key, phaseKey)),
            });
            if (!phase) {
                return [];
            }
            phaseId = phase.id;
        }
        const documents = await this.db.query.documents.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.documents.projectId, projectId), phaseId ? (0, drizzle_orm_1.eq)(schema.documents.phaseId, phaseId) : undefined),
            orderBy: (doc, { desc }) => [desc(doc.createdAt)],
        });
        return documents;
    }
    async getDocumentBlocks(documentId, currentOnly) {
        const blocks = await this.db.query.blocks.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.blocks.documentId, documentId), currentOnly ? (0, drizzle_orm_1.eq)(schema.blocks.isCurrentVersion, true) : undefined),
            orderBy: (block, { asc }) => [asc(block.orderIndex)],
            with: {
                tags: {
                    with: {
                        tag: true,
                    },
                },
                domains: {
                    with: {
                        domain: true,
                    },
                },
            },
        });
        return blocks;
    }
    async addBlock(documentId, addBlockDto, userId) {
        const { type, content, tags, domains } = addBlockDto;
        const newBlock = await this.db.transaction(async (tx) => {
            const [lastBlock] = await tx
                .select()
                .from(schema.blocks)
                .where((0, drizzle_orm_1.eq)(schema.blocks.documentId, documentId))
                .orderBy((0, drizzle_orm_1.desc)(schema.blocks.orderIndex))
                .limit(1);
            const newOrderIndex = (lastBlock?.orderIndex ?? -1) + 1;
            const [insertedBlock] = await tx
                .insert(schema.blocks)
                .values({
                documentId,
                type,
                content,
                createdBy: userId,
                version: 1,
                isCurrentVersion: true,
                orderIndex: newOrderIndex,
            })
                .returning();
            if (tags && tags.length > 0) {
                await this._handleBlockTags(tx, insertedBlock.id, tags);
            }
            if (domains && domains.length > 0) {
                await this._handleBlockDomains(tx, insertedBlock.id, domains);
            }
            const newBlock = await tx.query.blocks.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.blocks.id, insertedBlock.id),
                with: {
                    tags: {
                        with: {
                            tag: true,
                        },
                    },
                    domains: {
                        with: {
                            domain: true,
                        },
                    },
                },
            });
            return newBlock;
        });
        return newBlock;
    }
    async updateBlock(blockGroupId, updateBlockDto, userId) {
        const { content, expectedVersion, tags, domains } = updateBlockDto;
        const updatedBlock = await this.db.transaction(async (tx) => {
            const [currentRow] = await tx
                .select()
                .from(schema.blocks)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.blocks.blockGroupId, blockGroupId), (0, drizzle_orm_1.eq)(schema.blocks.isCurrentVersion, true)))
                .for('update');
            if (!currentRow) {
                throw new common_1.NotFoundException('Block not found or no current version.');
            }
            if (expectedVersion && expectedVersion !== currentRow.version) {
                throw new common_1.ConflictException(`Expected version ${expectedVersion} but found ${currentRow.version}.`);
            }
            await tx
                .update(schema.blocks)
                .set({ isCurrentVersion: false })
                .where((0, drizzle_orm_1.eq)(schema.blocks.id, currentRow.id));
            const [newVersion] = await tx
                .insert(schema.blocks)
                .values({
                blockGroupId: blockGroupId,
                documentId: currentRow.documentId,
                type: currentRow.type,
                content: content,
                status: currentRow.status,
                version: currentRow.version + 1,
                parentVersionId: currentRow.id,
                isCurrentVersion: true,
                createdBy: userId,
                orderIndex: currentRow.orderIndex,
            })
                .returning();
            const tagsToSet = tags ?? (await this._getPreviousTags(tx, currentRow.id));
            if (tagsToSet.length > 0) {
                await this._handleBlockTags(tx, newVersion.id, tagsToSet);
            }
            const domainsToSet = domains ?? (await this._getPreviousDomains(tx, currentRow.id));
            if (domainsToSet.length > 0) {
                await this._handleBlockDomains(tx, newVersion.id, domainsToSet);
            }
            const updatedBlock = await tx.query.blocks.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.blocks.id, newVersion.id),
                with: {
                    tags: {
                        with: {
                            tag: true,
                        },
                    },
                    domains: {
                        with: {
                            domain: true,
                        },
                    },
                },
            });
            return updatedBlock;
        });
        return updatedBlock;
    }
    async assignTagsToBlock(blockGroupId, tagIds) {
        const updatedBlock = await this.db.transaction(async (tx) => {
            const [block] = await tx
                .select()
                .from(schema.blocks)
                .where((0, drizzle_orm_1.eq)(schema.blocks.blockGroupId, blockGroupId));
            if (!block) {
                throw new common_1.NotFoundException('Block not found.');
            }
            await tx.delete(schema.blockTags).where((0, drizzle_orm_1.eq)(schema.blockTags.blockId, block.id));
            await this._handleBlockTags(tx, block.id, tagIds);
            const updatedBlock = await tx.query.blocks.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.blocks.id, block.id),
                with: {
                    tags: {
                        with: {
                            tag: true,
                        },
                    },
                    domains: {
                        with: {
                            domain: true,
                        },
                    },
                },
            });
            return updatedBlock;
        });
        return updatedBlock;
    }
    async assignDomainToBlock(blockGroupId, domainId) {
        const updatedBlock = await this.db.transaction(async (tx) => {
            const [block] = await tx
                .select()
                .from(schema.blocks)
                .where((0, drizzle_orm_1.eq)(schema.blocks.blockGroupId, blockGroupId));
            if (!block) {
                throw new common_1.NotFoundException('Block not found.');
            }
            await tx.delete(schema.blockDomains).where((0, drizzle_orm_1.eq)(schema.blockDomains.blockId, block.id));
            await this._handleBlockDomains(tx, block.id, [domainId]);
            const updatedBlock = await tx.query.blocks.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.blocks.id, block.id),
                with: {
                    tags: {
                        with: {
                            tag: true,
                        },
                    },
                    domains: {
                        with: {
                            domain: true,
                        },
                    },
                },
            });
            return updatedBlock;
        });
        return updatedBlock;
    }
    async _handleBlockTags(tx, blockId, tagIds) {
        const ancestorTags = await tx.query.tagClosure.findMany({
            where: (0, drizzle_orm_1.inArray)(schema.tagClosure.descendantId, tagIds),
        });
        const allTagIds = new Set(ancestorTags.map((t) => t.ancestorId));
        tagIds.forEach((id) => allTagIds.add(id));
        const tagValues = Array.from(allTagIds).map((tagId) => ({
            blockId,
            tagId,
        }));
        if (tagValues.length > 0) {
            await tx.insert(schema.blockTags).values(tagValues).onConflictDoNothing();
        }
    }
    async _handleBlockDomains(tx, blockId, domainIds) {
        const domainValues = domainIds.map((domainId) => ({
            blockId,
            domainId,
        }));
        if (domainValues.length > 0) {
            await tx
                .insert(schema.blockDomains)
                .values(domainValues)
                .onConflictDoNothing();
        }
    }
    async _getPreviousTags(tx, blockId) {
        const previousTags = await tx.query.blockTags.findMany({
            where: (0, drizzle_orm_1.eq)(schema.blockTags.blockId, blockId),
        });
        return previousTags.map((t) => t.tagId);
    }
    async _getPreviousDomains(tx, blockId) {
        const previousDomains = await tx.query.blockDomains.findMany({
            where: (0, drizzle_orm_1.eq)(schema.blockDomains.blockId, blockId),
        });
        return previousDomains.map((d) => d.domainId);
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(drizzle_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], DocumentService);
//# sourceMappingURL=document.service.js.map