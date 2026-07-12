export const WIRED_CREATOR_TOOLS_PACKETS = {
    getRoomStats: 'out:WiredGetRoomStats',
    getErrorLogs: 'out:WiredGetErrorLogs',
    getRoomLogs: 'out:WiredGetRoomLogs',
    clearErrorLogs: 'in:WiredClearErrorLogs',
    getVariables: 'out:WiredGetVariables',
    getInspection: 'out:WiredGetInspection',
    saveSettings: 'in:WiredSaveSettings',
    setPlaytestingMode: 'in:WiredSetPlaytestingMode',
    rollbackRoom: 'in:WiredRollbackRoom'
} as const;

export const WIRED_CREATOR_TOOLS_BACKEND_TODO = {
    chests: '#Implement Chests',
    settingsPersistence: 'Backend later: persist this setting so it survives room reloads and hotel restarts.',
    rollback: 'Backend later: restore the room to the state it had during the most recent reload.',
    playtesting: 'Backend later: temporarily remove practical room rights until playtesting is disabled.'
} as const;

export const WIRED_CREATOR_TOOLS_DEFAULTS = {
    maxUsage: 8750,
    heavyUsageFallbackPercent: 50
} as const;
