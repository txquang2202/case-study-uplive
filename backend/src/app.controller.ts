import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { AppService } from "./app.service";

/**
 * Application root controller
 * Handles health checks and general information endpoints
 */
@Controller("api")
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check endpoint
   *
   * @returns Health status with timestamp
   */
  @Get("health")
  @HttpCode(HttpStatus.OK)
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }

  /**
   * Welcome endpoint
   *
   * @returns Welcome message
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  getHello(): string {
    return this.appService.getHello();
  }
}
