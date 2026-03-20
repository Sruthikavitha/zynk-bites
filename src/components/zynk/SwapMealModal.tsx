import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SwapMealModalProps {
  options: string[];
  onConfirm: (option: string) => void;
}

export const SwapMealModal = ({ options, onConfirm }: SwapMealModalProps) => {
  const [selected, setSelected] = useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Swap</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Swap this meal</DialogTitle>
        </DialogHeader>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an alternative" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button
            onClick={() => {
              if (selected) {
                onConfirm(selected);
              }
            }}
          >
            Confirm swap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
