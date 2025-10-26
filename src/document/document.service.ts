import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { DbType, TransactionType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { AddBlockDto } from './dto/add-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { and, eq, inArray, desc, asc } from 'drizzle-orm';

import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async updateDocument(docId: string, updateDocumentDto: UpdateDocumentDto) {
    const { name } = updateDocumentDto;

    const [updatedDocument] = await this.db
      .update(schema.documents)
      .set({ title: name })
      .where(eq(schema.documents.id, docId))
      .returning();

    if (!updatedDocument) {
      throw new NotFoundException('Document not found.');
    }

    return updatedDocument;
  }

  async createDocument(
    projectId: string,
    createDocumentDto: CreateDocumentDto,
    userId: string,
  ) {
    const { title, phaseKey, domainId } = createDocumentDto;

    const phase = await this.db.query.projectPhases.findFirst({
      where: and(
        eq(schema.projectPhases.projectId, projectId),
        eq(schema.projectPhases.key, phaseKey),
      ),
    });

    if (!phase) {
      throw new NotFoundException(
        `Phase with key "${phaseKey}" not found in this project.`,
      );
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

  async deleteDocument(docId: string) {
    await this.db
      .delete(schema.documents)
      .where(eq(schema.documents.id, docId));
    return { message: 'Document deleted successfully' };
  }

  async getDocument(docId: string) {
    const document = await this.db.query.documents.findFirst({
      where: eq(schema.documents.id, docId),
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    return document;
  }

  async getDocumentsForProject(projectId: string, phaseKey?: string) {
    let phaseId: string | undefined;
    if (phaseKey) {
      const phase = await this.db.query.projectPhases.findFirst({
        where: and(
          eq(schema.projectPhases.projectId, projectId),
          eq(schema.projectPhases.key, phaseKey),
        ),
      });
      if (!phase) {
        return [];
      }
      phaseId = phase.id;
    }

    const documents = await this.db.query.documents.findMany({
      where: and(
        eq(schema.documents.projectId, projectId),
        phaseId ? eq(schema.documents.phaseId, phaseId) : undefined,
      ),
      orderBy: (doc, { desc }) => [desc(doc.createdAt)],
    });
    return documents;
  }

  async getDocumentBlocks(documentId: string, currentOnly: boolean) {
    const blocks = await this.db.query.blocks.findMany({
      where: and(
        eq(schema.blocks.documentId, documentId),
        currentOnly ? eq(schema.blocks.isCurrentVersion, true) : undefined,
      ),
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

    console.log(
      'Blocks from DB with relations:',
      JSON.stringify(blocks, null, 2),
    );

    const result = blocks.map((block) => ({
      ...block,
      tags: block.tags.map((blockTag) => blockTag.tag),
      domains: block.domains.map((blockDomain) => blockDomain.domain),
    }));

    console.log(
      'Mapped blocks being returned:',
      JSON.stringify(result, null, 2),
    );

    return result;
  }

  async addBlock(documentId: string, addBlockDto: AddBlockDto, userId: string) {
    const { type, content, tags, domains } = addBlockDto;

    const newBlock = await this.db.transaction(async (tx) => {
      const [lastBlock] = await tx
        .select()
        .from(schema.blocks)
        .where(eq(schema.blocks.documentId, documentId))
        .orderBy(desc(schema.blocks.orderIndex))
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
        where: eq(schema.blocks.id, insertedBlock.id),
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

  async updateBlock(
    blockGroupId: string,
    updateBlockDto: UpdateBlockDto,
    userId: string,
  ) {
    const { content, expectedVersion, tags, domains } = updateBlockDto;

    const updatedBlock = await this.db.transaction(async (tx) => {
      const [currentRow] = await tx
        .select()
        .from(schema.blocks)
        .where(
          and(
            eq(schema.blocks.blockGroupId, blockGroupId),
            eq(schema.blocks.isCurrentVersion, true),
          ),
        )
        .for('update');

      if (!currentRow) {
        throw new NotFoundException('Block not found or no current version.');
      }

      if (expectedVersion && expectedVersion !== currentRow.version) {
        throw new ConflictException(
          `Expected version ${expectedVersion} but found ${currentRow.version}.`,
        );
      }

      await tx
        .update(schema.blocks)
        .set({ isCurrentVersion: false })
        .where(eq(schema.blocks.id, currentRow.id));

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

      const tagsToSet =
        tags ?? (await this._getPreviousTags(tx, currentRow.id));
      if (tagsToSet.length > 0) {
        await this._handleBlockTags(tx, newVersion.id, tagsToSet);
      }

      const domainsToSet =
        domains ?? (await this._getPreviousDomains(tx, currentRow.id));
      if (domainsToSet.length > 0) {
        await this._handleBlockDomains(tx, newVersion.id, domainsToSet);
      }

      const updatedBlock = await tx.query.blocks.findFirst({
        where: eq(schema.blocks.id, newVersion.id),
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

  async assignTagsToBlock(blockGroupId: string, tagIds: string[]) {
    return this.db.transaction(async (tx) => {
      const [block] = await tx
        .select()
        .from(schema.blocks)
        .where(
          and(
            eq(schema.blocks.blockGroupId, blockGroupId),
            eq(schema.blocks.isCurrentVersion, true),
          ),
        );

      if (!block) {
        throw new NotFoundException('Block not found.');
      }

      await tx
        .delete(schema.blockTags)
        .where(eq(schema.blockTags.blockId, block.id));
      await this._handleBlockTags(tx, block.id, tagIds);

      return tx.query.blocks.findFirst({
        where: eq(schema.blocks.id, block.id),
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
    });
  }

  async assignDomainToBlock(blockGroupId: string, domainId: string) {
    return this.db.transaction(async (tx) => {
      const [block] = await tx
        .select()
        .from(schema.blocks)
        .where(
          and(
            eq(schema.blocks.blockGroupId, blockGroupId),
            eq(schema.blocks.isCurrentVersion, true),
          ),
        );

      if (!block) {
        throw new NotFoundException('Block not found.');
      }

      await tx
        .delete(schema.blockDomains)
        .where(eq(schema.blockDomains.blockId, block.id));
      await this._handleBlockDomains(tx, block.id, [domainId]);

      return tx.query.blocks.findFirst({
        where: eq(schema.blocks.id, block.id),
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
    });
  }

  private async _handleBlockTags(
    tx: TransactionType,
    blockId: string,
    tagIds: string[],
  ) {
    const ancestorTags = await tx.query.tagClosure.findMany({
      where: inArray(schema.tagClosure.descendantId, tagIds),
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

  private async _handleBlockDomains(
    tx: TransactionType,
    blockId: string,
    domainIds: string[],
  ) {
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

  private async _getPreviousTags(
    tx: TransactionType,
    blockId: string,
  ): Promise<string[]> {
    const previousTags = await tx.query.blockTags.findMany({
      where: eq(schema.blockTags.blockId, blockId),
    });
    return previousTags.map((t) => t.tagId);
  }

  private async _getPreviousDomains(
    tx: TransactionType,
    blockId: string,
  ): Promise<string[]> {
    const previousDomains = await tx.query.blockDomains.findMany({
      where: eq(schema.blockDomains.blockId, blockId),
    });
    return previousDomains.map((d) => d.domainId);
  }

  async findRelatedDocuments(
    domainId: string,
    tagIds: string[],
  ): Promise<
    (typeof schema.documents.$inferSelect & {
      blocks: (typeof schema.blocks.$inferSelect & {
        tags: (typeof schema.tags.$inferSelect)[];
      })[];
    })[]
  > {
    if (!domainId) {
      return [];
    }

    // 1. Find blocks that have the specified domainId
    const blocksInDomain = await this.db.query.blocks.findMany({
      where: and(
        eq(schema.blocks.isCurrentVersion, true),
        inArray(
          schema.blocks.id,
          this.db
            .select({ blockId: schema.blockDomains.blockId })
            .from(schema.blockDomains)
            .where(eq(schema.blockDomains.domainId, domainId)),
        ),
      ),
      with: {
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    // 2. Filter these blocks by tagIds if provided
    const filteredBlocks =
      tagIds.length > 0
        ? blocksInDomain.filter((block) =>
            block.tags.some((blockTag) => tagIds.includes(blockTag.tag.id)),
          )
        : blocksInDomain;

    if (filteredBlocks.length === 0) {
      return [];
    }

    // 3. Group blocks by documentId
    const blocksByDocumentId = filteredBlocks.reduce(
      (acc, block) => {
        if (!acc[block.documentId]) {
          acc[block.documentId] = [];
        }
        acc[block.documentId].push({
          ...block,
          tags: block.tags.map((bt) => bt.tag),
        });
        return acc;
      },
      {} as Record<
        string,
        (typeof schema.blocks.$inferSelect & {
          tags: (typeof schema.tags.$inferSelect)[];
        })[]
      >,
    );

    // 4. Fetch the parent documents for these blocks
    const documentIds = Object.keys(blocksByDocumentId);
    const documents = await this.db.query.documents.findMany({
      where: inArray(schema.documents.id, documentIds),
    });

    // 5. Combine documents with their filtered blocks
    const result = documents.map((doc) => ({
      ...doc,
      blocks: blocksByDocumentId[doc.id] || [],
    }));

    return result;
  }
}
