import { TranslationDictionary } from './translations';

/**
 * Builds the localized "2 Kadın, 1 Erkek" style summary from structured counts,
 * so it re-renders correctly in every site language instead of staying frozen
 * in whatever language the poster originally typed it in.
 */
export function formatGenderDistribution(
  femaleCount: number | undefined,
  maleCount: number | undefined,
  t: TranslationDictionary
): string {
  const parts: string[] = [];
  if (femaleCount) parts.push(`${femaleCount} ${t.genderCountFemale}`);
  if (maleCount) parts.push(`${maleCount} ${t.genderCountMale}`);
  return parts.length > 0 ? parts.join(', ') : t.genderAny;
}
