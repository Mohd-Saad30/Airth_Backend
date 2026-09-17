import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { JobService } from './job.service.js';
import { CreateJobDto, UpdateJobStatusDto } from './job.dto.js';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  getAllJobs() {
    return this.jobService.getAllJob();
  }

  @Post()
  createJob(@Body() body: CreateJobDto) {
    return this.jobService.createJob(body);
  }

  @Patch(':id/status')
  updateJobStatus(@Param('id') id: string, @Body() body: UpdateJobStatusDto) {
    return this.jobService.updateJob(id, body);
  }

  @Delete(':id')
  deleteJob(@Param('id') id: string) {
    return this.jobService.deleteJob(id);
  }
}
