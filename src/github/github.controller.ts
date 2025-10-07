
import { Controller, Get, UseGuards, Req, Res, Query, Param, ParseUUIDPipe, Post, Body, Headers, ExecutionContext, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GithubService } from './github.service';

// Custom guard to pass userId and projectId to the GitHub strategy via the 'state' parameter
class GithubAuthGuard extends AuthGuard('github') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const { projectId, userId } = req.query;
    if (!projectId || !userId) {
      // This would indicate a bad request from the frontend
      return undefined;
    }
    // Encode both IDs into the state parameter for retrieval in the callback
    const state = Buffer.from(JSON.stringify({ projectId, userId })).toString('base64');
    return { state };
  }
}

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('auth')
  @UseGuards(GithubAuthGuard)
  async githubAuth() {
    // The guard handles the redirect to GitHub, including our custom state
  }

  @Get('auth/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req, @Res() res) {
    const user = await this.githubService.handleGithubAuth(req.user);
    // Redirect the user to the repository selection page
    res.redirect(`http://localhost:8080/project/${user.projectId}/github/select-repo`);
  }

  @Get('user/repos')
  @UseGuards(AuthGuard('jwt'))
  async getUserRepos(@Req() req) {
    console.log('getUserRepos req.user:', req.user);
    return this.githubService.getUserRepos(req.user.userId);
  }

  @Get('/projects/:projectId/integration/github')
  @UseGuards(AuthGuard('jwt'))
  async getIntegrationStatus(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.githubService.getIntegrationStatus(projectId);
  }

  @Get('/projects/:projectId/repos')
  @UseGuards(AuthGuard('jwt'))
  async getLinkedRepo(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.githubService.getLinkedRepo(projectId);
  }

  @Post('/projects/:projectId/repos')
  @UseGuards(AuthGuard('jwt'))
  async linkRepo(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body('repoName') repoName: string,
    @Req() req,
  ) {
    return this.githubService.linkRepo(projectId, repoName, req.user.userId);
  }

  @Get('/projects/:projectId/github/commits')
  @UseGuards(AuthGuard('jwt'))
  async getProjectCommits(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.githubService.getProjectCommits(projectId);
  }

  @Get('repos/:repoId/commits')
  @UseGuards(AuthGuard('jwt'))
  async getCommits(@Param('repoId', ParseUUIDPipe) repoId: string) {
    return this.githubService.getCommits(repoId);
  }

  @Post('repos/:repoId/webhook')
  @UseGuards(AuthGuard('jwt'))
  async createWebhook(@Param('repoId', ParseUUIDPipe) repoId: string) {
    return this.githubService.createWebhook(repoId);
  }

  @Patch('/projects/:projectId/integration/github/webhook')
  @UseGuards(AuthGuard('jwt'))
  async updateWebhook(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body('events') events: string[],
  ) {
    return this.githubService.updateWebhook(projectId, events);
  }

  @Post('webhook')
  async webhook(@Body() body: any, @Headers('x-hub-signature') signature: string) {
    this.githubService.handleWebhook(body, signature);
  }
}
