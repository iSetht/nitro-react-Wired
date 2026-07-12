import { FC, ReactNode } from 'react';
import { LocalizeText } from '../../../api';
import { Column, Text } from '../../../common';
import { useWired } from '../../../hooks';
import { WIRED_SOURCE_CLICKED_AVATAR, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WiredAdjustButton, wiredClickedAvatarSourceAvailableForTrigger, WiredControlText, WiredDisabled, WiredDivider } from './WiredControls';
import { wiredIconUrl } from './WiredIcons';

const DEFAULT_SOURCES = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR ];
const USER_SOURCE_LABEL_PREFIX = 'wiredfurni.params.sources.users';
const WIRED_SOURCE_TILE_SELECTOR = 202;
const WIRED_SOURCE_TRIGGERING_TILE = 203;

const withExecutionUserSources = (options: number[], labelPrefix: string, hasClickedAvatarSource: boolean) =>
{
    if(!hasClickedAvatarSource || labelPrefix !== USER_SOURCE_LABEL_PREFIX || options.includes(WIRED_SOURCE_CLICKED_AVATAR)) return options;

    const triggerIndex = options.indexOf(0);
    const nextOptions = [ ...options ];

    nextOptions.splice(triggerIndex >= 0 ? triggerIndex + 1 : 0, 0, WIRED_SOURCE_CLICKED_AVATAR);

    return nextOptions;
}

const sourceFlag = (trigger: any, offsetFromEnd: number) =>
{
    const intData = trigger?.intData ?? [];
    const index = intData.length - offsetFromEnd;

    return index >= 0 && intData[index] === 1;
}

