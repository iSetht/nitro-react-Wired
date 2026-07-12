import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { Triggerable } from '@nitrots/nitro-renderer';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import {
    wiredClickedAvatarSourceAvailableForTrigger,
    WIRED_SOURCE_CLICKED_AVATAR,
    WIRED_SOURCE_SELECTED,
    WIRED_SOURCE_SECONDARY_SELECTED,
    WIRED_SOURCE_SELECTOR,
    WIRED_SOURCE_SIGNAL,
    WIRED_SOURCE_TRIGGER
} from '../WiredControls';

export const WIRED_SOURCE_TILE_SELECTOR = 202;
export const WIRED_SOURCE_TRIGGERING_TILE = 203;

export const FURNI_SOURCE_OPTIONS = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER ];
export const FURNI_SECONDARY_SOURCE_OPTIONS = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SECONDARY_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
export const FURNI_TILE_SOURCE_OPTIONS = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_TILE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER ];
export const FURNI_TILE_SOURCE_OPTIONS_WITH_TRIGGERING = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_TILE_SELECTOR, WIRED_SOURCE_TRIGGERING_TILE, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER ];
export const USER_SOURCE_OPTIONS = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
export const USER_SOURCE_OPTIONS_WITH_CLICKED_AVATAR = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_CLICKED_AVATAR, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
export const BOT_SOURCE_OPTIONS = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER ];

const isValidSource = (source: number, options: number[]) => options.includes(source);
const isDefaultUserSourceOptions = (options: number[]) =>
    options.length === USER_SOURCE_OPTIONS.length && USER_SOURCE_OPTIONS.every(source => options.includes(source));
const sourceFlag = (trigger: Triggerable | null, offsetFromEnd: number) =>
{
    const intData = trigger?.intData ?? [];
    const index = intData.length - offsetFromEnd;

    return index >= 0 && intData[index] === 1;
}

const userSourceOptionsForTrigger = (trigger: Triggerable | null, options: number[]) =>
{
    if(!trigger || !isDefaultUserSourceOptions(options)) return options;

    return wiredClickedAvatarSourceAvailableForTrigger(trigger) ? USER_SOURCE_OPTIONS_WITH_CLICKED_AVATAR : options;
}

const furniSourceOptionsForTrigger = (trigger: Triggerable | null, options: number[]) =>
{
    if(!trigger) return options;

    const wantsTileSelector = options.includes(WIRED_SOURCE_TILE_SELECTOR);
    const wantsTriggeringTile = options.includes(WIRED_SOURCE_TRIGGERING_TILE);

    if(!wantsTileSelector && !wantsTriggeringTile) return options;

    const hasTileSelector = sourceFlag(trigger, wantsTriggeringTile ? 2 : 1);
    const hasTriggeringTile = wantsTriggeringTile && sourceFlag(trigger, 1);

    return options.filter(source =>
    {
        if(source === WIRED_SOURCE_TILE_SELECTOR) return hasTileSelector;
        if(source === WIRED_SOURCE_TRIGGERING_TILE) return hasTriggeringTile;

        return true;
    });
}

export const useWiredEffectSource = (
    trigger: Triggerable | null,
    offset: number,
    defaultSource: number,
    options: number[]
): [ number, Dispatch<SetStateAction<number>>, boolean, Dispatch<SetStateAction<boolean>> ] =>
{
    const [ source, setSource ] = useState(defaultSource);
    const [ expanded, setExpanded ] = useState(false);
    const resolvedOptions = useMemo(() => furniSourceOptionsForTrigger(trigger, userSourceOptionsForTrigger(trigger, options)), [ trigger, options ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const saved = (trigger.intData?.length > offset) ? trigger.intData[offset] : defaultSource;
        const valid = isValidSource(saved, resolvedOptions) ? saved : defaultSource;

        setSource(valid);
        setExpanded(valid !== defaultSource);
    }, [ trigger, offset, defaultSource, resolvedOptions ]);

    return [ source, setSource, expanded, setExpanded ];
}

export const createFurniSourceSelector = (value: number, onChange: (source: number) => void, options: number[] = FURNI_SOURCE_OPTIONS): WiredSourceSelectorConfig => ({
    value,
    onChange,
    options,
    titleKey: 'wiredfurni.params.sources.furni.title',
    labelPrefix: 'wiredfurni.params.sources.furni'
});

export const createUserSourceSelector = (value: number, onChange: (source: number) => void, includeClickedAvatar = false): WiredSourceSelectorConfig => ({
    value,
    onChange,
    options: includeClickedAvatar ? USER_SOURCE_OPTIONS_WITH_CLICKED_AVATAR : USER_SOURCE_OPTIONS,
    titleKey: 'wiredfurni.params.sources.users.title',
    labelPrefix: 'wiredfurni.params.sources.users'
});
