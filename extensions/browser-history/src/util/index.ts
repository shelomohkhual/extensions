import fs, { readFileSync } from "fs";
import path, { resolve } from "path";
import { homedir } from "os";
import { ChatGPTAtlasLocalState, Preferences, SupportedBrowsers } from "../interfaces";
import { getPreferenceValues, Cache } from "@raycast/api";
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

const userLibraryDirectoryPath = () => {
  if (!process.env.HOME) {
    throw new Error("$HOME environment variable is not set.");
  }

  return path.join(process.env.HOME, "Library");
};

const getProfileName = (userDirectoryPath: string, browser: SupportedBrowsers) => {
  let profiles;
  switch (browser) {
    case SupportedBrowsers.Firefox: {
      if (!fs.existsSync(userDirectoryPath)) {
        return "";
      }
      try {
        profiles = fs.readdirSync(userDirectoryPath);
        // Look for .default-release first
        let profile = profiles.find((p) => p.endsWith(".default-release"));
        if (profile) return profile;

        // Then .default
        profile = profiles.find((p) => p.endsWith(".default"));
        if (profile) return profile;

        // Fallback to any directory that is not a hidden dotfile
        profile = profiles.find((p) => {
          if (p.startsWith(".")) return false;
          try {
            return fs.statSync(path.join(userDirectoryPath, p)).isDirectory();
          } catch {
            return false;
          }
        });
        return profile || "";
      } catch (error) {
        console.error("Error reading Firefox profiles directory:", error);
        return "";
      }
    }
    default:
      return "Default";
  }
};

const cache = new Cache();

const getDbFileName = (browser: SupportedBrowsers): string => {
  if (browser === SupportedBrowsers.Firefox) {
    return "places.sqlite";
  }
  if (browser === SupportedBrowsers.Safari) {
    return "History.db";
  }
  if (browser === SupportedBrowsers.Orion) {
    return "history";
  }
  return "History";
};

export const getCustomProfilePath = (browser: SupportedBrowsers): string | undefined => {
  return cache.get(`profilePath_${browser}`);
};

export const getCustomProfileMode = (browser: SupportedBrowsers): string | undefined => {
  return cache.get(`profileMode_${browser}`);
};

export const isBrowserInstalled = (browser: SupportedBrowsers): boolean => {
  const userDataDirectory = userLibraryDirectoryPath();
  let checkPath = "";
  switch (browser) {
    case SupportedBrowsers.Chrome:
      checkPath = path.join(userDataDirectory, "Application Support", "Google", "Chrome");
      break;
    case SupportedBrowsers.Firefox:
      checkPath = path.join(userDataDirectory, "Application Support", "Firefox");
      break;
    case SupportedBrowsers.Safari:
      checkPath = path.join(userDataDirectory, "Safari");
      break;
    case SupportedBrowsers.Edge:
      checkPath = path.join(userDataDirectory, "Application Support", "Microsoft Edge");
      break;
    case SupportedBrowsers.Brave:
      checkPath = path.join(userDataDirectory, "Application Support", "BraveSoftware", "Brave-Browser");
      break;
    case SupportedBrowsers.Vivaldi:
      checkPath = path.join(userDataDirectory, "Application Support", "Vivaldi");
      break;
    case SupportedBrowsers.Arc:
      checkPath = path.join(userDataDirectory, "Application Support", "Arc");
      break;
    case SupportedBrowsers.Opera:
      checkPath = path.join(userDataDirectory, "Application Support", "com.operasoftware.Opera");
      break;
    case SupportedBrowsers.Iridium:
      checkPath = path.join(userDataDirectory, "Application Support", "Iridium");
      break;
    case SupportedBrowsers.Orion:
      checkPath = path.join(userDataDirectory, "Application Support", "Orion");
      break;
    case SupportedBrowsers.Sidekick:
      checkPath = path.join(userDataDirectory, "Application Support", "Sidekick");
      break;
    case SupportedBrowsers.Dia:
      checkPath = path.join(userDataDirectory, "Application Support", "Dia");
      break;
    case SupportedBrowsers.Helium:
      checkPath = path.join(userDataDirectory, "Application Support", "Helium");
      break;
    case SupportedBrowsers.Comet:
      checkPath = path.join(userDataDirectory, "Application Support", "Comet");
      break;
    case SupportedBrowsers.ChatGPTAtlas:
      checkPath = path.join(userDataDirectory, "Application Support", "com.openai.atlas");
      break;
    default:
      return false;
  }
  return fs.existsSync(checkPath);
};

