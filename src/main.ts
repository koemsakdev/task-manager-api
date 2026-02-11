import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get<string>("API_PREFIX", "api/v1");
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

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

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Task Manager API")
    .setDescription("Task & Project Management Tool API Documentation")
    .setVersion("1.0")
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
    .addTag("Comments", "Task comments endpoints")
    .addTag("Time Logs", "Time tracking endpoints")
    .addTag("Files", "File management endpoints")
    .addTag("Messages", "Chat/messaging endpoints")
    .addTag("Activity Logs", "Activity audit endpoints")
    .addTag("Roles", "Role management endpoints")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, {
    customCssUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css",
    customJs: [
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js",
    ],
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>("PORT", 3000);
  await app.listen(port);

  console.log(`
  ========================================
  🚀 Application is running on: http://localhost:${port}
  📚 Swagger docs: http://localhost:${port}/docs
  🔗 API endpoint: http://localhost:${port}/${apiPrefix}
  ========================================
  `);
}

bootstrap();
