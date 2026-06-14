import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

const DeleteConfirmModal = ({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  isPending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onConfirm: () => void;
  isPending?: boolean;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 py-2">{message}</p>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-sm rounded-lg"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin mr-1.5" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmModal;
