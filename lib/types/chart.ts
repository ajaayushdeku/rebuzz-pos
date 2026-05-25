import {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { CurrencyConfig } from "../config/store";

export interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Payload<ValueType, NameType>[];
  currency: CurrencyConfig;
}
export interface DataPoint {
  day: string;
  revenue: number;
  profit?: number;
}
