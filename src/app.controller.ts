import { Controller, Get, Head } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  @Head('health')
  health() {
    return { status: 'OK', message: 'Civarımda API is running' };
  }

  @Get()
  @Head()
  root() {
    return { message: 'Welcome to Civarımda API' };
  }
}
