import { Controller, Get, Param, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':projectId')
  getDashboardSummary(@Param('projectId') projectId: string, @Req() req: any) {
    // In a real app, userId would come from an auth guard, e.g., req.user.id
    const userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // MOCK USER ID
    return this.dashboardService.getDashboardSummary(userId, projectId);
  }
}