const withAvailableTileSources = (trigger: any, options: number[]) =>
{
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

export interface WiredSourceSelectorConfig
{
    value: number;
    onChange: (source: number) => void;
    options?: number[];
    titleKey?: string;
    labelPrefix?: string;
    optionLabels?: Record<number, string>;
    showSelectedCount?: boolean;
    pickers?: WiredSourcePickerConfig[];
    titleAccessory?: ReactNode;
    disabled?: boolean;
}

export interface WiredSourcePickerConfig
{
    source: number;
    icon: string;
    color: string;
    variant?: 'selected' | 'secondary';
    selected?: boolean;
    onClick?: () => void;
}

interface WiredFurniSelectorViewProps
{
    sourceSelectors?: WiredSourceSelectorConfig[];
    showFurniSelection?: boolean;
    expanded?: boolean;
    onToggleExpanded?: () => void;
    advancedSlot?: ReactNode;
    /** Always show the source panel — no "advanced settings" toggle link. */
    alwaysExpanded?: boolean;
}

export const WiredFurniSelectorView: FC<WiredFurniSelectorViewProps> = props =>
{
    const {
        sourceSelectors = [],
        showFurniSelection = true,
        expanded = false,
        onToggleExpanded,
        advancedSlot = null,
        alwaysExpanded = false
    } = props;

    const { trigger = null, furniIds = [], maximumItemSelectionCount = 0 } = useWired();
    const hasClickedAvatarSource = wiredClickedAvatarSourceAvailableForTrigger(trigger);

    const normalizedSelectors = sourceSelectors
        .filter(selector => selector && selector.value !== undefined && !!selector.onChange)
        .map(selector =>
        {
            const labelPrefix = selector.labelPrefix ?? 'wiredfurni.params.sources.furni';
            const options = selector.options?.length ? selector.options : DEFAULT_SOURCES;

            return {
                value: selector.value,
                onChange: selector.onChange,
                options: withAvailableTileSources(trigger, withExecutionUserSources(options, labelPrefix, hasClickedAvatarSource)),
                titleKey: selector.titleKey ?? 'wiredfurni.params.sources.furni.title',
                labelPrefix,
                optionLabels: selector.optionLabels ?? {},
                showSelectedCount: selector.showSelectedCount ?? labelPrefix === 'wiredfurni.params.sources.furni',
                pickers: selector.pickers ?? [],
                titleAccessory: selector.titleAccessory ?? null,
                disabled: selector.disabled ?? false
            };
        });

    const hasSourceSelector = normalizedSelectors.length > 0 || !!advancedSlot;
    const panelOpen = alwaysExpanded || expanded;

    return (
        <Column gap={ 1 }>
            { showFurniSelection && (
                <>
                    <Text bitmapFont="il_link_strong" className="nw-furni-caption">
                        { LocalizeText('wiredfurni.pickfurnis.caption', [ 'count', 'limit' ], [ furniIds.length.toString(), maximumItemSelectionCount.toString() ]) }
                    </Text>
                    <Text bitmapFont="il_regular" className="nw-furni-desc">{ LocalizeText('wiredfurni.pickfurnis.desc') }</Text>
                </>
            ) }

            { hasSourceSelector && (
                <div className="nw-source-panel-stack">
                    { !alwaysExpanded &&
                        <div className="nw-advanced-settings" onClick={ onToggleExpanded }>
                            <Text bitmapFont="il_regular">
                                { LocalizeText(expanded ? 'wiredfurni.params.sources.collapse' : 'wiredfurni.params.sources.expand') }
                            </Text>
                        </div> }

                    <WiredDivider overlap="top" />

                    { panelOpen &&
                        <div className="nw-source-panel">
                            { advancedSlot && (
                                <>
                                    { advancedSlot }
                                    { normalizedSelectors.length > 0 && <WiredDivider inner /> }
                                </>
                            ) }

                            { normalizedSelectors.map((selector, index) =>
                            {
                                const currentIndex = selector.options.indexOf(selector.value);
                                const safeIndex = (currentIndex >= 0) ? currentIndex : 0;
                                const currentSource = selector.options[safeIndex];
                                const sourcePicker = selector.pickers.find(picker => picker.source === currentSource);
                                const configuredSourceLabel = selector.optionLabels[currentSource];
                                const sourceLabel = selector.showSelectedCount && currentSource === WIRED_SOURCE_SELECTED && (!configuredSourceLabel || /\/0\]$/.test(configuredSourceLabel))
                                    ? `${ LocalizeText(`${ selector.labelPrefix }.${ currentSource }`) } [${ furniIds.length }/${ maximumItemSelectionCount }]`
                                    : (configuredSourceLabel ?? LocalizeText(`${ selector.labelPrefix }.${ currentSource }`));

                                const prevSource = () =>
                                {
                                    if(selector.disabled) return;

                                    selector.onChange(selector.options[(safeIndex - 1 + selector.options.length) % selector.options.length]);
                                };
                                const nextSource = () =>
                                {
                                    if(selector.disabled) return;

                                    selector.onChange(selector.options[(safeIndex + 1) % selector.options.length]);
                                };

                                return (
                                    <WiredDisabled key={ `${ selector.titleKey }-${ index }` } disabled={ selector.disabled }>
                                        { index > 0 && <WiredDivider inner /> }

                                        <div className="nw-source-heading">
                                            <Text bitmapFont="il_link_strong" className="nw-source-title">
                                                { LocalizeText(selector.titleKey) }
                                            </Text>

                                            { (sourcePicker || selector.titleAccessory) &&
                                                <div className="nw-source-heading-actions">
                                                    { sourcePicker &&
                                                        <button
                                                            type="button"
                                                            className={ `nw-source-pick-pill nw-source-pick-${ sourcePicker.variant ?? (currentSource === 101 ? 'secondary' : 'selected') } ${ sourcePicker.selected ? 'is-selected' : '' }` }
                                                            onClick={ sourcePicker.onClick }>
                                                            <img alt="" src={ wiredIconUrl(sourcePicker.icon) } />
                                                        </button> }

                                                    { selector.titleAccessory }
                                                </div> }
                                        </div>

                                        <div className="nw-source-row">
                                            <WiredAdjustButton direction="left" className="nw-source-arrow" onClick={ prevSource } />
                                            <span className="nw-source-label">
                                                <WiredControlText>{ sourceLabel }</WiredControlText>
                                            </span>
                                            <WiredAdjustButton direction="right" className="nw-source-arrow" onClick={ nextSource } />
                                        </div>
                                    </WiredDisabled>
                                );
                            }) }
                        </div> }
                </div>
            ) }
        </Column>
    );
}
