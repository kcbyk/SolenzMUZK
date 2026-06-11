export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
