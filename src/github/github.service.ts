import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RepositoryService } from '../repository/repository.service';
import { UserService } from '../user/user.service';
import { CommitService } from '../commit/commit.service';
import { TaskService } from '../task/task.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class GithubService {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly userService: UserService,
    private readonly commitService: CommitService,
    private readonly taskService: TaskService,
  ) {}

  async handleGithubAuth(user: any) {
    // The user object from the strategy now contains the Archi userId
    if (!user.userId || user.userId === 'undefined') {
      throw new UnauthorizedException('Archi user ID not found in GitHub auth callback');
    }
    await this.userService.updateGithubAccessToken(user.userId, user.accessToken);
    return user;
  }

  async getUserRepos(userId: string): Promise<any[]> {
    console.log('getUserRepos userId:', userId);
    const user = await this.userService.findById(userId);
    if (!user || !user.githubAccessToken) {
      throw new UnauthorizedException('GitHub access token not found for user');
    }
    const accessToken = user.githubAccessToken;
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });
    return response.data;
  }

  async linkRepo(projectId: string, repoName: string, userId: string) {
    const user = await this.userService.findById(userId);
    if (!user || !user.githubAccessToken) {
      throw new UnauthorizedException('GitHub access token not found for user');
    }
    const accessToken = user.githubAccessToken;

    const existingRepo = await this.repositoryService.findByProjectIdAndName(
      projectId,
      repoName,
    );

    if (existingRepo.length === 0) {
      return await this.repositoryService.addRepository(
        projectId,
        {
          projectId: projectId,
          name: repoName,
          accessToken: accessToken,
        },
        userId,
      );
    } else {
      return await this.repositoryService.updateAccessToken(
        existingRepo[0].id,
        accessToken,
      );
    }
  }

  async getCommits(repoId: string): Promise<any[]> {
    const repo = await this.repositoryService.findById(repoId);
    const response = await axios.get(
      `https://api.github.com/repos/${repo.name}/commits`,
      {
        headers: {
          Authorization: `token ${repo.accessToken}`,
        },
      },
    );
    return response.data;
  }

  async createWebhook(repoId: string) {
    const repo = await this.repositoryService.findById(repoId);
    const secret = crypto.randomBytes(20).toString('hex');
    await this.repositoryService.updateWebhookSecret(repo.id, secret);

    const webhookUrl = 'http://localhost:3001/github/webhook';

    await axios.post(
      `https://api.github.com/repos/${repo.name}/hooks`,
      {
        name: 'web',
        active: true,
        events: ['push'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: secret,
        },
      },
      {
        headers: {
          Authorization: `token ${repo.accessToken}`,
        },
      },
    );
  }

  async getLinkedRepo(projectId: string) {
    return this.repositoryService.findByProjectId(projectId);
  }

  async getIntegrationStatus(projectId: string) {
    const repo = await this.repositoryService.findByProjectId(projectId);
    if (repo.length > 0) {
      return {
        repo: repo[0].name,
        linked: true,
        webhookEvents: repo[0].webhookEvents || [],
        lastSynced: repo[0].lastSynced,
      };
    } else {
      return {
        linked: false,
      };
    }
  }

  async getProjectCommits(projectId: string) {
    const repo = await this.repositoryService.findByProjectId(projectId);
    if (repo.length > 0) {
      return this.getCommits(repo[0].id);
    }
    return [];
  }

  async updateWebhook(projectId: string, events: string[]) {
    const repo = await this.repositoryService.findByProjectId(projectId);
    if (repo.length > 0) {
      await this.repositoryService.updateWebhookEvents(repo[0].id, events);
      // Here you would also update the webhook on GitHub's side
      // using the GitHub API. This is a simplified example.
      return { success: true };
    }
    return { success: false };
  }

  async handleWebhook(payload: any, signature: string) {
    const repoName = payload.repository.full_name;
    const repo = await this.repositoryService.findByRepoName(repoName);

    if (!repo) {
      throw new UnauthorizedException('Repository not found');
    }

    const secret = repo.webhookSecret;
    if (!secret) {
      throw new UnauthorizedException('Webhook secret not configured for repository');
    }
    const hmac = crypto.createHmac('sha1', secret);
    const digest = 'sha1=' + hmac.update(JSON.stringify(payload)).digest('hex');

    if (signature !== digest) {
      throw new UnauthorizedException('Invalid signature');
    }

    const commits = payload.commits;
    for (const commit of commits) {
      const message = commit.message;
      const taskRegex = /\[Task-(\d+)\]/;
      const match = message.match(taskRegex);

      if (match) {
        const taskId = match[1];
        const newCommit = await this.commitService.create({
          repoId: repo.id,
          projectId: repo.projectId,
          commitHash: commit.id,
          message: commit.message,
          authorName: commit.author.name,
          authorEmail: commit.author.email,
          url: commit.url,
          branch: payload.ref.replace('refs/heads/', ''),
          committedAt: new Date(commit.timestamp),
        });
        await this.taskService.linkCommit(taskId, newCommit.id);
      }
    }
  }
}