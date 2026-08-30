import { HelpCircle } from "lucide-react";
import { Button } from "../ui/button";

export default function HelpButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="bg-blue-100/30 border border-[3px] border-blue-100 p-4 "
    >
      <HelpCircle className="md:h-5 md:w-5 h-10 w-10 text-gray-600" />
    </Button>
  );
}
