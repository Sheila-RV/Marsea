import { Module } from '@nestjs/common';
import { RecurringClassesController } from './recurring-classes.controller';
import { RecurringClassesService } from './recurring-classes.service';

@Module({
  controllers: [RecurringClassesController],
  providers: [RecurringClassesService],
})
export class RecurringClassesModule {}
