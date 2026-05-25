import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

export default function AlertCard() {
  return (
    <Alert className="flex-1 ml-8 bg-blue-50 border-blue-200">
      <AlertDescription className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="bg-[#003D82] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              Bank Payment
            </div>
            <div className="bg-[#006FCF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              American Express
            </div>
            <div className="bg-linear-to-r from-[#EB001B] to-[#F79E1B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              Mastercard
            </div>
            <div className="bg-[#1434CB] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              VISA
            </div>
          </div>
        </div>
        <span className="text-gray-700">
          Invoices get paid 3x faster with online
          payments.{" "}
          <a
            href="#"
            className="text-blue-600 hover:underline font-medium"
          >
            Turn on Payments
          </a>
        </span>
      </AlertDescription>
    </Alert>
  );
}
