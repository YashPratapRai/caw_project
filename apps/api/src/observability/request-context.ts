import type { Request } from 'express';

const requestIdKey = '__request_id';

export function setRequestId(request: Request, requestId: string) {
  Reflect.set(request, requestIdKey, requestId);
}

export function getRequestId(request: Request) {
  const requestId = Reflect.get(request, requestIdKey);
  return typeof requestId === 'string' ? requestId : null;
}

export function getUserId(request: Request) {
  const userId = request.get('x-user-id')?.trim();
  return userId || null;
}
