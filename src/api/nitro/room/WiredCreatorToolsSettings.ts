export interface WiredCreatorToolsSettingsState
{
    showToolbar: boolean;
    showInspectButton: boolean;
    playtestingMode: boolean;
    handitemPassingBlocked: boolean;
}

export const WIRED_CREATOR_TOOLS_SETTINGS_EVENT = 'nitro-wired-creator-tools-settings';

const DEFAULT_SETTINGS: WiredCreatorToolsSettingsState = {
    showToolbar: true,
    showInspectButton: true,
    playtestingMode: false,
    handitemPassingBlocked: false
};

const KEY = '__nitroWiredCreatorToolsSettings';

const getWindow = () => window as unknown as Record<string, WiredCreatorToolsSettingsState>;

export const GetWiredCreatorToolsSettings = (): WiredCreatorToolsSettingsState =>
{
    return { ...DEFAULT_SETTINGS, ...(getWindow()[KEY] ?? {}) };
}

export const SetWiredCreatorToolsSettings = (settings: Partial<WiredCreatorToolsSettingsState>) =>
{
    const nextSettings = {
        ...GetWiredCreatorToolsSettings(),
        ...settings
    };

    getWindow()[KEY] = nextSettings;
    window.dispatchEvent(new CustomEvent(WIRED_CREATOR_TOOLS_SETTINGS_EVENT, { detail: nextSettings }));
}
