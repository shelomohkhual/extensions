import { useState } from "react";
import { ActionPanel, Detail, showToast, Toast, Cache, useNavigation } from "@raycast/api";
import { execSync } from "child_process";
import { SupportedBrowsers } from "../../interfaces";
import { DEFAULT_ERROR_TITLE, DOWNLOAD_TEXT, INSTALL_COMMAND } from "../../constants";

export function NotInstalledError({ browser }: { browser: SupportedBrowsers }) {
  const [isLoading, setIsLoading] = useState(false);
  const { pop } = useNavigation();
  const cache = new Cache();

  return (
    <Detail
      actions={
        <ActionPanel>
          <ActionPanel.Item
            title="Skip & Disable Browser"
            onAction={async () => {
              cache.set(`disabled_${browser}`, "true");
              await showToast(Toast.Style.Success, "Browser Disabled", `${browser} has been disabled.`);
              pop();
            }}
          />
          {!isLoading && INSTALL_COMMAND[browser] !== undefined && (
            <ActionPanel.Item
              title="Install with Homebrew"
              onAction={async () => {
                if (isLoading) return;

                setIsLoading(true);

                const toast = new Toast({ style: Toast.Style.Animated, title: "Installing..." });
                await toast.show();

                try {
                  execSync(INSTALL_COMMAND[browser] !== undefined ? INSTALL_COMMAND[browser] || "" : "");
                  await toast.hide();
                } catch {
                  await toast.hide();
                  await showToast(
                    Toast.Style.Failure,
                    DEFAULT_ERROR_TITLE,
                    "An unknown error occurred while trying to install",
                  );
                }
                setIsLoading(false);
              }}
            />
          )}
        </ActionPanel>
      }
      markdown={DOWNLOAD_TEXT[browser]}
    />
  );
}
