import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { LinksController } from './links/links.controller';
import { LinksService } from './links/links.service';
import { GlobalExceptionFilter } from './observability/global-exception.filter';
import { HealthService } from './observability/health.service';
import { MetricsController } from './observability/metrics.controller';
import { MetricsService } from './observability/metrics.service';
import { RequestLoggingMiddleware } from './observability/request-logging.middleware';
import { StructuredLoggerService } from './observability/structured-logger.service';
import { RedirectCacheService } from './redirect/redirect-cache.service';
import { RedirectController } from './redirect/redirect.controller';
import { RedirectRateLimitService } from './redirect/redirect-rate-limit.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    RateLimitModule,
  ],
  controllers: [
    AppController,
    HealthController,
    LinksController,
    MetricsController,
    RedirectController,
  ],
  providers: [
    AppService,
    GlobalExceptionFilter,
    HealthService,
    LinksService,
    MetricsService,
    RedirectCacheService,
    RedirectRateLimitService,
    StructuredLoggerService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
