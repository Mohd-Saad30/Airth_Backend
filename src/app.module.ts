import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { JobModule } from './job/job.module.js';

@Module({
  imports: [ JobModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
