import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { GetRoomEngine, LocalizeText } from '../../../../api';
import { useNotification, useWired } from '../../../../hooks';
import { WiredButton, WiredInfoDesc, WiredParam } from '../WiredControls';
import { WiredIcon } from '../WiredIcons';
import { WiredSelectorBaseView, WiredSelectorToolButton } from './WiredSelectorBaseView';

const HIGHLIGHT_BRIGHTEN = 'highlight_brighten';

type EditMode = 'add' | 'remove';
type Zone = { startX: number; startY: number; endX: number; endY: number };

const tileKey = (x: number, y: number) => `${ x },${ y }`;

const normalizeZone = (zone: Zone): Zone => ({
    startX: Math.min(zone.startX, zone.endX),
    startY: Math.min(zone.startY, zone.endY),
    endX: Math.max(zone.startX, zone.endX),
    endY: Math.max(zone.startY, zone.endY)
});

const zonesToHighlightAreas = (zones: Zone[]) => zones.map(zone => ({
    rootX: zone.startX,
    rootY: zone.startY,
    width: (zone.endX - zone.startX) + 1,
    height: (zone.endY - zone.startY) + 1
}));

const addZoneTiles = (tiles: Set<string>, zone: Zone) =>
{
    const normalized = normalizeZone(zone);

    for(let y = normalized.startY; y <= normalized.endY; y++)
    {
        for(let x = normalized.startX; x <= normalized.endX; x++) tiles.add(tileKey(x, y));
    }
};

const zonesToTileSet = (zones: Zone[]) =>
{
    const tiles = new Set<string>();

    zones.forEach(zone => addZoneTiles(tiles, zone));

    return tiles;
};

const zoneOverlapsSelection = (zones: Zone[], zone: Zone) =>
{
    const tiles = zonesToTileSet(zones);
    const normalized = normalizeZone(zone);

    for(let y = normalized.startY; y <= normalized.endY; y++)
    {
        for(let x = normalized.startX; x <= normalized.endX; x++)
        {
            if(tiles.has(tileKey(x, y))) return true;
        }
    }

    return false;
};

const compactTilesToZones = (tiles: Set<string>): Zone[] =>
{
    const rows = new Map<number, number[]>();

    tiles.forEach(key =>
    {
        const [ x, y ] = key.split(',').map(value => parseInt(value));

        if(!rows.has(y)) rows.set(y, []);

        rows.get(y).push(x);
    });

    const zones: Zone[] = [];
    const openRuns = new Map<string, Zone>();
    const sortedRows = Array.from(rows.entries()).sort(([ a ], [ b ]) => a - b);

    sortedRows.forEach(([ y, xs ]) =>
    {
        const currentRunKeys = new Set<string>();
        const sortedXs = Array.from(new Set(xs)).sort((a, b) => a - b);
        let index = 0;

        while(index < sortedXs.length)
        {
            const startX = sortedXs[index];
            let endX = startX;

            while((index + 1) < sortedXs.length && sortedXs[index + 1] === (endX + 1))
            {
                index++;
                endX = sortedXs[index];
            }

            const runKey = `${ startX },${ endX }`;
            currentRunKeys.add(runKey);

            const openRun = openRuns.get(runKey);

            if(openRun && openRun.endY === (y - 1)) openRun.endY = y;
            else
            {
                const zone = { startX, startY: y, endX, endY: y };

                zones.push(zone);
                openRuns.set(runKey, zone);
            }

            index++;
        }

        Array.from(openRuns.entries()).forEach(([ runKey, zone ]) =>
        {
            if(!currentRunKeys.has(runKey) && zone.endY < y) openRuns.delete(runKey);
        });
    });

    return zones;
};

const removeZoneFromSelection = (zones: Zone[], zoneToRemove: Zone) =>
{
    const tiles = zonesToTileSet(zones);
    const normalized = normalizeZone(zoneToRemove);

    for(let y = normalized.startY; y <= normalized.endY; y++)
    {
        for(let x = normalized.startX; x <= normalized.endX; x++) tiles.delete(tileKey(x, y));
    }

    return compactTilesToZones(tiles);
};

