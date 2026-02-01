import { Tooltip as TooltipBase } from "headless-tooltip";
export const Tooltip = ({ children, ...props }: any) => {
  if (!props.content) {
    return <>{children}</>;
  }
  return (
    <TooltipBase arrow={true} className="px-3 py-2 text-xs font-normal text-white bg-gray-900 rounded-full min-w-10 max-w-80" arrowClassName="bg-gray-900" placement="top" {...props}>
      {children}
    </TooltipBase>
  );
};
