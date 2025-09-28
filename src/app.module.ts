import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './db/drizzle.module';
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

@Module({
  imports: [
    DrizzleModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
