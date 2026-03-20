import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SkipMealModalProps {
  onConfirm: () => void;
}

export const SkipMealModal = ({ onConfirm }: SkipMealModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Skip
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skip this meal?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          You can skip this meal until the change window closes.
        </p>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button onClick={onConfirm}>Confirm skip</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
