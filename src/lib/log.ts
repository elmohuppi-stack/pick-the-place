/**
 * Schlanke, einheitliche Fehlerprotokollierung für Server-Code.
 * Bewusst ein dünner Wrapper um console.error – kein externes Tooling. So gibt
 * es eine einzige Stelle, falls später ein echter Logger/Sentry ergänzt wird.
 */
export function logError(scope: string, err: unknown): void {
  const message =
    err instanceof Error ? err.stack || err.message : String(err);
  console.error(`[${scope}] ${message}`);
}
