export function formatResponse(statusCode: number, payload: object | Error) {
  return {
    statusCode,
    body: JSON.stringify(payload, null, 2),
  };
}
