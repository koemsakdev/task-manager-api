import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        // If data already has the response structure, return as is
        if (data && data.success !== undefined) {
          return data;
        }

        // Extract meta if present (for pagination)
        const meta = data?.meta;
        const actualData = data?.data !== undefined ? data.data : data;

        return {
          success: true,
          statusCode: response.statusCode,
          message: 'Success',
          data: actualData,
          ...(meta && { meta }),
        };
      }),
    );
  }
}
