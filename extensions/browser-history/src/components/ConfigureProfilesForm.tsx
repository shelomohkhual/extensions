import { Form, ActionPanel, Action, useNavigation, showToast, Toast, Cache } from "@raycast/api";
import { SupportedBrowsers } from "../interfaces";
import { isBrowserInstalled, getCustomProfilePath, getCustomProfileMode } from "../util";
import { homedir } from "os";
import path from "path";
import { Fragment } from "react";
import {
  defaultProfilePathArc,
  defaultProfilePathBrave,
  defaultProfilePathChrome,
  defaultProfilePathEdge,
  defaultProfilePathFirefox,
  defaultProfilePathIridium,
  defaultProfilePathOpera,
  defaultProfilePathSafari,
  defaultProfilePathVivaldi,
  defaultProfilePathOrion,
  defaultProfilePathSidekick,
  defaultProfilePathDia,
  defaultProfilePathHelium,
  defaultProfilePathComet,
  defaultProfilePathChatGPTAtlas,
} from "../constants";

const cache = new Cache();

const getDefaultPathOnDisk = (browser: SupportedBrowsers): string => {
  const home = homedir();
  const library = path.join(home, "Library");
  switch (browser) {
    case SupportedBrowsers.Chrome:
      return path.join(library, ...defaultProfilePathChrome);
    case SupportedBrowsers.Firefox:
      return path.join(library, ...defaultProfilePathFirefox);
    case SupportedBrowsers.Safari:
      return path.join(library, ...defaultProfilePathSafari);
    case SupportedBrowsers.Edge:
      return path.join(library, ...defaultProfilePathEdge);
    case SupportedBrowsers.Brave:
      return path.join(library, ...defaultProfilePathBrave);
    case SupportedBrowsers.Vivaldi:
      return path.join(library, ...defaultProfilePathVivaldi);
    case SupportedBrowsers.Arc:
      return path.join(library, ...defaultProfilePathArc);
    case SupportedBrowsers.Opera:
      return path.join(library, ...defaultProfilePathOpera);
    case SupportedBrowsers.Iridium:
      return path.join(library, ...defaultProfilePathIridium);
    case SupportedBrowsers.Orion:
      return path.join(library, ...defaultProfilePathOrion);
    case SupportedBrowsers.Sidekick:
      return path.join(library, ...defaultProfilePathSidekick);
    case SupportedBrowsers.Dia:
      return path.join(library, ...defaultProfilePathDia);
    case SupportedBrowsers.Helium:
      return path.join(library, ...defaultProfilePathHelium);
    case SupportedBrowsers.Comet:
      return path.join(library, ...defaultProfilePathComet);
    case SupportedBrowsers.ChatGPTAtlas:
      return path.join(library, ...defaultProfilePathChatGPTAtlas);
    default:
      return "";
  }
};

export function ConfigureProfilesForm() {
  const { pop } = useNavigation();

  const handleSave = (values: Record<string, string>) => {
    Object.entries(values).forEach(([key, val]) => {
      if (val !== undefined) {
        cache.set(key, val);
      }
    });
    showToast(Toast.Style.Success, "Preferences Saved", "Custom profile configurations updated successfully.");
    pop();
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Configuration" onSubmit={handleSave} />
        </ActionPanel>
      }
    >
      {Object.values(SupportedBrowsers).map((browser, index) => {
        const installed = isBrowserInstalled(browser);
        const hasProfiles = browser !== SupportedBrowsers.Safari;

        const cachedPath = getCustomProfilePath(browser);
        const cachedMode = getCustomProfileMode(browser) || "default";
        const defaultPath = cachedPath || getDefaultPathOnDisk(browser);

        return (
          <Fragment key={browser}>
            {index > 0 && <Form.Separator />}

            {installed ? (
              <>
                {hasProfiles && (
                  <Form.Dropdown id={`profileMode_${browser}`} title={`${browser} Profiles`} defaultValue={cachedMode}>
                    <Form.Dropdown.Item value="default" title="Default / Custom Profile" />
                    <Form.Dropdown.Item value="all" title="All Profiles" />
                  </Form.Dropdown>
                )}
                <Form.TextField
                  id={`profilePath_${browser}`}
                  title={`${browser} Profile Path`}
                  defaultValue={defaultPath}
                  placeholder={`Path to ${browser} profile`}
                  info={
                    hasProfiles
                      ? "Use '/*' for all profiles (e.g. Chrome/*) or brace expansion for multiple select (e.g. Chrome/{Default,Profile 1})"
                      : "Path to Safari history database file."
                  }
                />
              </>
            ) : (
              <>
                <Form.Description title={browser} text={`Not Installed (Default Path: ${defaultPath})`} />
              </>
            )}
          </Fragment>
        );
      })}
    </Form>
  );
}
