import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { UserNotificationsController } from './user-notifications.controller';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { WaitlistEntry } from '../savings/entities/waitlist-entry.entity';
import { MailModule } from '../mail/mail.module';
import { User } from '../user/entities/user.entity';
import { MilestoneSchedulerService } from './milestone-scheduler.service';
import { SavingsModule } from '../savings/savings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      User,
      WaitlistEntry,
    ]),
    MailModule,
    SavingsModule,
  ],
  controllers: [NotificationsController, UserNotificationsController],
  providers: [NotificationsService, MilestoneSchedulerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
