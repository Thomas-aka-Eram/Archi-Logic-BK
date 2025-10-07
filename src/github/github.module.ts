
import { Module } from '@nestjs/common';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { GithubStrategy } from './github.strategy';
import { RepositoryModule } from '../repository/repository.module';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { CommitModule } from '../commit/commit.module';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [
    RepositoryModule,
    UserModule,
    CommitModule,
    TaskModule,
    PassportModule.register({ defaultStrategy: 'github' }),
    ConfigModule,
  ],
  controllers: [GithubController],
  providers: [GithubService, GithubStrategy],
})
export class GithubModule {}
