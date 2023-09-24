export function truncateMiddle(str: string, width = 80, delimiter = " ... ") {
  if (str.length < width) return str;

  const leftHalf = str.slice(0, width / 2 - delimiter.length / 2);
  const rightHalf = str.slice(str.length - width / 2 - delimiter.length / 2, str.length);

  return leftHalf + delimiter + rightHalf;
}

export function truncateSmart(str: string, width = 80, preferredChars = ["/"], delimiter = "...") {
  if (str.length < width) return str;

  for (const char of preferredChars) {
    const index = str.indexOf(char);
    if (index + 1 < width / 2 - delimiter.length / 2) {
      const leftHalf = str.slice(0, index + 1);

      const rightHalf = str.slice(
        str.length - (width - leftHalf.length - delimiter.length),
        str.length,
      );
      return leftHalf + delimiter + rightHalf;
    }
  }

  return truncateMiddle(str, width, delimiter);
}
