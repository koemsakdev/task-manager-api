import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Get config values
  const port = configService.get<number>("PORT", 3000);
  const apiPrefix = configService.get<string>("API_PREFIX", "api/v1");

  // Enable CORS
  app.enableCors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Global prefix for API routes
  app.setGlobalPrefix(apiPrefix);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger setup with CDN assets for Vercel
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Task Manager API")
    .setDescription("Task & Project Management Tool Backend API")
    .setVersion("1.0")
    .addServer("/", "Current Server")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .addTag("Auth", "Authentication endpoints")
    .addTag("Users", "User management endpoints")
    .addTag("Projects", "Project management endpoints")
    .addTag("Tasks", "Task management endpoints")
    .addTag("Labels", "Label management endpoints")
    .addTag("Comments", "Comment endpoints")
    .addTag("Time Logs", "Time tracking endpoints")
    .addTag("Files", "File management endpoints")
    .addTag("Messages", "Chat/messaging endpoints")
    .addTag("Activity Logs", "Activity log endpoints")
    .addTag("Roles", "Role management endpoints")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Setup Swagger with CDN-hosted assets (REQUIRED for Vercel/serverless)
  SwaggerModule.setup("docs", app, document, {
    customCssUrl: [
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css",
    ],
    customJs: [
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js",
    ],
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "none",
      filter: true,
      showRequestDuration: true,
    },
  });

  // Also expose the OpenAPI JSON
  app.getHttpAdapter().get("/docs-json", (req, res) => {
    res.json(document);
  });

  await app.listen(port);

  console.log(`
  ========================================
  🚀 Application is running on: http://localhost:${port}
  📚 Swagger docs: http://localhost:${port}/docs
  📄 OpenAPI JSON: http://localhost:${port}/docs-json
  🔗 API endpoint: http://localhost:${port}/${apiPrefix}
  ========================================
  `);
}

bootstrap();
