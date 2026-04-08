// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Patch,
//   Param,
//   Delete,
//   Query,
//   UseGuards,
//   Request,
// } from '@nestjs/common';
// import { BookService } from './book.service';
// import { CreateBookDto } from './dto/create-book.dto';
// import { UpdateBookDto } from './dto/update-book.dto';
// import { PaginationDto } from '../common/dto/pagination.dto';
// import { RolesGuard } from '../common/guards/roles.guard';
// import { AuthGuard } from '../common/guards/auth.guard';
// import { Roles } from '../common/decorators/roles.decorator';
// import { UserRole } from '@prisma/client';

// @Controller('books')
// @UseGuards(AuthGuard, RolesGuard)
// export class BookController {
//   constructor(private readonly bookService: BookService) {}

//   @Post()
//   @Roles(UserRole.ADMIN, UserRole.MANAGER)
//   create(@Body() createBookDto: CreateBookDto) {
//     return this.bookService.create(createBookDto);
//   }

//   @Get()
//   @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.READER)
//   findAll(@Query() pagination: PaginationDto, @Request() req: any) {
//     const branchId = req.user?.branchId;
//     const currentUserRole = req.user?.role;
//     return this.bookService.findAll(pagination, branchId, currentUserRole);
//   }

//   @Get(':id')
//   @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.READER)
//   findOne(@Param('id') id: string, @Request() req: any) {
//     const branchId = req.user?.branchId;
//     const currentUserRole = req.user?.role;
//     return this.bookService.findOne(id, branchId, currentUserRole);
//   }

//   @Patch(':id')
//   @Roles(UserRole.ADMIN, UserRole.MANAGER)
//   update(
//     @Param('id') id: string,
//     @Body() updateBookDto: UpdateBookDto,
//     @Request() req: any,
//   ) {
//     const branchId = req.user?.branchId;
//     const currentUserRole = req.user?.role;
//     return this.bookService.update(id, updateBookDto, branchId, currentUserRole);
//   }

//   @Delete(':id')
//   @Roles(UserRole.ADMIN, UserRole.MANAGER)
//   remove(@Param('id') id: string, @Request() req: any) {
//     const branchId = req.user?.branchId;
//     const currentUserRole = req.user?.role;
//     return this.bookService.remove(id, branchId, currentUserRole);
//   }
// }
