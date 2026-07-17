import { FC, PropsWithChildren, ReactNode, useCallback, useEffect, useState } from 'react';
import { GetSessionDataManager, LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../api';
import { NitroCardView, Text } from '../../../common';
import { useWired } from '../../../hooks';
import { WiredDivider } from './WiredControls';
import { WiredFurniSelectorView, WiredSourceSelectorConfig } from './WiredFurniSelectorView';

export interface WiredBaseViewProps
{
    wiredType: string;
    requiresFurni: number;
    hasSpecialInput: boolean;
    save: () => void;
    validate?: () => boolean;
    furniSource?: number;
    onFurniSourceChange?: (source: number) => void;
    sourceOptions?: number[];
    sourceTitleKey?: string;
    sourceLabelPrefix?: string;
    sourceSelectors?: WiredSourceSelectorConfig[];
    hideFurniSelector?: boolean;
    hideFurniSelectionCaption?: boolean;
    expanded?: boolean;
    expandedWindow?: boolean;
    windowWidth?: number;
    onToggleExpanded?: () => void;
    headerSlot?: ReactNode;
    advancedSlot?: ReactNode;
    afterSelectorSlot?: ReactNode;
    alwaysExpandedSources?: boolean;
    showSourceDivider?: boolean;
}

export const WiredBaseView: FC<PropsWithChildren<WiredBaseViewProps>> = props =>
{
    const {
        wiredType = '',
        requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE,
        save = null,
        validate = null,
        children = null,
        hasSpecialInput = false,
        furniSource,
        onFurniSourceChange,
        sourceOptions,
        sourceTitleKey,
        sourceLabelPrefix,
        sourceSelectors,
        hideFurniSelector = false,
        hideFurniSelectionCaption = false,
        expanded,
        expandedWindow,
        windowWidth,
        onToggleExpanded,
        headerSlot = null,
        advancedSlot = null,
        afterSelectorSlot = null,
        alwaysExpandedSources = false,
        showSourceDivider = true
    } = props;

    const [ wiredName, setWiredName ] = useState<string>(null);
    const [ needsSave, setNeedsSave ] = useState<boolean>(false);
    const { trigger = null, setTrigger = null, setIntParams = null, setStringParam = null, furniIds = [], setFurniIds = null, setAllowsFurni = null, saveWired = null } = useWired();

    const clearFurniSelection = useCallback(() =>
    {
        if(furniIds && furniIds.length) WiredSelectionVisualizer.clearSelectionShaderFromFurni(furniIds);
        if(setFurniIds) setFurniIds([]);
        if(setAllowsFurni) setAllowsFurni(WiredFurniType.STUFF_SELECTION_OPTION_NONE);
    }, [ furniIds, setFurniIds, setAllowsFurni ]);

    const onClose = () =>
    {
        clearFurniSelection();
        setTrigger(null);
    }

    const onSave = () =>
    {
        if(trigger?.canModify === false) return;
        if(validate && !validate()) return;
        if(save) save();
        setNeedsSave(true);
    }

    useEffect(() =>
    {
        if(!needsSave) return;
        saveWired();
        if(hideFurniSelector) clearFurniSelection();
        setNeedsSave(false);
    }, [ needsSave, saveWired, hideFurniSelector, clearFurniSelection ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const spriteId = (trigger.spriteId || -1);
        const furniData = GetSessionDataManager().getFloorItemData(spriteId);

        if(!furniData)
            setWiredName('NAME: ' + spriteId);
        else
            setWiredName(furniData.name);

        if(hasSpecialInput)
        {
            setIntParams(trigger.intData);
            setStringParam(trigger.stringData);
        }

        if(requiresFurni > WiredFurniType.STUFF_SELECTION_OPTION_NONE)
        {
            setFurniIds(prevValue =>
            {
                if(prevValue && prevValue.length) WiredSelectionVisualizer.clearSelectionShaderFromFurni(prevValue);

                if(trigger.selectedItems && trigger.selectedItems.length)
                {
                    WiredSelectionVisualizer.applySelectionShaderToFurni(trigger.selectedItems);
                    return trigger.selectedItems;
                }

                return [];
            });
        }

        setAllowsFurni(requiresFurni);
    }, [ trigger, hasSpecialInput, requiresFurni, setIntParams, setStringParam, setFurniIds, setAllowsFurni ]);

    const wiredLabelMap = {
        trigger: 'trigger',
        effect: 'effect',
        condition: 'condition',
        extra: 'add-on'
    };

    const typeLabel = `wired ${ wiredLabelMap[wiredType] || wiredType }`;

    const displayName = wiredName?.includes(':')
        ? wiredName.split(':').slice(1).join(':').trim()
        : wiredName;

    const resolvedSourceSelectors = sourceSelectors?.length
        ? sourceSelectors
        : ((furniSource !== undefined) && !!onFurniSourceChange)
            ? [ {
                value: furniSource,
                onChange: onFurniSourceChange,
                options: sourceOptions,
                titleKey: sourceTitleKey ?? 'wiredfurni.params.sources.furni.title',
                labelPrefix: sourceLabelPrefix ?? 'wiredfurni.params.sources.furni'
            } ]
            : [];

    const hasParams = !!children;
    const hasSourceSelector = resolvedSourceSelectors.length > 0 || advancedSlot !== null;
    const showFurniSelection = !hideFurniSelector && requiresFurni > WiredFurniType.STUFF_SELECTION_OPTION_NONE;
    const showFurniSelectionCaption = showFurniSelection && !hideFurniSelectionCaption;
    const hasDelaySlot = afterSelectorSlot !== null;
    const combineFurniAndSources = showFurniSelectionCaption && hasSourceSelector && !hasDelaySlot;
    const showSeparateSources = hasSourceSelector && !combineFurniAndSources;
    const isViewOnly = trigger?.canModify === false;
    const titleText = isViewOnly ? `${ LocalizeText('wiredfurni.title') } - View Only Mode` : LocalizeText('wiredfurni.title');
    const showButtons = !isViewOnly;

    // Section order: params → furni pick → delay (effects) → source panel → buttons.
    // Source panel owns its cap/bottom lines — never insert a divider before it.
    const needsDividerBeforeFurni = hasParams && showFurniSelectionCaption;
    const needsDividerBeforeDelay = hasDelaySlot && (showFurniSelectionCaption || hasParams);
    const needsDividerBeforeButtons = showButtons && !hasSourceSelector && (hasParams || showFurniSelectionCaption || hasDelaySlot);

    return (
        <NitroCardView
            uniqueKey="nitro-wired"
            className={ `nitro-wired ${ isViewOnly ? 'nitro-wired--view-only' : '' }` }
            theme="primary"
            simple={ false }
            style={ { width: windowWidth ?? (expandedWindow ? 406 : 238) } }>
            <div className="nw-header drag-handler">
                <div className="nw-header-bg" />
                <div className="nw-header-row1">
                    <button className="nw-btn nw-btn-menu" />
                    <span className="nw-header-title">
                        <Text bitmapFont="il_heading_3">{ titleText }</Text>
                    </span>
                    <button className="nw-btn nw-btn-close" onClick={ onClose } />
                </div>
                <div className="nw-header-row2">
                    <Text bitmapFont="il_link_strong">{ typeLabel.toUpperCase() }</Text>
                </div>
                <div className="nw-header-row3">
                    <Text bitmapFont="id_heading_2">{ displayName }</Text>
                </div>
                { headerSlot !== null && <div className="nw-header-slot">{ headerSlot }</div> }
            </div>

            <div className="nw-body">
                { hasParams &&
                    <div className="nw-special">
                        { children }
                    </div>
                }

                { needsDividerBeforeFurni && <WiredDivider /> }

                { showFurniSelectionCaption &&
                    <div className="nw-furni-selector">
                        <WiredFurniSelectorView
                            showFurniSelection={ true }
                            sourceSelectors={ combineFurniAndSources ? resolvedSourceSelectors : [] }
                            expanded={ combineFurniAndSources ? expanded : false }
                            onToggleExpanded={ combineFurniAndSources ? onToggleExpanded : undefined }
                            advancedSlot={ combineFurniAndSources ? advancedSlot : null }
                            alwaysExpanded={ combineFurniAndSources ? alwaysExpandedSources : false }
                        />
                    </div>
                }

                { needsDividerBeforeDelay && <WiredDivider /> }

                { hasDelaySlot && afterSelectorSlot }

                { showSeparateSources &&
                    <div className="nw-furni-selector">
                        <WiredFurniSelectorView
                            sourceSelectors={ resolvedSourceSelectors }
                            expanded={ expanded }
                            onToggleExpanded={ onToggleExpanded }
                            showFurniSelection={ false }
                            advancedSlot={ advancedSlot }
                            alwaysExpanded={ alwaysExpandedSources }
                        />
                    </div>
                }

                { showButtons &&
                    <>
                        { needsDividerBeforeButtons && <WiredDivider /> }
                        <div className="nw-buttons">
                            <button className="nw-text-btn" onClick={ onSave }>
                                <Text bitmapFont="il_button">{ LocalizeText('wiredfurni.ready') }</Text>
                            </button>
                            <button className="nw-text-btn" onClick={ onClose }>
                                <Text bitmapFont="il_button">{ LocalizeText('wiredfurni.cancel') }</Text>
                            </button>
                        </div>
                    </> }
            </div>
        </NitroCardView>
    );
}
