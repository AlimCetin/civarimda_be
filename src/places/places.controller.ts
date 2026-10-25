import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private placesService: PlacesService) {}

  @Get()
  async findAll(@Query('city') city?: string, @Query('category') category?: string) {
    return this.placesService.findAll(city, category);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findMyPlaces(@CurrentUser() user: User) {
    return this.placesService.findMyPlaces(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.placesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any, @CurrentUser() user: User) {
    return this.placesService.create(user.id, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updatePatch(@Param('id') id: string, @Body() body: any, @CurrentUser() user: User) {
    return this.placesService.update(id, user.id, user.role, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updatePut(@Param('id') id: string, @Body() body: any, @CurrentUser() user: User) {
    return this.placesService.update(id, user.id, user.role, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.placesService.delete(id, user.id, user.role);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@Param('id') id: string, @CurrentUser() user: User) {
    return this.placesService.toggleLike(id, user.id);
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.placesService.getComments(id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id') id: string,
    @Body('text') text: string,
    @CurrentUser() user: User,
  ) {
    return this.placesService.addComment(id, user.id, text);
  }
}
