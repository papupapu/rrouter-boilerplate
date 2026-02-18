import type { FC, ComponentPropsWithoutRef } from "react";

// Generic type for any <svg> React component
type SvgIconComponent = FC<ComponentPropsWithoutRef<"svg">>;

interface IconProps {
  name?: SvgIconComponent | null;
  className?: string;
  stroke?: boolean;
  "aria-hidden"?: boolean | null;
}

const Icon: FC<IconProps> = ({
  name = null,
  className = "",
  stroke = false,
  "aria-hidden": ariaHidden = null,
}) => {
  if (!name) {
    return null;
  }

  const IconComponent = name;

  return (
    <IconComponent
      className={className}
      stroke={stroke ? "currentColor" : undefined}
      aria-hidden={ariaHidden ?? undefined}
    />
  );
};

export default Icon;
