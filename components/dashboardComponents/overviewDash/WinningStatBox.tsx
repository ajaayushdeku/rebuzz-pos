import { LucideIcon } from "lucide-react";

export interface WinningStatBoxProps {
  label: string;
  value: string;
  footer?: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
}

const WinningStatBox = ({
  label,
  value,
  footer,
  icon: Icon,
  iconColor,
  bgColor,
}: WinningStatBoxProps) => {
  return (
    <div
      className={`w-full md:px-6 px-3 md:py-3 py-2 ${bgColor} shadow-md hover:shadow-lg  rounded-lg`}
    >
      <span className="md:text-[14px] text-[10px] text-gray-300">{label}</span>
      <div className="flex items-center justify-between mt-4 md:mt-8">
        <div>
          <span className="font-bold text-[16px] md:text-xl text-gray-100">
            {value}
          </span>
          <p className="md:text-[14px] text-[10px] text-gray-300">{footer}</p>
        </div>
        <Icon className={`${iconColor} shrink-0`} />
      </div>
    </div>
  );
};

export default WinningStatBox;
{
  /* PEAK HOURS */
}
{
  /* <div className="w-full px-6 py-4 shadow-md shadow-purple-600 bg-purple-500 rounded-lg">
        <span className="text-[14px] text-gray-300">
          PEAK HOUR
        </span>
        <div className="flex items-center justify-between mt-8">
          <div>
            <span className="font-bold text-xl text-gray-100">
              10:00 AM - 11:00 AM
            </span>
            <p className="text-[14px] text-gray-300">
              Busiest window of the day
            </p>
          </div>
          <Clock className="text-gray-100" />
        </div>
      </div>
      {/* BEST DAY */
}
{
  /* <div className="w-full  px-6 py-4 bg-green-700 shadow-green-800 shadow-md rounded-lg">
        <span className="text-[14px] text-gray-300">
          BEST DAY OF THE WEEK
        </span>
        <div className="flex items-center justify-between mt-8">
          <div>
            <span className="font-bold text-xl text-gray-100">
              SATURDAY
            </span>
            <p className="text-[14px] text-gray-300">
              Average 40% above daily mean
            </p>
          </div>
          <Star className="text-amber-300" />
        </div>
      </div>  */
}
