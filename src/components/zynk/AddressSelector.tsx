import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddressSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const presetAddresses = [
  "Home - JP Nagar",
  "Office - Indiranagar",
  "Parents - Koramangala",
];

export const AddressSelector = ({ value, onChange }: AddressSelectorProps) => {
  const [customAddress, setCustomAddress] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11">
          <SelectValue placeholder="Select delivery address" />
        </SelectTrigger>
        <SelectContent>
          {presetAddresses.map((address) => (
            <SelectItem key={address} value={address}>
              {address}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Edit address
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update address</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={customAddress}
              onChange={(event) => setCustomAddress(event.target.value)}
              placeholder="Enter your address"
            />
            <Button
              onClick={() => {
                if (customAddress.trim()) {
                  onChange(customAddress.trim());
                }
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
