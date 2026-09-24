import { ReactNode } from "react";

export const ComponentHeader = ({
  title,
  subHeader,
  titleColor = "text-gray-900",
}: {
  title: ReactNode;
  subHeader: ReactNode;
  titleColor?: string;
}) => {
  return (
    <div>
      <h2
        className={`text-[15px] font-semibold tracking-[0.5px] ${titleColor}`}
      >
        {title}
      </h2>
      <p className="text-xs text-gray-400 mt-0.5  tracking-[0.5px] ">
        {subHeader}
      </p>
    </div>
  );
};
