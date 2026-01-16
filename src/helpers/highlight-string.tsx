export function highlightString(
  string: string,
  regex: RegExp | undefined,
  className?: string,
  wrapperClassName?: string,
) {
  if (!regex) {
    return string;
  }

  regex.lastIndex = 0;

  const matches = string.match(regex);

  if (!matches) {
    return string;
  }

  const strings = string.split(regex);
  const size = strings.length - 1;

  const jsxs = strings.map((string, index) =>
    index < size ? (
      <span className={className ?? "whitespace-pre"} key={index}>
        {string}

        <mark>{matches[index]}</mark>
      </span>
    ) : (
      <span className={className ?? "whitespace-pre"} key={index}>
        {string}
      </span>
    ),
  );

  return (
    <span className={wrapperClassName ?? "truncate"} key="-1">
      {jsxs}
    </span>
  );
}
