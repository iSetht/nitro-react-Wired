import { AreaHideDefinition, UpdateAreaHideMessageComposer, WiredAreaHideEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GetRoomEngine, LocalizeText, SendMessageComposer } from '../../api';
import { NitroCardView, Text } from '../../common';
import { useMessageEvent } from '../../hooks';
import { WiredButton, WiredCheckbox, WiredDivider, WiredInfoDesc, WiredParam } from '../wired/views/WiredControls';

const HIGHLIGHT_BLACK = 'highlight_black';
const DEFAULT_PARAMS = [ 0, 0, 0, 0, 0, 1, 0, 0, 0 ];

type AreaHideState = {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    hasSelection: boolean;
    hideWallItems: boolean;
    inverted: boolean;
    invisibleFurni: boolean;
    enabled: boolean;
};

const getInitialState = (definition: AreaHideDefinition): AreaHideState =>
{
    const data = [ ...DEFAULT_PARAMS ];

    definition?.intData?.forEach((value, index) =>
    {
        if(index < data.length) data[index] = value;
    });

    return {
        startX: data[0],
        startY: data[1],
        endX: data[2],
        endY: data[3],
        hasSelection: data[4] === 1,
        hideWallItems: data[5] === 1,
        inverted: data[6] === 1,
        invisibleFurni: data[7] === 1,
        enabled: data[8] === 1
    };
};

const toIntParams = (state: AreaHideState): number[] => [
    state.startX,
    state.startY,
    state.endX,
    state.endY,
    state.hasSelection ? 1 : 0,
    state.hideWallItems ? 1 : 0,
    state.inverted ? 1 : 0,
    state.invisibleFurni ? 1 : 0,
    state.enabled ? 1 : 0
];

const toParamKey = (state: AreaHideState): string => toIntParams(state).join(',');

