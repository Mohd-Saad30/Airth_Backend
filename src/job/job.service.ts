import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import {
  JobStatus,
  CreateJobDto,
  UpdateJobStatusDto,
  ALLOWED_TRANSITIONS,
  isValidTransition,
} from './job.dto.js';

@Injectable()
export class JobService {

  async getAllJob() {
    const jobs = await db.orm.public.Job.all();
    return {
      message: 'All Jobs retrieved successfully',
      data: jobs,
    };
  }

  
  async createJob(body: CreateJobDto) {
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      throw new BadRequestException('Job title is required and cannot be empty');
    }
    if (!body.type || typeof body.type !== 'string' || !body.type.trim()) {
      throw new BadRequestException('Job type is required and cannot be empty');
    }

    const job = await db.orm.public.Job.create({
      title: body.title.trim(),
      type: body.type.trim(),
    });

    return {
      message: 'Job created successfully',
      data: job,
    };
  }

 
  async updateJob(id: string, body: UpdateJobStatusDto) {
    const targetStatus = body.status as JobStatus;
    const validStatuses = Object.values(JobStatus);

    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status '${body.status}'. Allowed values: ${validStatuses.join(', ')}`
      );
    }


    const existingJob = await db.orm.public.Job.where({ id }).first();

    if (!existingJob) {
      throw new NotFoundException(`Job with id ${id} not found`);
    }

    const currentStatus = existingJob.status as JobStatus;

    //State Machine Transition Rules:
    // Allowed transitions:
    // pending -> running, failed
    // running -> completed, failed
    // completed -> [terminal: cannot transition]
    // failed -> [terminal: cannot transition]
    if (!isValidTransition(currentStatus, targetStatus)) {
      const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
      throw new BadRequestException(
        `Invalid state transition: Cannot change status from '${currentStatus}' to '${targetStatus}'. Allowed transitions from '${currentStatus}': [${allowed.join(', ')}]`
      );
    }

    //Concurrency Guard (Atomic Conditional Update / Compare-and-Swap):
    // If two tabs try to change 'pending' to 'running' simultaneously:
    // The database ensures that only the request whose WHERE id = id AND status = currentStatus
    // matches the row. The second concurrent request will fail to match and return null / 0 updated rows.
    const updatedJob = await db.orm.public.Job
      .where({ id, status: currentStatus as any })
      .update({ status: targetStatus as any });

    if (!updatedJob) {
      throw new ConflictException(
        `State conflict: The job was already transitioned by another concurrent request. Current state is no longer '${currentStatus}'.`
      );
    }

    return {
      message: 'Job updated successfully',
      data: updatedJob,
    };
  }

  
  async deleteJob(id: string) {
    const job = await db.orm.public.Job.where({ id }).delete();

    if (!job) {
      throw new NotFoundException(`Job with id ${id} not found`);
    }

    return {
      message: 'Job deleted successfully',
      data: job,
    };
  }
}
