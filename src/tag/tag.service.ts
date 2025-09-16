import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { DbType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { CreateTagDto } from './dto/create-tag.dto';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class TagService {
  constructor(@Inject(DB) private db: DbType) {}

  async createTag(
    projectId: string,
    createTagDto: CreateTagDto,
    actorUserId: string,
  ) {
    const { name, slug, parentId, color } = createTagDto;

    if (!name) {
      throw new BadRequestException('Tag name is required');
    }

    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

    return this.db.transaction(async (tx) => {
      // Optional: Check for MANAGE_TAGS permission
      // const [actorMembership] = await tx.select().from(schema.userProjects)...

      let parentLevel = 0;
      if (parentId) {
        const [parentTag] = await tx
          .select({ level: schema.tags.level })
          .from(schema.tags)
          .where(eq(schema.tags.id, parentId));

        if (!parentTag) {
          throw new NotFoundException('Parent tag not found');
        }
        parentLevel = parentTag.level ?? 0;
        if (parentLevel >= 5) {
          throw new ConflictException('Tag hierarchy cannot exceed 5 levels');
        }
      }

      const [newTag] = await tx
        .insert(schema.tags)
        .values({
          projectId,
          name,
          slug: finalSlug,
          parentId,
          color,
          level: parentLevel + 1,
        })
        .returning();

      // Handle tag closure
      const closureValues = [
        {
          ancestorId: newTag.id,
          descendantId: newTag.id,
          depth: 0,
        },
      ];

      if (parentId) {
        const parentAncestors = await tx.query.tagClosure.findMany({
          where: eq(schema.tagClosure.descendantId, parentId),
        });
        for (const ancestor of parentAncestors) {
          closureValues.push({
            ancestorId: ancestor.ancestorId,
            descendantId: newTag.id,
            depth: ancestor.depth + 1,
          });
        }
      }

      await tx.insert(schema.tagClosure).values(closureValues);

      // TODO: Add activity log

      return newTag;
    });
  }
}