export const AreaHideView: FC<{}> = () =>
{
    const [ areaHide, setAreaHide ] = useState<AreaHideDefinition>(null);
    const [ state, setState ] = useState<AreaHideState>(() => getInitialState(null));
    const stateRef = useRef(state);
    const selectionActive = useRef(false);
    const lastSentParams = useRef('');
    const enabledToggleTimer = useRef<ReturnType<typeof setTimeout>>(null);
    const canModify = areaHide?.canModify !== false;
    const canEditArea = canModify && !state.enabled;
    const getSelectionManager = useCallback(() => GetRoomEngine()?.areaSelectionManager, []);

    const selectedWidth = useMemo(() => state.hasSelection ? ((state.endX - state.startX) + 1) : 0, [ state.endX, state.hasSelection, state.startX ]);
    const selectedHeight = useMemo(() => state.hasSelection ? ((state.endY - state.startY) + 1) : 0, [ state.endY, state.hasSelection, state.startY ]);

    const sendAreaHideState = useCallback((nextState: AreaHideState) =>
    {
        if(!areaHide || !canModify) return;

        const params = toIntParams(nextState);
        const paramsKey = params.join(',');

        if(paramsKey === lastSentParams.current) return;

        lastSentParams.current = paramsKey;
        SendMessageComposer(new UpdateAreaHideMessageComposer(areaHide.id, params));
    }, [ areaHide, canModify ]);

    const commitState = useCallback((updater: (current: AreaHideState) => AreaHideState, save = false) =>
    {
        const nextState = updater(stateRef.current);

        stateRef.current = nextState;
        setState(nextState);
        if(save) sendAreaHideState(nextState);
    }, [ sendAreaHideState ]);

    const close = useCallback(() =>
    {
        if(enabledToggleTimer.current !== null)
        {
            clearTimeout(enabledToggleTimer.current);
            enabledToggleTimer.current = null;
        }

        getSelectionManager()?.finishSelecting();
        sendAreaHideState(stateRef.current);
        getSelectionManager()?.deactivate();
        selectionActive.current = false;
        setAreaHide(null);
    }, [ getSelectionManager, sendAreaHideState ]);

    const clearSelection = useCallback(() =>
    {
        getSelectionManager()?.clearHighlight();
        commitState(current => ({ ...current, startX: 0, startY: 0, endX: 0, endY: 0, hasSelection: false }));
    }, [ commitState, getSelectionManager ]);

    const startSelection = useCallback(() =>
    {
        if(!areaHide || !canEditArea) return;

        const manager = getSelectionManager();
        if(!manager || !selectionActive.current) return;

        if(stateRef.current.hasSelection)
        {
            manager.setHighlightType(HIGHLIGHT_BLACK);
            manager.setHighlight(stateRef.current.startX, stateRef.current.startY, selectedWidth, selectedHeight);
        }

        manager.startSelecting();
    }, [ areaHide, canEditArea, getSelectionManager, selectedHeight, selectedWidth ]);

    const toggleEnabled = useCallback(() =>
    {
        getSelectionManager()?.finishSelecting();

        // Update the UI immediately so every click feels instant
        commitState(current => ({ ...current, enabled: !current.enabled }), false);

        // Debounce the actual network send — only the final state after rapid clicks is sent
        if(enabledToggleTimer.current !== null) clearTimeout(enabledToggleTimer.current);

        enabledToggleTimer.current = setTimeout(() =>
        {
            enabledToggleTimer.current = null;
            sendAreaHideState(stateRef.current);
        }, 300);
    }, [ commitState, getSelectionManager, sendAreaHideState ]);

    useMessageEvent<WiredAreaHideEvent>(WiredAreaHideEvent, event =>
    {
        const definition = event.getParser().definition;
        const nextState = getInitialState(definition);

        getSelectionManager()?.deactivate();
        selectionActive.current = false;
        stateRef.current = nextState;
        lastSentParams.current = toParamKey(nextState);
        setState(nextState);
        setAreaHide(definition);
    });

    useEffect(() =>
    {
        if(!areaHide || state.enabled) return;

        const manager = getSelectionManager();
        if(!manager) return;

        const callback = (x: number, y: number, width: number, height: number) =>
        {
            if(width <= 0 || height <= 0)
            {
                commitState(current => ({ ...current, startX: 0, startY: 0, endX: 0, endY: 0, hasSelection: false }));
                return;
            }

            commitState(current => ({
                ...current,
                startX: x,
                startY: y,
                endX: x + width - 1,
                endY: y + height - 1,
                hasSelection: true
            }));
        };

        selectionActive.current = manager.activate(callback, HIGHLIGHT_BLACK);

        if(selectionActive.current && stateRef.current.hasSelection)
        {
            manager.setHighlight(
                stateRef.current.startX,
                stateRef.current.startY,
                (stateRef.current.endX - stateRef.current.startX) + 1,
                (stateRef.current.endY - stateRef.current.startY) + 1
            );
        }

        const handleMouseUp = () => manager.finishSelecting();

        window.addEventListener('mouseup', handleMouseUp, true);
        window.addEventListener('blur', handleMouseUp);

        return () =>
        {
            window.removeEventListener('mouseup', handleMouseUp, true);
            window.removeEventListener('blur', handleMouseUp);
            manager.deactivate();
            selectionActive.current = false;
        };
    }, [ areaHide, commitState, getSelectionManager, state.enabled ]);

    useEffect(() =>
    {
        if(!state.enabled) return;

        getSelectionManager()?.finishSelecting();
        getSelectionManager()?.deactivate();
        selectionActive.current = false;
    }, [ getSelectionManager, state.enabled ]);

    useEffect(() =>
    {
        const manager = getSelectionManager();
        if(!manager || !selectionActive.current || !state.hasSelection) return;

        manager.setHighlightType(HIGHLIGHT_BLACK);
        manager.setHighlight(state.startX, state.startY, selectedWidth, selectedHeight);
    }, [ getSelectionManager, selectedHeight, selectedWidth, state.hasSelection, state.startX, state.startY ]);

    if(!areaHide) return null;

    return (
        <NitroCardView
            uniqueKey="nitro-area-hide"
            className={ `nitro-wired nitro-area-hide${ state.enabled ? ' is-area-locked' : '' }` }
            theme="primary"
            simple={ false }
            style={ { width: 238 } }>
            <div className="nw-header drag-handler">
                <div className="nw-header-bg" />
                <div className="nw-header-row1">
                    <span className="nw-header-title">
                        <Text bitmapFont="il_heading_3">Room Area Hider</Text>
                    </span>
                    <button className="nw-btn nw-btn-close" onClick={ close } />
                </div>
            </div>

            <div className="nw-body">
                <div className="nw-special">
                    <WiredParam titleKey="wiredfurni.params.area_selection">
                        <WiredInfoDesc textKey="wiredfurni.params.area_selection.info" />
                        <div className="nw-area-buttons">
                            <WiredButton disabled={ !canEditArea } onClick={ startSelection }>
                                { LocalizeText('wiredfurni.params.area_selection.select') }
                            </WiredButton>
                            <WiredButton disabled={ !canEditArea } onClick={ clearSelection }>
                                { LocalizeText('wiredfurni.params.area_selection.clear') }
                            </WiredButton>
                        </div>
                    </WiredParam>

                    <div className="nw-param">
                        <Text className="nw-control-title" bitmapFont="il_link_strong">{ LocalizeText('widget.areahide.options') }</Text>
                        <WiredCheckbox
                            checked={ state.hideWallItems }
                            onChange={ checked => commitState(current => ({ ...current, hideWallItems: checked })) }
                            label={ LocalizeText('widget.areahide.options.wallitems') } />
                        <WiredCheckbox
                            checked={ state.inverted }
                            onChange={ checked => commitState(current => ({ ...current, inverted: checked })) }
                            label={ LocalizeText('widget.areahide.options.invert') } />
                        <Text className="nw-sub-info nw-indent-tab" bitmapFont="il_regular">{ LocalizeText('widget.areahide.options.invert.info') }</Text>
                        <WiredCheckbox
                            checked={ state.invisibleFurni }
                            onChange={ checked => commitState(current => ({ ...current, invisibleFurni: checked })) }
                            label={ LocalizeText('widget.areahide.options.invisibility') } />
                        <Text className="nw-sub-info nw-indent-tab" bitmapFont="il_regular">{ LocalizeText('widget.areahide.options.invisibility.info') }</Text>
                    </div>

                    <WiredDivider />

                    <div className="nw-area-buttons">
                        <WiredButton className="nw-inline-btn" disabled={ !canModify } onClick={ toggleEnabled }>
                            { LocalizeText(state.enabled ? 'widget.dimmer.button.off' : 'widget.dimmer.button.on') }
                        </WiredButton>
                    </div>
                </div>
            </div>
        </NitroCardView>
    );
};