export const WiredSelectorTilePicksView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null } = useWired();
    const { simpleAlert = null } = useNotification();
    const [ zones, setZones ] = useState<Zone[]>([]);
    const [ editMode, setEditMode ] = useState<EditMode>('add');
    const [ isSelecting, setIsSelecting ] = useState(false);
    const editModeRef = useRef<EditMode>('add');
    const isSelectingRef = useRef(false);
    const getSelectionManager = useCallback(() => GetRoomEngine()?.areaSelectionManager, []);

    const updateHighlights = useCallback((zoneList: Zone[]) =>
    {
        const manager = GetRoomEngine()?.areaSelectionManager;

        if(!manager) return;

        if(zoneList.length === 0)
        {
            manager.clearHighlight();
            return;
        }

        manager.setHighlights(zonesToHighlightAreas(zoneList));
    }, []);

    const clearAll = useCallback(() =>
    {
        isSelectingRef.current = false;
        getSelectionManager()?.clearHighlight();
        setZones([]);
        setIsSelecting(false);
    }, [ getSelectionManager ]);

    const startSelectingMode = useCallback((mode: EditMode) =>
    {
        const manager = getSelectionManager();

        if(!manager) return;

        if(isSelectingRef.current)
        {
            const wasSameMode = editModeRef.current === mode;

            isSelectingRef.current = false;
            manager.clearHighlight();
            updateHighlights(zones);
            setIsSelecting(false);

            if(wasSameMode) return;
        }

        setEditMode(mode);
        editModeRef.current = mode;
        setIsSelecting(true);
        isSelectingRef.current = true;
        manager.startSelecting(true);
    }, [ getSelectionManager, updateHighlights, zones ]);

    const save = useCallback((filterExistingSelection = false, invert = false) =>
    {
        const params: number[] = [
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0,
            zones.length
        ];

        for(const zone of zones) params.push(zone.startX, zone.startY, zone.endX, zone.endY);

        setIntParams(params);
    }, [ zones, setIntParams ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const manager = getSelectionManager();

        if(!manager) return;

        const callback = (x: number, y: number, width: number, height: number) =>
        {
            if(width <= 0 || height <= 0)
            {
                if(isSelectingRef.current) manager.startSelecting(true);
                return;
            }

            const selectedZone = normalizeZone({
                startX: x,
                startY: y,
                endX: x + width - 1,
                endY: y + height - 1
            });

            setZones(previous =>
            {
                if(editModeRef.current === 'remove')
                {
                    const updated = removeZoneFromSelection(previous, selectedZone);

                    updateHighlights(updated);

                    if(isSelectingRef.current) manager.startSelecting(true);

                    return updated;
                }

                if(zoneOverlapsSelection(previous, selectedZone))
                {
                    simpleAlert(LocalizeText('wiredfurni.error.tile_picks'));
                    updateHighlights(previous);

                    if(isSelectingRef.current) manager.startSelecting(true);

                    return previous;
                }

                const updated = [ ...previous, selectedZone ];

                updateHighlights(updated);

                if(isSelectingRef.current) manager.startSelecting(true);

                return updated;
            });
        };

        const activated = manager.activate(callback, HIGHLIGHT_BRIGHTEN);

        if(activated)
        {
            const intData = trigger.intData || [];

            if(intData.length >= 3)
            {
                const count = intData[2];
                const loaded: Zone[] = [];

                for(let i = 0; i < count; i++)
                {
                    const base = 3 + (i * 4);

                    if(base + 3 < intData.length)
                    {
                        loaded.push(normalizeZone({
                            startX: intData[base],
                            startY: intData[base + 1],
                            endX: intData[base + 2],
                            endY: intData[base + 3]
                        }));
                    }
                }

                updateHighlights(loaded);
            }
        }

        const handleMouseUp = () => manager.finishSelecting();

        window.addEventListener('mouseup', handleMouseUp, true);
        window.addEventListener('blur', handleMouseUp);

        return () =>
        {
            window.removeEventListener('mouseup', handleMouseUp, true);
            window.removeEventListener('blur', handleMouseUp);
            manager.deactivate();
            setIsSelecting(false);
            isSelectingRef.current = false;
        };
    }, [ getSelectionManager, simpleAlert, trigger, updateHighlights ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData || [];

        if(intData.length >= 3)
        {
            const count = intData[2];
            const loaded: Zone[] = [];

            for(let i = 0; i < count; i++)
            {
                const base = 3 + (i * 4);

                if(base + 3 < intData.length)
                {
                    loaded.push(normalizeZone({
                        startX: intData[base],
                        startY: intData[base + 1],
                        endX: intData[base + 2],
                        endY: intData[base + 3]
                    }));
                }
            }

            setZones(loaded);
            updateHighlights(loaded);
        }
        else
        {
            setZones([]);
            updateHighlights([]);
        }
    }, [ trigger, updateHighlights ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const manager = getSelectionManager();

        if(!manager) return;

        manager.setHighlightType(HIGHLIGHT_BRIGHTEN);
    }, [ getSelectionManager, trigger ]);

    const hasSelectedTiles = zones.length > 0;

    return (
        <WiredSelectorBaseView
            hasSpecialInput={ true }
            requiresFurni={ 0 }
            save={ save }
            showSelectorOptions={ true }
            selectorOptionOffset={ 0 }>
            <WiredParam titleKey="wiredfurni.params.tile_picks">
                <WiredInfoDesc textKey="wiredfurni.params.tile_picks.info" />

                <div className="nw-selector-tool-row">
                    <WiredSelectorToolButton
                        icon={ WiredIcon.addTileSelector }
                        active={ editMode === 'add' && isSelecting }
                        onClick={ () => startSelectingMode('add') }
                    />
                    <WiredSelectorToolButton
                        icon={ WiredIcon.removeTileSelector }
                        active={ editMode === 'remove' && isSelecting }
                        onClick={ () => startSelectingMode('remove') }
                    />
                    <div className="nw-selector-tool-separator" />
                    { hasSelectedTiles &&
                        <WiredButton className="nw-inline-btn" onClick={ clearAll }>
                            { LocalizeText('wiredfurni.params.area_selection.clear') }
                        </WiredButton>
                    }
                </div>
            </WiredParam>
        </WiredSelectorBaseView>
    );
};
