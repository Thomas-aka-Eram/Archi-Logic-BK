import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { DocumentModule } from './document/document.module';
import { TaskModule } from './task/task.module';
import { TagModule } from './tag/tag.module';
import { RepositoryModule } from './repository/repository.module';
import { WebhookModule } from './webhook/webhook.module';
import { ReviewModule } from './review/review.module';
import { AuthModule } from './auth/auth.module';
import { SearchModule } from './search/search.module';
import { InvitationModule } from './invitation/invitation.module';
import { DomainModule } from './domain/domain.module';
import { GithubModule } from './github/github.module';
import { ActivityModule } from './activity/activity.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    ProjectModule,
    DocumentModule,
    TaskModule,
    TagModule,
    RepositoryModule,
    WebhookModule,
    ReviewModule,
    AuthModule,
    SearchModule,
    InvitationModule,
    DomainModule,
    GithubModule,
    ActivityModule,
    DashboardModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
