import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Get,
  Query,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { AddBlockDto } from './dto/add-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // This endpoint should be nested under projects in a real API, e.g., /projects/:projectId/documents
  @Post('/project/:projectId')
  async createDocument(
    @Param('projectId') projectId: string,
    @Body(new ValidationPipe()) createDocumentDto: CreateDocumentDto,
    @Request() req,
  ) {
    const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Replace with actual user ID from auth
    return this.documentService.createDocument(
      projectId,
      createDocumentDto,
      mockUserId,
    );
  }

  @Get('/project/:projectId')
  async getDocumentsForProject(
    @Param('projectId') projectId: string,
    @Query('phase') phaseKey?: string,
  ) {
    return this.documentService.getDocumentsForProject(projectId, phaseKey);
  }

  @Get(':docId/blocks')
  async getDocumentBlocks(
    @Param('docId') docId: string,
    @Query('currentOnly') currentOnly: string = 'true',
  ) {
    return this.documentService.getDocumentBlocks(
      docId,
      currentOnly === 'true',
    );
  }

  @Post(':docId/blocks')
  async addBlock(
    @Param('docId') docId: string,
    @Body(new ValidationPipe()) addBlockDto: AddBlockDto,
    @Request() req,
  ) {
    const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Replace with actual user ID from auth
    return this.documentService.addBlock(docId, addBlockDto, mockUserId);
  }

  @Patch('blocks/:blockGroupId')
  async updateBlock(
    @Param('blockGroupId') blockGroupId: string,
    @Body(new ValidationPipe()) updateBlockDto: UpdateBlockDto,
    @Request() req,
  ) {
    const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Replace with actual user ID from auth
    return this.documentService.updateBlock(
      blockGroupId,
      updateBlockDto,
      mockUserId,
    );
  }
}
