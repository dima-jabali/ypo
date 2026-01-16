import { HighlightStringWithFilterRegex } from "./highlight-string-with-filter-regex";

export function Link({ title, href }: { title: string; href: string }) {
  return (
    <a
      className="link hover:underline truncate max-h-full break-all text-left group-data-[is-drawer]/drawer:font-bold group-data-[is-drawer]/drawer:text-base group-data-[is-drawer]/drawer:link"
      rel="noopener noreferrer"
      target="_blank"
      href={href}
    >
      <HighlightStringWithFilterRegex string={title} withLink={false} />
    </a>
  );
}
