import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { DbType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import {
  users,
  projects,
  userProjects,
  projectPhases,
  activityLogs,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';

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
    console.log(
      'ProjectService.createProject called with:',
      createProjectDto,
      'and userId:',
      userId,
    );
    const { name, description, phases } = createProjectDto;
    const phasesToCreate =
      phases && phases.length > 0 ? phases : DEFAULT_PHASES;
    console.log('Phases to create:', phasesToCreate);

    // 1. Create the project
    console.log('Inserting new project into database...');
    const [createdProject] = await this.db
      .insert(projects)
      .values({
        name,
        description,
        createdBy: userId,
      })
      .returning();
    console.log('Project created successfully:', createdProject);

    // 2. Assign the creator as the 'Owner'
    console.log('Assigning creator as project owner...');
    await this.db.insert(userProjects).values({
      userId,
      projectId: createdProject.id,
      role: 'Owner',
      permissions: ['ADMIN'], // Assuming 'ADMIN' is a super-permission
    });
    console.log('Project owner assigned.');

    // 3. Create the project phases
    const phaseValues = phasesToCreate.map((phase) => ({
      projectId: createdProject.id,
      key: phase.key,
      title: phase.title,
      sortOrder: phase.sortOrder,
    }));
    console.log('Inserting project phases:', phaseValues);

    await this.db.insert(projectPhases).values(phaseValues);
    console.log('Project phases inserted.');

    // We can query the full project with phases to return it
    console.log('Querying for the full project data to return...');
    const result = await this.db.query.projects.findFirst({
      where: eq(projects.id, createdProject.id),
      with: {
        phases: {
          orderBy: (phase, { asc }) => [asc(phase.sortOrder)],
        },
      },
    });
    console.log('Returning final project data:', result);

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
    console.log('ProjectService.getProjectsForUser called for userId:', userId);
    const projectsForUser = await this.db.query.userProjects.findMany({
      where: eq(userProjects.userId, userId),
      with: {
        project: true,
      },
    });
    console.log('Found userProjects entries:', projectsForUser);
    // This returns an array of userProject objects, each containing the project details.
    // We'll map it to return just the project objects.
    const projects = projectsForUser.map((up) => up.project);
    console.log('Mapped projects to return:', projects);
    return projects;
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

  async updateMemberRole(
    requestingUserId: string,
    projectId: string,
    targetUserId: string,
    newRole: string,
  ) {
    return this.db.transaction(async (tx) => {
      const [requesterMembership] = await tx
        .select()
        .from(userProjects)
        .where(
          and(
            eq(userProjects.userId, requestingUserId),
            eq(userProjects.projectId, projectId),
          ),
        );

      if (
        !requesterMembership ||
        !requesterMembership.role ||
        !['Owner', 'Manager'].includes(requesterMembership.role)
      ) {
        throw new ForbiddenException(
          'You do not have permission to manage member roles for this project.',
        );
      }

      const [targetMembership] = await tx
        .select()
        .from(userProjects)
        .where(
          and(
            eq(userProjects.userId, targetUserId),
            eq(userProjects.projectId, projectId),
          ),
        );

      if (!targetMembership) {
        throw new NotFoundException('Member not found in this project.');
      }

      // Add any additional business logic here, e.g., cannot demote the owner.

      const [updatedMembership] = await tx
        .update(userProjects)
        .set({ role: newRole })
        .where(eq(userProjects.id, targetMembership.id))
        .returning();

      await tx.insert(activityLogs).values({
        userId: requestingUserId,
        projectId,
        action: 'MEMBER_ROLE_UPDATED',
        entity: 'UserProject',
        entityId: targetMembership.id,
        oldValues: { role: targetMembership.role },
        newValues: { role: newRole },
      });

      return updatedMembership;
    });
  }

  async getProjectMembers(projectId: string) {
    const members = await this.db.query.userProjects.findMany({
      where: eq(userProjects.projectId, projectId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return members;
  }

  async getProjectById(projectId: string) {
    console.log('ProjectService.getProjectById called for projectId:', projectId);
    const project = await this.db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      with: {
        phases: {
          orderBy: (phase, { asc }) => [asc(phase.sortOrder)],
        },
        userProjects: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    console.log('Found project:', project);
    return project;
  }
}
