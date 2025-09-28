import { IsString } from 'class-validator';

export class AssignDomainDto {
  @IsString()
  domainId: string;
}
