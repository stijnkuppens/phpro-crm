import { logger } from '@/lib/logger';

export function onRequestError(
  error: { digest: string } & Error,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: 'Pages' | 'App'; routeType: string; routePath: string },
) {
  logger.error(
    {
      err: error,
      digest: error.digest,
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
    },
    `Unhandled ${context.routeType} error in ${context.routePath}`,
  );
}
