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
  UseGuards,
  Delete,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { AddBlockDto } from './dto/add-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { AssignTagsDto } from './dto/assign-tags.dto';
import { AssignDomainDto } from './dto/assign-domain.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FindRelatedDocumentsDto } from './dto/find-related-documents.dto';

import { UpdateDocumentDto } from './dto/update-document.dto';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('related')
  @UseGuards(JwtAuthGuard)
  async findRelatedDocuments(
    @Query() query: FindRelatedDocumentsDto,
  ) {
    console.log('Received query in controller:', query);
    const { domainId, tagIds } = query;
    console.log(`Controller received domainId: ${domainId}`);
    console.log(`Controller received tagIds: ${JSON.stringify(tagIds)}`);
    return this.documentService.findRelatedDocuments(domainId, tagIds || []);
  }

  @Patch(':docId')
  @UseGuards(JwtAuthGuard)
  async updateDocument(
    @Param('docId') docId: string,
    @Body(new ValidationPipe()) updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentService.updateDocument(docId, updateDocumentDto);
  }

  @Get(':docId')
  async getDocument(@Param('docId') docId: string) {
    return this.documentService.getDocument(docId);
  }

  @Delete(':docId')
  @UseGuards(JwtAuthGuard)
  async deleteDocument(@Param('docId') docId: string) {
    return this.documentService.deleteDocument(docId);
  }

  @Get(':docId/blocks')
  async getDocumentBlocks(
    @Param('docId') docId: string,
    @Query('currentOnly') currentOnly: string = 'true',
  ) {
    console.log('getDocumentBlocks called with docId:', docId);
    return this.documentService.getDocumentBlocks(
      docId,
      currentOnly === 'true',
    );
  }

  @Post(':docId/blocks')
  @UseGuards(JwtAuthGuard)
  async addBlock(
    @Param('docId') docId: string,
    @Body(new ValidationPipe()) addBlockDto: AddBlockDto,
    @Request() req,
  ) {
    console.log('addBlock DTO:', JSON.stringify(addBlockDto, null, 2));
    return this.documentService.addBlock(docId, addBlockDto, req.user.userId);
  }

  @Patch('blocks/:blockGroupId')
  @UseGuards(JwtAuthGuard)
  async updateBlock(
    @Param('blockGroupId') blockGroupId: string,
    @Body(new ValidationPipe()) updateBlockDto: UpdateBlockDto,
    @Request() req,
  ) {
    console.log('updateBlock DTO:', JSON.stringify(updateBlockDto, null, 2));
    return this.documentService.updateBlock(
      blockGroupId,
      updateBlockDto,
      req.user.userId,
    );
  }

  @Patch('blocks/:blockGroupId/tags')
  @UseGuards(JwtAuthGuard)
  async assignTagsToBlock(
    @Param('blockGroupId') blockGroupId: string,
    @Body(new ValidationPipe()) assignTagsDto: AssignTagsDto,
  ) {
    return this.documentService.assignTagsToBlock(
      blockGroupId,
      assignTagsDto.tagIds,
    );
  }

  @Patch('blocks/:blockGroupId/domain')
  @UseGuards(JwtAuthGuard)
  async assignDomainToBlock(
    @Param('blockGroupId') blockGroupId: string,
    @Body(new ValidationPipe()) assignDomainDto: AssignDomainDto,
  ) {
    return this.documentService.assignDomainToBlock(
      blockGroupId,
      assignDomainDto.domainId,
    );
  }
}
