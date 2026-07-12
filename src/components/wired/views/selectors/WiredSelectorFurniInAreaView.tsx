import { FC, useCallback, useEffect, useState } from 'react';
import { GetRoomEngine, LocalizeText } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredButton, WiredInfoDesc, WiredParam } from '../WiredControls';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const HIGHLIGHT_BRIGHTEN = 'highlight_brighten';

export const WiredSelectorFurniInAreaView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null } = useWired();
    const [ startX, setStartX ] = useState(0);
    const [ startY, setStartY ] = useState(0);
    const [ endX, setEndX ] = useState(0);
    const [ endY, setEndY ] = useState(0);
    const [ hasSelection, setHasSelection ] = useState(false);
    const areaWidth = (hasSelection ? ((endX - startX) + 1) : 0);
    const areaHeight = (hasSelection ? ((endY - startY) + 1) : 0);
    const getSelectionManager = useCallback(() => GetRoomEngine()?.areaSelectionManager, []);
    const resetSelectionState = useCallback(() =>
    {
        setStartX(0);
        setStartY(0);
        setEndX(0);
        setEndY(0);
        setHasSelection(false);
    }, []);
    const clearSelection = useCallback(() =>
    {
        getSelectionManager()?.clearHighlight();
        resetSelectionState();
    }, [ getSelectionManager, resetSelectionState ]);
    const save = useCallback((filterExistingSelection = false, invert = false) =>
    {
        setIntParams([
            startX,
            startY,
            endX,
            endY,
            hasSelection ? 1 : 0,
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0
        ]);
    }, [ endX, endY, hasSelection, setIntParams, startX, startY ]);
    useEffect(() =>
    {
        if(!trigger) return;
        const manager = getSelectionManager();
        if(!manager) return;
        const callback = (x: number, y: number, width: number, height: number) =>
        {
            if(width <= 0 || height <= 0)
            {
                resetSelectionState();
                return;
            }
            setStartX(x);
            setStartY(y);
            setEndX(x + width - 1);
            setEndY(y + height - 1);
            setHasSelection(true);
        };
        const activated = manager.activate(callback, HIGHLIGHT_BRIGHTEN);
        if(activated && ((trigger.intData?.length ?? 0) >= 5) && (trigger.intData[4] === 1))
        {
            const savedStartX = trigger.intData[0];
            const savedStartY = trigger.intData[1];
            const savedEndX = trigger.intData[2];
            const savedEndY = trigger.intData[3];
            manager.setHighlight(
                savedStartX,
                savedStartY,
                (savedEndX - savedStartX) + 1,
                (savedEndY - savedStartY) + 1
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
        };
    }, [ getSelectionManager, resetSelectionState, trigger ]);
    useEffect(() =>
    {
        if(!trigger) return;
        if(((trigger.intData?.length ?? 0) >= 5) && (trigger.intData[4] === 1))
        {
            setStartX(trigger.intData[0]);
            setStartY(trigger.intData[1]);
            setEndX(trigger.intData[2]);
            setEndY(trigger.intData[3]);
            setHasSelection(true);
        }
        else
        {
            resetSelectionState();
        }
    }, [ resetSelectionState, trigger ]);
    useEffect(() =>
    {
        if(!trigger) return;
        const manager = getSelectionManager();
        if(!manager) return;
        manager.setHighlightType(HIGHLIGHT_BRIGHTEN);
    }, [ getSelectionManager, trigger ]);
    return (
        <WiredSelectorBaseView
            hasSpecialInput={ true }
            requiresFurni={ 0 }
            save={ save }
            showSelectorOptions={ true }
            selectorOptionOffset={ 5 }>
            <WiredParam titleKey="wiredfurni.params.area_selection">
                <WiredInfoDesc textKey="wiredfurni.params.area_selection.info" />
                <div className="nw-area-buttons">
                    <WiredButton onClick={ () => getSelectionManager()?.startSelecting() }>
                        { LocalizeText('wiredfurni.params.area_selection.select') }
                    </WiredButton>
                    <WiredButton onClick={ clearSelection }>
                        { LocalizeText('wiredfurni.params.area_selection.clear') }
                    </WiredButton>
                </div>
            </WiredParam>
        </WiredSelectorBaseView>
    );
};
