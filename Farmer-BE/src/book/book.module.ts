import { Module } from '@nestjs/common';
import { BookService } from './book.service';

@Module({
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}
