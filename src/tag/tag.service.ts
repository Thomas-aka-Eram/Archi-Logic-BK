import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { DB } from '../db/drizzle.module';
import type { DbType } from '../db/drizzle.module';
import { tags } from '../db/schema';
import { CreateTagDto } from './dto/create-tag.dto';
import { and, eq } from 'drizzle-orm';

// Simple color adjustment utility (can be replaced with a more robust library)
function adjustColor(hex: string, percent: number): string {
  const f = parseInt(hex.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = percent < 0 ? percent * -1 : percent;
  const R = f >> 16;
  const G = (f >> 8) & 0x00ff;
  const B = f & 0x0000ff;
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

@Injectable()
export class TagService {
  constructor(@Inject(DB) private db: DbType) {}

  private async getParentLevel(parentId: string): Promise<number> {
    const parent = await this.db.query.tags.findFirst({
      where: eq(tags.id, parentId),
      columns: { level: true },
    });
    return parent?.level ?? 0;
  }

  private async getInheritedColor(parentId: string): Promise<string> {
    const parent = await this.db.query.tags.findFirst({
      where: eq(tags.id, parentId),
      columns: { color: true },
    });
    // Adjust color to be slightly darker for children
    return adjustColor(parent?.color ?? '#cccccc', -0.2);
  }

  async create(createTagDto: CreateTagDto, userId: string) {
    const { name, projectId, parentId, color, phase } = createTagDto;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const existing = await this.db.query.tags.findFirst({
      where: and(eq(tags.projectId, projectId), eq(tags.slug, slug)),
    });

    if (existing) {
      throw new ConflictException('A tag with this name already exists for this project.');
    }

    const level = parentId ? (await this.getParentLevel(parentId)) + 1 : 0;
    const inheritedColor = parentId ? await this.getInheritedColor(parentId) : color ?? '#cccccc';

    const [newTag] = await this.db
      .insert(tags)
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

  async findAll(projectId: string) {
    const allTags = await this.db.select().from(tags).where(eq(tags.projectId, projectId));
    const tagMap = new Map(allTags.map(tag => [tag.id, { ...tag, children: [] as string[] }]));

    for (const tag of allTags) {
      if (tag.parentId && tagMap.has(tag.parentId)) {
        tagMap.get(tag.parentId)!.children.push(tag.id);
      }
    }

    return Array.from(tagMap.values());
  }
}
