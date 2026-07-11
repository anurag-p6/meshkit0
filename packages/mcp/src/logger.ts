export function logInfo(message: string): void {
  console.error(`[meshkit-mcp] ${message}`);
}

export function logError(message: string, error?: unknown): void {
  if (error instanceof Error) {
    console.error(`[meshkit-mcp] ${message}: ${error.message}`);
    return;
  }
  console.error(`[meshkit-mcp] ${message}`);
}
