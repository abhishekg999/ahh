export type SemverString = `${number}.${number}.${number}`;
export type SemverOperator = "<" | "<=" | ">" | ">=";

export function semverCompare(
  version1: SemverString,
  version2: SemverString,
  operator: SemverOperator
): boolean {
  const [major1, minor1, patch1] = version1.split(".").map(Number);
  const [major2, minor2, patch2] = version2.split(".").map(Number);

  switch (operator) {
    case "<":
      return (
        major1 < major2 ||
        (major1 === major2 &&
          (minor1 < minor2 || (minor1 === minor2 && patch1 < patch2)))
      );
    case "<=":
      return (
        major1 < major2 ||
        (major1 === major2 &&
          (minor1 < minor2 || (minor1 === minor2 && patch1 <= patch2)))
      );
    case ">":
      return (
        major1 > major2 ||
        (major1 === major2 &&
          (minor1 > minor2 || (minor1 === minor2 && patch1 > patch2)))
      );
    case ">=":
      return (
        major1 > major2 ||
        (major1 === major2 &&
          (minor1 > minor2 || (minor1 === minor2 && patch1 >= patch2)))
      );
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

export function isSemver(version: string): version is SemverString {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  return semverRegex.test(version);
}
