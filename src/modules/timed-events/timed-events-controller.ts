import { Controller } from '@tsoa/runtime';
import { Body, Delete, Get, Post, Put, Route, Request, Security, Tags } from 'tsoa';
import EventSpec from './event-spec';
import { SecurityNames } from '../../helpers/security';
import { securityGroups } from '../../helpers/security-groups';
import { Request as ExpressRequest } from 'express';
import TimedEventsService, {
  CreateTimedEventRequest,
  UpdateTimedEventRequest,
} from './timed-events-service';
import { TimedEvent } from './entities';
import logger from '../../logger';

interface TimedEventResponse {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  cronExpression: string;
  eventSpec: EventSpec;
  skipNext: boolean;
}

@Route('timed-events')
@Tags('Timed Events')
export class TimedEventsController extends Controller {
  private service: TimedEventsService;

  constructor() {
    super();
    this.service = TimedEventsService.getInstance();
  }

  public toTimedEventResponse(timedEvent: TimedEvent): TimedEventResponse {
    return {
      id: timedEvent.id,
      createdAt: timedEvent.createdAt,
      updatedAt: timedEvent.updatedAt,
      cronExpression: timedEvent.cronExpression,
      eventSpec: timedEvent.eventSpec,
      skipNext: timedEvent.skipNext,
    };
  }

  @Security(SecurityNames.LOCAL, securityGroups.timedEvents.privileged)
  @Get('')
  public async getAllTimedEvents(): Promise<TimedEventResponse[]> {
    const timedEvents = await this.service.getEvents();
    return timedEvents.map((t) => this.toTimedEventResponse(t));
  }

  @Security(SecurityNames.LOCAL, securityGroups.timedEvents.privileged)
  @Get('{id}')
  public async getSingleTimedEvent(id: number): Promise<TimedEventResponse> {
    const timedEvent = await this.service.getEvent(id);
    return this.toTimedEventResponse(timedEvent);
  }

  @Security(SecurityNames.LOCAL, securityGroups.timedEvents.privileged)
  @Post('')
  public async createTimedEvent(
    @Request() req: ExpressRequest,
    @Body() timedEventRequest: CreateTimedEventRequest,
  ): Promise<TimedEventResponse> {
    const timedEvent = await this.service.createEvent(timedEventRequest);
    logger.audit(req.user, `Created timed event: ${timedEvent.eventSpec.type} (id: ${timedEvent.id})`);
    return this.toTimedEventResponse(timedEvent);
  }

  @Security(SecurityNames.LOCAL, securityGroups.timedEvents.privileged)
  @Put('{id}')
  public async updateTimedEvent(
    id: number,
    @Request() req: ExpressRequest,
    @Body() timedEventRequest: UpdateTimedEventRequest,
  ): Promise<TimedEventResponse> {
    const timedEvent = await this.service.updateEvent(id, timedEventRequest);
    logger.audit(req.user, `Updated timed event: ${timedEvent.eventSpec.type} (id: ${timedEvent.id})`);
    return this.toTimedEventResponse(timedEvent);
  }

  @Security(SecurityNames.LOCAL, securityGroups.timedEvents.privileged)
  @Delete('{id}')
  public async deleteTimedEvent(
    id: number,
    @Request() req: ExpressRequest,
  ): Promise<void> {
    const timedEvent = await this.service.getEvent(id);
    logger.audit(req.user, `Deleted timed event: ${timedEvent.eventSpec.type} (id: ${timedEvent.id})`);
    await this.service.deleteEvent(id);
  }
}
