import { Action, ActionPanel, Detail, open } from "@raycast/api";
import { SupportedBrowsers } from "../../interfaces";

export function DatabasePermissionError({ browser }: { browser: SupportedBrowsers }) {
  const markdown = `
# 🚨 Full Disk Access Required for ${browser} History

This extension needs permission to access the **${browser}** history database. Due to macOS security restrictions, Raycast must be granted **Full Disk Access** to read local browser data files.

## How to grant permissions:

1. Click the **Open System Settings** action below (or manually open **System Settings > Privacy & Security > Full Disk Access**).
2. Locate **Raycast** in the list and toggle it **ON**.
3. **If Raycast is already toggled ON:** Toggle it **OFF**, wait 2 seconds, and toggle it back **ON** (this resolves a common macOS permission bug where permissions get desynchronized).
4. **Restart Raycast** by pressing \`Cmd + Q\` and launching it again.
`;

  return (
    <Detail
      actions={
        <ActionPanel>
          <Action
            title="Open System Settings"
            onAction={async () => {
              await open("x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles");
            }}
          />
        </ActionPanel>
      }
      markdown={markdown}
    />
  );
}
