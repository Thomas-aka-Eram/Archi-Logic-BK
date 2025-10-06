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
  roles,
  projectUserRoles,
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

    // 2. Assign the creator as 'Admin' in the new project_user_roles table
    const adminRole = await this.db.query.roles.findFirst({
      where: eq(schema.roles.name, 'Admin'),
    });
    console.log('Queried adminRole:', adminRole);

    if (!adminRole) {
      throw new NotFoundException('Admin role not found. Please seed the roles table.');
    }

    await this.db.insert(schema.projectUserRoles).values({
      userId,
      projectId: createdProject.id,
      roleId: adminRole.id,
    });

    // Remove the old userProjects entry for the creator (if it exists, though it shouldn't for a new project)
    // This is a cleanup step, as we are moving to projectUserRoles
    await this.db.delete(schema.userProjects).where(
      and(
        eq(schema.userProjects.userId, userId),
        eq(schema.userProjects.projectId, createdProject.id),
      ),
    );

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
      where: eq(schema.projects.id, projectId),
    });
    if (!projectExists) {
      throw new NotFoundException('Project not found');
    }

    const userExists = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    // Find the roleId for the given role name
    const roleEntry = await this.db.query.roles.findFirst({
      where: eq(schema.roles.name, role),
    });

    if (!roleEntry) {
      throw new NotFoundException(`Role '${role}' not found.`);
    }

    // Insert into projectUserRoles
    const [newProjectUserRole] = await this.db
      .insert(schema.projectUserRoles)
      .values({
        projectId,
        userId,
        roleId: roleEntry.id,
      })
      .returning();

    // Remove the old userProjects entry for this user and project
    await this.db.delete(schema.userProjects).where(
      and(
        eq(schema.userProjects.userId, userId),
        eq(schema.userProjects.projectId, projectId),
      ),
    );

    return newProjectUserRole;
  }

  async getProjectsForUser(userId: string) {
    const projectMemberships = await this.db.query.projectUserRoles.findMany({
      where: eq(schema.projectUserRoles.userId, userId),
      with: {
        project: true,
        role: true, // Include the role details
      },
    });

    const projectsWithRoles = projectMemberships.map((membership) => ({
      ...membership.project,
      userRole: membership.role.name, // Add the user's role for this project
    }));

    return projectsWithRoles;
  }

  async getProjectPhases(projectId: string) {
    const phases = await this.db.query.projectPhases.findMany({
      where: eq(projectPhases.projectId, projectId),
      orderBy: (phase, { asc }) => [asc(phase.sortOrder)],
    });

    console.log('Phases returned by getProjectPhases:', phases);

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
    newRoleName: string,
  ) {
    return this.db.transaction(async (tx) => {
      // Find the requesting user's role in projectUserRoles
      const [requesterMembership] = await tx
        .select()
        .from(schema.projectUserRoles)
        .where(
          and(
            eq(schema.projectUserRoles.userId, requestingUserId),
            eq(schema.projectUserRoles.projectId, projectId),
          ),
        )
        .leftJoin(schema.roles, eq(schema.projectUserRoles.roleId, schema.roles.id));

      if (
        !requesterMembership ||
        !requesterMembership.roles ||
        !['Admin', 'Manager'].includes(requesterMembership.roles.name)
      ) {
        throw new ForbiddenException(
          'You do not have permission to manage member roles for this project.',
        );
      }

      // Find the target user's membership in projectUserRoles
      const [targetMembership] = await tx
        .select()
        .from(schema.projectUserRoles)
        .where(
          and(
            eq(schema.projectUserRoles.userId, targetUserId),
            eq(schema.projectUserRoles.projectId, projectId),
          ),
        );

      if (!targetMembership) {
        throw new NotFoundException('Member not found in this project.');
      }

      // Find the new role's ID
      const newRoleEntry = await tx.query.roles.findFirst({
        where: eq(schema.roles.name, newRoleName),
      });

      if (!newRoleEntry) {
        throw new NotFoundException(`Role '${newRoleName}' not found.`);
      }

      // Update the role in projectUserRoles
      const [updatedMembership] = await tx
        .update(schema.projectUserRoles)
        .set({ roleId: newRoleEntry.id })
        .where(eq(schema.projectUserRoles.id, targetMembership.id))
        .returning();

      // Log activity (adjusting for new schema)
      await tx.insert(schema.activityLogs).values({
        userId: requestingUserId,
        projectId,
        action: 'MEMBER_ROLE_UPDATED',
        entity: 'ProjectUserRole',
        entityId: targetMembership.id,
        // oldValues and newValues would need to be adjusted to store role names or IDs
        // For now, we'll just log the action.
      });

      return updatedMembership;
    });
  }

  async getProjectMembers(projectId: string) {
    const members = await this.db.query.projectUserRoles.findMany({
      where: eq(schema.projectUserRoles.projectId, projectId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        role: true, // Include the role details
      },
    });
    return members.map(member => ({
      ...member.user,
      role: member.role.name, // Add the role name to the user object
    }));
  }

  async getProjectById(projectId: string) {
    console.log('ProjectService.getProjectById called for projectId:', projectId);
    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
      with: {
        phases: {
          orderBy: (phase, { asc }) => [asc(phase.sortOrder)],
        },
        projectUserRoles: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: true, // Include the role details
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Map the projectUserRoles to include the role name directly
    const { projectUserRoles, ...restOfProject } = project;
    const projectWithMappedRoles = {
      ...restOfProject,
      members: projectUserRoles.map(pur => ({
        ...pur.user,
        role: pur.role.name,
      })),
    };

    console.log('Found project:', projectWithMappedRoles);
    return projectWithMappedRoles;
  }
}
