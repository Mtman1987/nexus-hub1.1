
"use client";

import { CommandCenterControl } from "@/components/dashboard/command-center-control";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useControlPanel } from "@/context/ControlPanelContext";

export function ControlPanel() {
  const { isPanelOpen, setPanelOpen } = useControlPanel();

  return (
    <Drawer
      open={isPanelOpen}
      onOpenChange={setPanelOpen}
      direction="right"
    >
      <DrawerContent className="w-96 p-0">
          <CommandCenterControl isPoppedOut={true} />
      </DrawerContent>
    </Drawer>
  );
}

    