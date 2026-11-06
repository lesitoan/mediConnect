import { Injectable } from '@nestjs/common';

export interface StartScheduleExceptionWorkflowInput {
  leaveRequestId: string;
  exceptionIds: string[];
  appointmentIds: string[];
  actorId: string;
}

export interface StartScheduleExceptionWorkflowResult
  extends StartScheduleExceptionWorkflowInput {
  workflow: 'UC11';
  status: 'STARTED';
}

@Injectable()
export class ScheduleExceptionWorkflowService {
  async startResolution(
    input: StartScheduleExceptionWorkflowInput,
  ): Promise<StartScheduleExceptionWorkflowResult> {
    return {
      ...input,
      workflow: 'UC11',
      status: 'STARTED',
    };
  }
}