export const getHistoryDbPath = (browser: SupportedBrowsers): string => {
  const customPath = getCustomProfilePath(browser);
  if (customPath) {
    const dbFileName = getDbFileName(browser);
    if (customPath.endsWith(dbFileName)) {
      return customPath;
    }
    return path.join(customPath, dbFileName);
  }
  const {
    profilePathChrome,
    profilePathFirefox,
    profilePathSafari,
    profilePathEdge,
    profilePathBrave,
    profilePathVivaldi,
    profilePathArc,
    profilePathOpera,
    profilePathIridium,
    profilePathOrion,
    profilePathSidekick,
    profilePathDia,
    profilePathHelium,
    profilePathComet,
    profilePathChatGPTAtlas,
  } = getPreferenceValues<Preferences>();
  const userDataDirectory = userLibraryDirectoryPath();
  let profilePath, profileName;

  switch (browser) {
    case SupportedBrowsers.Chrome:
      return profilePathChrome
        ? path.join(profilePathChrome, "History")
        : path.join(userDataDirectory, ...defaultProfilePathChrome);
    case SupportedBrowsers.Firefox:
      if (profilePathFirefox) {
        profilePath = profilePathFirefox;
      } else {
        profilePath = path.join(userDataDirectory, ...defaultProfilePathFirefox);
        profileName = getProfileName(profilePath, browser);
        profilePath = path.join(profilePath, profileName);
      }
      return path.join(profilePath, "places.sqlite");
    case SupportedBrowsers.Safari:
      return profilePathSafari
        ? path.join(profilePathSafari, "History.db")
        : path.join(userDataDirectory, ...defaultProfilePathSafari);
    case SupportedBrowsers.Edge:
      return profilePathEdge
        ? path.join(profilePathEdge, "History")
        : path.join(userDataDirectory, ...defaultProfilePathEdge);
    case SupportedBrowsers.Brave:
      return profilePathBrave
        ? path.join(profilePathBrave, "History")
        : path.join(userDataDirectory, ...defaultProfilePathBrave);
    case SupportedBrowsers.Vivaldi:
      return profilePathVivaldi
        ? path.join(profilePathVivaldi, "History")
        : path.join(userDataDirectory, ...defaultProfilePathVivaldi);
    case SupportedBrowsers.Arc:
      return profilePathArc
        ? path.join(profilePathArc, "History")
        : path.join(userDataDirectory, ...defaultProfilePathArc);
    case SupportedBrowsers.Opera:
      return profilePathOpera
        ? path.join(profilePathOpera, "History")
        : path.join(userDataDirectory, ...defaultProfilePathOpera);
    case SupportedBrowsers.Iridium:
      return profilePathIridium
        ? path.join(profilePathIridium, "History")
        : path.join(userDataDirectory, ...defaultProfilePathIridium);
    case SupportedBrowsers.Orion:
      return profilePathOrion
        ? path.join(profilePathOrion, "history")
        : path.join(userDataDirectory, ...defaultProfilePathOrion);
    case SupportedBrowsers.Sidekick:
      return profilePathSidekick
        ? path.join(profilePathSidekick, "History")
        : path.join(userDataDirectory, ...defaultProfilePathSidekick);
    case SupportedBrowsers.Dia:
      return profilePathDia
        ? path.join(profilePathDia, "History")
        : path.join(userDataDirectory, ...defaultProfilePathDia);
    case SupportedBrowsers.Helium:
      return profilePathHelium
        ? path.join(profilePathHelium, "History")
        : path.join(userDataDirectory, ...defaultProfilePathHelium);
    case SupportedBrowsers.Comet:
      return profilePathComet
        ? path.join(profilePathComet, "History")
        : path.join(userDataDirectory, ...defaultProfilePathComet);
    case SupportedBrowsers.ChatGPTAtlas: {
      const localStatePath = resolve(
        homedir(),
        "Library/Application Support/com.openai.atlas/browser-data/host/Local State",
      );

      let lastUsedProfile = "Default";
      try {
        const fileContent = readFileSync(localStatePath, "utf-8");
        const localState: ChatGPTAtlasLocalState = JSON.parse(fileContent);

        // Get the last used profile
        lastUsedProfile = localState.profile.last_used;
      } catch (error) {
        console.error("Error reading local state file:", error);
      }

      return profilePathChatGPTAtlas
        ? path.join(profilePathChatGPTAtlas, "History")
        : path.join(userDataDirectory, ...defaultProfilePathChatGPTAtlas).replace("Default", lastUsedProfile);
    }
    default:
      throw new Error("Unsupported browser.");
  }
};

export const getHistoryTable = (browser: SupportedBrowsers): string => {
  switch (browser) {
    case SupportedBrowsers.Firefox:
      return "moz_places";
    case SupportedBrowsers.Safari:
    case SupportedBrowsers.Orion:
      return "history_items";
    default:
      return "urls";
  }
};

