import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { DbType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { users, projects, userProjects, projectPhases } from '../db/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_PHASES = [
  { key: 'REQUIREMENTS', title: 'Requirements', sortOrder: 1 },
  { key: 'DESIGN', title: 'Design', sortOrder: 2 },
  { key: 'DEVELOPMENT', title: 'Development', sortOrder: 3 },
  { key: 'TESTING', title: 'Testing', sortOrder: 4 },
  { key: 'DEPLOYMENT', title: 'Deployment', sortOrder: 5 },
  { key: 'MAINTENANCE', title: 'Maintenance', sortOrder: 6 },
];

@Injectable()
export class ProjectService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async createProject(createProjectDto: CreateProjectDto, userId: string) {
    const { name, description, phases } = createProjectDto;
    const phasesToCreate =
      phases && phases.length > 0 ? phases : DEFAULT_PHASES;

    const newProject = await this.db.transaction(async (tx) => {
      // 1. Create the project
      const [createdProject] = await tx
        .insert(projects)
        .values({
          name,
          description,
          createdBy: userId,
        })
        .returning();

      // 2. Assign the creator as the 'Owner'
      await tx.insert(userProjects).values({
        userId,
        projectId: createdProject.id,
        role: 'Owner',
        permissions: ['ADMIN'], // Assuming 'ADMIN' is a super-permission
      });

      // 3. Create the project phases
      const phaseValues = phasesToCreate.map((phase) => ({
        projectId: createdProject.id,
        key: phase.key,
        title: phase.title,
        sortOrder: phase.sortOrder,
      }));

      await tx.insert(projectPhases).values(phaseValues);

      return createdProject;
    });

    // We can query the full project with phases to return it
    const result = await this.db.query.projects.findFirst({
      where: eq(projects.id, newProject.id),
      with: {
        phases: {
          orderBy: (phase, { asc }) => [asc(phase.sortOrder)],
        },
      },
    });

    return result;
  }

  async addProjectMember(
    projectId: string,
    addProjectMemberDto: AddProjectMemberDto,
  ) {
    const { userId, role, permissions } = addProjectMemberDto;

    // Ensure the project and user exist before attempting to link them
    const projectExists = await this.db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });
    if (!projectExists) {
      throw new NotFoundException('Project not found');
    }

    const userExists = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    const [newUserProject] = await this.db
      .insert(userProjects)
      .values({
        projectId,
        userId,
        role,
        permissions,
      })
      .returning();

    return newUserProject;
  }

  async getProjectsForUser(userId: string) {
    const projectsForUser = await this.db.query.userProjects.findMany({
      where: eq(userProjects.userId, userId),
      with: {
        project: true,
      },
    });
    // This returns an array of userProject objects, each containing the project details.
    // We'll map it to return just the project objects.
    return projectsForUser.map((up) => up.project);
  }

  async getProjectPhases(projectId: string) {
    const phases = await this.db.query.projectPhases.findMany({
      where: eq(projectPhases.projectId, projectId),
      orderBy: (phase, { asc }) => [asc(phase.sortOrder)],
    });

    if (!phases || phases.length === 0) {
      // Optionally, you could check if the project exists first
      const projectExists = await this.db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });
      if (!projectExists) {
        throw new NotFoundException('Project not found');
      }
    }

    return phases;
  }
}
