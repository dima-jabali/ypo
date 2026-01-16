import { classNames } from "#/helpers/class-names";

type Props = React.HTMLAttributes<HTMLSpanElement>;

export const ColorBadge: React.FC<Props> = ({ className, ...rest }) => {
  return (
    <span
      className={classNames(
        "text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm box-decoration-clone text-center",
        className,
      )}
      {...rest}
    />
  );
};
