import { Controller, Get, Head } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get('health')
  @Head('health')
  health() {
    return { status: 'OK', message: 'Civarımda API is running' };
  }

  /**
   * Mobil uygulamanın çalışma zamanında dinamik API ve Socket adreslerini
   * okuyabilmesi için ortam değişkenlerinden genel yapılandırmayı döndürür.
   */
  @Get('app/config')
  getAppConfig() {
    const rawApiUrl = this.configService.get<string>('PUBLIC_API_BASE_URL')?.trim();
    const rawSocketUrl = this.configService.get<string>('PUBLIC_SOCKET_URL')?.trim();

    return {
      apiBaseUrl: rawApiUrl || null,
      socketUrl: rawSocketUrl || null,
    };
  }

  @Get()
  @Head()
  root() {
    return { message: 'Welcome to Civarımda API' };
  }
}
