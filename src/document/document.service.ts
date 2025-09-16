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
import { and, eq, inArray } from 'drizzle-orm';

@Injectable()
export class DocumentService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async createDocument(
    projectId: string,
    createDocumentDto: CreateDocumentDto,
    userId: string,
  ) {
    const { title, phaseId, domainId } = createDocumentDto;
    const [newDocument] = await this.db
      .insert(schema.documents)
      .values({
        projectId,
        title,
        phaseId,
        domainId,
        createdBy: userId,
      })
      .returning();
    return newDocument;
  }

  async getDocumentsForProject(projectId: string, phaseKey?: string) {
    const documents = await this.db.query.documents.findMany({
      where: and(
        eq(schema.documents.projectId, projectId),
        phaseKey ? eq(schema.documents.phaseId, phaseKey) : undefined, // Assuming phaseId is the key
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
      orderBy: (block, { asc }) => [asc(block.createdAt)], // This should be improved with an explicit order field
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

  async addBlock(documentId: string, addBlockDto: AddBlockDto, userId: string) {
    const { type, content, tags, domains } = addBlockDto;

    return await this.db.transaction(async (tx) => {
      const [newBlock] = await tx
        .insert(schema.blocks)
        .values({
          documentId,
          type,
          content,
          createdBy: userId,
          version: 1,
          isCurrentVersion: true,
        })
        .returning();

      if (tags && tags.length > 0) {
        await this._handleBlockTags(tx, newBlock.id, tags);
      }

      if (domains && domains.length > 0) {
        await this._handleBlockDomains(tx, newBlock.id, domains);
      }

      return newBlock;
    });
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

      return newVersion;
    });

    return updatedBlock;
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
}
