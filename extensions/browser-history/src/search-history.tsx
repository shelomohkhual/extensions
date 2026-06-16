import { ActionPanel, Action, getPreferenceValues, List, Cache, useNavigation, Icon } from "@raycast/api";
import { useHistorySearch } from "./hooks/useHistorySearch";
import { ReactElement, isValidElement, useState, useCallback, useEffect } from "react";
import { Preferences, SupportedBrowsers, SearchResult } from "./interfaces";
import { BrowserHistoryActions, ListEntries, ConfigureProfilesForm } from "./components";
import { isBrowserInstalled, resolveProfilePaths } from "./util";

function BrowserProfileQuery({
  profileKey,
  browser,
  dbPath,
  searchText,
  onResult,
}: {
  profileKey: string;
  browser: SupportedBrowsers;
  dbPath: string;
  searchText: string;
  onResult: (key: string, res: SearchResult) => void;
}) {
  const result = useHistorySearch(browser, dbPath, searchText);

  useEffect(() => {
    onResult(profileKey, result);
  }, [result.isLoading, result.permissionView, result.data]);

  return null;
}

export default function Command(): ReactElement {
  const preferences = getPreferenceValues<Preferences>();
  const [searchText, setSearchText] = useState<string>();
  const [results, setResults] = useState<Record<string, SearchResult>>({});

  const cache = new Cache();
  const navigation = useNavigation();

  // 1. Determine active/enabled browsers based on selection mode
  const enabledBrowsers = Object.values(SupportedBrowsers).filter((browser) => {
    // Check if skipped/disabled in cache
    if (cache.get(`disabled_${browser}`) === "true") {
      return false;
    }

    if (preferences.browserSelectionMode === "installed") {
      return isBrowserInstalled(browser);
    } else if (preferences.browserSelectionMode === "custom") {
      return preferences[`enable${browser}` as keyof Preferences];
    }

    // Default 'all' selection mode
    return true;
  });

  // 2. Resolve active profiles and database paths
  const activeProfiles = enabledBrowsers.flatMap((browser) => {
    const profiles = resolveProfilePaths(browser);
    return profiles.map((p) => ({
      key: `${browser}-${p.name}`,
      browser,
      profileName: p.name,
      dbPath: p.dbPath,
    }));
  });

  // Sort sections: Priority profile first, then installed ones on top
  if (preferences.firstInResultsMode !== "most_relevant") {
    activeProfiles.sort((a, b) => {
      // Prioritize the browser selected in preferences.firstInResults
      const isPriorityA = a.browser === preferences.firstInResults;
      const isPriorityB = b.browser === preferences.firstInResults;
      if (isPriorityA && !isPriorityB) return -1;
      if (!isPriorityA && isPriorityB) return 1;

      // Sort installed browsers on top
      const isInstA = isBrowserInstalled(a.browser);
      const isInstB = isBrowserInstalled(b.browser);
      if (isInstA && !isInstB) return -1;
      if (!isInstA && isInstB) return 1;

      return a.browser.localeCompare(b.browser);
    });
  }

  // Filter out any stale/inactive results
  const activeResults = Object.fromEntries(
    Object.entries(results).filter(([key]) => activeProfiles.some((p) => p.key === key)),
  );

  // 3. Collect loading states and permission views
  const isLoading =
    Object.values(activeResults).some((r) => r.isLoading) ||
    (activeProfiles.length > 0 && Object.keys(activeResults).length < activeProfiles.length);

  const permissionViews = Object.values(activeResults)
    .map((r) => r.permissionView)
    .filter((v) => v !== undefined && isValidElement(v));

  // If there are permission views, return the first one
  if (permissionViews.length > 0) {
    return permissionViews[0] as ReactElement;
  }

  // Handle callback when result updates
  const handleResult = useCallback((key: string, res: SearchResult) => {
    setResults((prev) => {
      const current = prev[key];
      if (
        current &&
        current.isLoading === res.isLoading &&
        current.permissionView === res.permissionView &&
        JSON.stringify(current.data) === JSON.stringify(res.data)
      ) {
        return prev;
      }
      return { ...prev, [key]: res };
    });
  }, []);

  const openPreferencesAction = <BrowserHistoryActions.OpenPreferences />;
  const openCustomConfigAction = (
    <Action
      icon={Icon.Gear}
      title="Configure Profile Paths"
      shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
      onAction={() => navigation.push(<ConfigureProfilesForm />)}
    />
  );

  // 4. Render output based on firstInResultsMode
  let content;
  if (preferences.firstInResultsMode === "most_relevant") {
    const allEntries = Object.values(activeResults).flatMap((r) => r.data || []);
    allEntries.sort((a, b) => new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime());

    const hasData = allEntries.length > 0;

    content = hasData ? (
      allEntries.map((e) => <ListEntries.HistoryEntry entry={e} key={e.id} />)
    ) : (
      <List.EmptyView
        title={searchText ? `No ${searchText} history found` : "No history found"}
        actions={
          <ActionPanel>
            <Action.OpenInBrowser
              title="Search in Browser"
              url={
                preferences.searchEngine
                  ? preferences.searchEngine.replace(/{{query}}/g, encodeURIComponent(searchText ?? ""))
                  : `https://www.google.com/search?q=${encodeURIComponent(searchText ?? "")}`
              }
            />
            {openCustomConfigAction}
            {openPreferencesAction}
          </ActionPanel>
        }
      />
    );
  } else {
    // specific_browser mode (grouped sections)
    const hasData = Object.values(activeResults).some((r) => (r.data?.length ?? 0) > 0);

    content = hasData ? (
      activeProfiles.map((p) => {
        const res = activeResults[p.key];
        if (!res || !res.data || res.data.length === 0) return null;
        return (
          <List.Section title={p.profileName === "Default" ? p.browser : `${p.browser} (${p.profileName})`} key={p.key}>
            {res.data.map((e) => (
              <ListEntries.HistoryEntry entry={e} key={e.id} />
            ))}
          </List.Section>
        );
      })
    ) : (
      <List.EmptyView
        title={searchText ? `No ${searchText} history found` : "No history found"}
        actions={
          <ActionPanel>
            <Action.OpenInBrowser
              title="Search in Browser"
              url={
                preferences.searchEngine
                  ? preferences.searchEngine.replace(/{{query}}/g, encodeURIComponent(searchText ?? ""))
                  : `https://www.google.com/search?q=${encodeURIComponent(searchText ?? "")}`
              }
            />
            {openCustomConfigAction}
            {openPreferencesAction}
          </ActionPanel>
        }
      />
    );
  }

  const enabled = enabledBrowsers.length > 0;

  return (
    <List onSearchTextChange={setSearchText} isLoading={isLoading} throttle={false}>
      {/* Hidden query components */}
      {activeProfiles.map((p) => (
        <BrowserProfileQuery
          key={p.key}
          profileKey={p.key}
          browser={p.browser}
          dbPath={p.dbPath}
          searchText={searchText ?? ""}
          onResult={handleResult}
        />
      ))}

      {!enabled ? (
        <List.EmptyView
          title="You haven't enabled or installed any browsers yet"
          description="You can choose which browsers history to integrate in preferences or configuration"
          icon={"icon-small.png"}
          actions={
            <ActionPanel>
              {openCustomConfigAction}
              {openPreferencesAction}
            </ActionPanel>
          }
        />
      ) : (
        content
      )}
    </List>
  );
}
