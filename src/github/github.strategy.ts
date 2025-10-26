import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['repo', 'user:email'],
      passReqToCallback: true,
    } as any);
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { id, username, emails } = profile;
    const state = JSON.parse(
      Buffer.from(req.query.state, 'base64').toString('utf-8'),
    );
    const { projectId, userId } = state;

    const user = {
      githubId: id,
      email: emails[0].value,
      username,
      accessToken,
      projectId,
      userId, // The Archi user ID
    };
    done(null, user);
  }
}
