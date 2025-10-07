
export class CreateCommitDto {
  repoId: string;
  projectId: string;
  commitHash: string;
  message: string;
  authorName: string;
  authorEmail: string;
  url: string;
  branch: string;
  committedAt: Date;
}