export const getHistoryDateColumn = (browser: SupportedBrowsers): string => {
  switch (browser) {
    case SupportedBrowsers.Firefox:
      return "last_visit_date";
    case SupportedBrowsers.Safari:
      return "visit_time";
    case SupportedBrowsers.Orion:
      return "LAST_VISIT_TIME";
    default:
      return "last_visit_time";
  }
};

export const resolveProfilePaths = (browser: SupportedBrowsers): { name: string; dbPath: string }[] => {
  const customPath = getCustomProfilePath(browser);
  const profileMode = getCustomProfileMode(browser) || "default";

  const userDataDirectory = userLibraryDirectoryPath();
  const dbFileName = getDbFileName(browser);

  let basePath = "";
  switch (browser) {
    case SupportedBrowsers.Safari:
      return [{ name: "Default", dbPath: getHistoryDbPath(browser) }];
    case SupportedBrowsers.Firefox:
      basePath = customPath || path.join(userDataDirectory, ...defaultProfilePathFirefox);
      break;
    case SupportedBrowsers.Chrome:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathChrome.slice(0, -2));
      break;
    case SupportedBrowsers.Edge:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathEdge.slice(0, -2));
      break;
    case SupportedBrowsers.Brave:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathBrave.slice(0, -2));
      break;
    case SupportedBrowsers.Vivaldi:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathVivaldi.slice(0, -2));
      break;
    case SupportedBrowsers.Arc:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathArc.slice(0, -2));
      break;
    case SupportedBrowsers.Opera:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathOpera.slice(0, -1));
      break;
    case SupportedBrowsers.Iridium:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathIridium.slice(0, -2));
      break;
    case SupportedBrowsers.Orion:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathOrion.slice(0, -2));
      break;
    case SupportedBrowsers.Sidekick:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathSidekick.slice(0, -2));
      break;
    case SupportedBrowsers.Dia:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathDia.slice(0, -2));
      break;
    case SupportedBrowsers.Helium:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathHelium.slice(0, -2));
      break;
    case SupportedBrowsers.Comet:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathComet.slice(0, -2));
      break;
    case SupportedBrowsers.ChatGPTAtlas:
      basePath = customPath
        ? path.dirname(customPath)
        : path.join(userDataDirectory, ...defaultProfilePathChatGPTAtlas.slice(0, -2));
      break;
    default:
      return [];
  }

  if (browser === SupportedBrowsers.Firefox && customPath) {
    if (fs.existsSync(customPath)) {
      const isDir = fs.statSync(customPath).isDirectory();
      if (isDir) {
        const dbFile = path.join(customPath, dbFileName);
        if (fs.existsSync(dbFile)) {
          return [{ name: path.basename(customPath), dbPath: dbFile }];
        }
      }
    }
  }

  if (customPath) {
    if (customPath.endsWith("*")) {
      basePath = customPath.replace(/\*$/, "");
      return scanProfilesDir(basePath, dbFileName);
    }

    const match = customPath.match(/(.*)\{(.*)\}(.*)/);
    if (match) {
      const prefix = match[1];
      const choices = match[2].split(",").map((c) => c.trim());
      const suffix = match[3];

      const profiles: { name: string; dbPath: string }[] = [];
      for (const choice of choices) {
        const profilePathDir = prefix + choice + suffix;
        const dbPath = profilePathDir.endsWith(dbFileName) ? profilePathDir : path.join(profilePathDir, dbFileName);
        if (fs.existsSync(dbPath)) {
          profiles.push({ name: choice, dbPath });
        }
      }
      return profiles;
    }
  }

  if (profileMode === "all") {
    return scanProfilesDir(basePath, dbFileName);
  }

  const defaultDbPath = getHistoryDbPath(browser);
  if (fs.existsSync(defaultDbPath)) {
    let name = "Default";
    if (browser === SupportedBrowsers.Firefox) {
      name = path.basename(path.dirname(defaultDbPath));
    }
    return [{ name, dbPath: defaultDbPath }];
  }

  return [];
};

const scanProfilesDir = (basePath: string, dbFileName: string): { name: string; dbPath: string }[] => {
  if (!fs.existsSync(basePath)) return [];
  try {
    const files = fs.readdirSync(basePath);
    const profiles: { name: string; dbPath: string }[] = [];

    for (const file of files) {
      if (file.startsWith(".")) continue;
      const profilePathDir = path.join(basePath, file);

      try {
        if (fs.statSync(profilePathDir).isDirectory()) {
          const dbPath = path.join(profilePathDir, dbFileName);
          if (fs.existsSync(dbPath)) {
            profiles.push({ name: file, dbPath });
          }
        }
      } catch {
        // ignore
      }
    }
    return profiles;
  } catch {
    return [];
  }
};
