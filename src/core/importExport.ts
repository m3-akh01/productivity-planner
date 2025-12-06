import { ZodError } from 'zod';
import { appDataSchema, CURRENT_SCHEMA_VERSION } from '../store/schema';
import { AppData } from '../store/types';

export const EXPORT_FILENAME = 'productivity-planner-export.json';

export function serializeAppData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

const summarizeZodError = (error: ZodError) => {
  const issues = error.issues.slice(0, 3).map((issue) => {
    const path = issue.path.join('.') || '(root)';
    return `${path}: ${issue.message}`;
  });
  const extras = error.issues.length > 3 ? ` (+${error.issues.length - 3} more issues)` : '';
  return `${issues.join('; ')}${extras}`;
};

export function parseAppDataJson(json: string): AppData {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error('Import failed: Invalid JSON file');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Import failed: Expected a JSON object');
  }

  const version = (parsed as { schemaVersion?: unknown }).schemaVersion;
  if (version !== CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Import failed: Unsupported schemaVersion ${String(version)} (expected ${CURRENT_SCHEMA_VERSION})`,
    );
  }

  const result = appDataSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Import failed: ${summarizeZodError(result.error)}`);
  }

  return result.data;
}
