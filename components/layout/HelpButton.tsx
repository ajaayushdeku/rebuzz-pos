import { HelpCircle } from "lucide-react";
import { Button } from "../ui/button";

export default function HelpButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="bg-blue-100"
    >
      <HelpCircle className="md:h-5 md:w-5 h-3 w-3 text-gray-600" />
    </Button>
  );
}
