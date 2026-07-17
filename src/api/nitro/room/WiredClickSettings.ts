export interface WiredClickSettingsState
{
    userMode: number;
    furniMode: number;
    active: boolean;
}

const DEFAULT_SETTINGS: WiredClickSettingsState = {
    userMode: 0,
    furniMode: 0,
    active: false
};

const KEY = '__nitroWiredClickSettings';

const getWindow = () => window as unknown as Record<string, WiredClickSettingsState>;

export const GetWiredClickSettings = (): WiredClickSettingsState =>
{
    return getWindow()[KEY] ?? DEFAULT_SETTINGS;
}

export const SetWiredClickSettings = (settings: WiredClickSettingsState) =>
{
    getWindow()[KEY] = {
        userMode: Math.max(0, Math.min(2, settings.userMode || 0)),
        furniMode: Math.max(0, Math.min(1, settings.furniMode || 0)),
        active: !!settings.active
    };
}
