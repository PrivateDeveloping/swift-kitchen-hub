import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRESETS = ["Out of stock", "Too far", "Closing soon", "Other"];

type Props = {
  orderNumber: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
};

export function DeclineDialog({ orderNumber, open, onOpenChange, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setReason("");
      setActivePreset(null);
    }
    onOpenChange(v);
  };

  const pickPreset = (preset: string) => {
    setActivePreset(preset);
    if (preset !== "Other") setReason(preset);
    else setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline order {orderNumber ? `#${orderNumber}` : ""}</DialogTitle>
          <DialogDescription>
            Optionally provide a reason. The customer will be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Badge
                key={preset}
                variant={activePreset === preset ? "default" : "outline"}
                className={cn("cursor-pointer px-3 py-1.5 text-xs")}
                onClick={() => pickPreset(preset)}
              >
                {preset}
              </Badge>
            ))}
          </div>
          <Textarea
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm(reason.trim());
              handleOpenChange(false);
            }}
          >
            Confirm decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
