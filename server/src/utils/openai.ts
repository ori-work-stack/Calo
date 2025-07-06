export function extractCleanJSON(content: string): string {
  // Remove leading/trailing code fences if present
  const withoutCodeFences = content
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  // If it looks like an object or array, return directly
  const jsonMatch = withoutCodeFences.match(/({[\s\S]*}|\[[\s\S]*])/);
  return jsonMatch ? jsonMatch[0] : withoutCodeFences;
}
