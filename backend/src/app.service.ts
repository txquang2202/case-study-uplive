import { Injectable } from "@nestjs/common";

/**
 * Application service for core functionality
 */
@Injectable()
export class AppService {
  /**
   * Gets welcome message
   *
   * @returns Welcome message string
   */
  getHello(): string {
    return "Welcome to Case Study API";
  }

  /**
   * Gets application health status
   *
   * @returns Health status object with timestamp
   */
  getHealth(): { status: string; timestamp: string } {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
