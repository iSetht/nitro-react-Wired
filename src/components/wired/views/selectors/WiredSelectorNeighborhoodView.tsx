import { FC, MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import { WiredButtonInfoText, WiredParam, WiredTextInput, WiredVariableTypeSelector, WIRED_VARIABLE_FURNI, WIRED_VARIABLE_USER } from '../WiredControls';
import { WiredIcon } from '../WiredIcons';
import { WiredSelectorBaseView, WiredSelectorOptionsParam, WiredSelectorToolButton } from './WiredSelectorBaseView';

const GRID_COLLAPSED = 11;
const GRID_EXPANDED = 21;
const SOURCE_KIND_FURNI = 0;
const SOURCE_KIND_USER = 1;
const SOURCE_TRIGGER = 0;
const SOURCE_SELECTED = 100;
const SOURCE_SIGNAL = 201;
const MAXIMUM_FURNI_SELECTION = 5;
const TILE_FILL = '#323232';
const TILE_SELECTED = '#0065ca';

type EditMode = 'add' | 'remove' | 'origin';
type SourceKind = typeof SOURCE_KIND_FURNI | typeof SOURCE_KIND_USER;
type DragState = {
    mode: 'paint' | 'rectangle';
    action: 'add' | 'remove';
    startTile?: NeighborhoodTile;
    baseSelection?: Set<string>;
} | null;

interface NeighborhoodTile
{
    x: number;
    y: number;
}

interface WiredSelectorNeighborhoodViewProps
{
    defaultSourceKind: SourceKind;
    defaultSource: number;
}

const buildSpiral = (gridSize: number) =>
{
    const radius = Math.floor(gridSize / 2);
    const points: NeighborhoodTile[] = [ { x: 0, y: 0 } ];
    const directions = [ [ 0, -1 ], [ 1, 0 ], [ 0, 1 ], [ -1, 0 ] ];
    let x = 0;
    let y = 0;
    let stepLength = 1;
    let directionIndex = 0;

    while(points.length < (gridSize * gridSize))
    {
        for(let repeat = 0; repeat < 2; repeat++)
        {
            const direction = directions[directionIndex % directions.length];

            for(let step = 0; step < stepLength; step++)
            {
                x += direction[0];
                y += direction[1];

                if((x >= -radius) && (x <= radius) && (y >= -radius) && (y <= radius))
                {
                    points.push({ x, y });

                    if(points.length === (gridSize * gridSize)) return points;
                }
            }

            directionIndex++;
        }

        stepLength++;
    }

    return points;
};

const tileKey = (x: number, y: number) => `${ x },${ y }`;

const createDefaultSelection = () =>
{
    const selection = new Set<string>();

    for(let y = -2; y <= 2; y++)
    {
        for(let x = -2; x <= 2; x++) selection.add(tileKey(x, y));
    }

    return selection;
};

const encodePattern = (gridSize: number, selection: Set<string>) =>
{
    const words = new Array(Math.ceil((gridSize * gridSize) / 32)).fill(0);

    buildSpiral(gridSize).forEach((tile, index) =>
    {
        if(selection.has(tileKey(tile.x, tile.y))) words[Math.floor(index / 32)] |= (1 << (index % 32));
    });

    return words;
};

const decodePattern = (gridSize: number, words: number[]) =>
{
    const selection = new Set<string>();

    buildSpiral(gridSize).forEach((tile, index) =>
    {
        const word = words[Math.floor(index / 32)] ?? 0;

        if((word & (1 << (index % 32))) !== 0) selection.add(tileKey(tile.x, tile.y));
    });

    return selection;
};

const normalizeGridSize = (gridSize: number) => (gridSize === GRID_EXPANDED) ? GRID_EXPANDED : GRID_COLLAPSED;

const normalizeSourceKind = (sourceKind: number): SourceKind => (sourceKind === SOURCE_KIND_USER) ? SOURCE_KIND_USER : SOURCE_KIND_FURNI;

const normalizeSource = (sourceKind: SourceKind, source: number) =>
{
    if(sourceKind === SOURCE_KIND_USER) return (source === SOURCE_SIGNAL) ? SOURCE_SIGNAL : SOURCE_TRIGGER;

    return [ SOURCE_TRIGGER, SOURCE_SELECTED, SOURCE_SIGNAL ].includes(source) ? source : SOURCE_SELECTED;
};

const getTileMetrics = () =>
{
    return { tileWidth: 16, tileHeight: 8 };
};

const getGridMetrics = (gridSize: number) =>
{
    const { tileWidth, tileHeight } = getTileMetrics();

    return {
        tileWidth,
        tileHeight,
        width: gridSize * tileWidth,
        height: gridSize * tileHeight
    };
};

const HABBO_TILE_WIDTH = 18;
const HABBO_TILE_HEIGHT = 9;

// K = black outline
// F = tile fill
// W = white selected outline
// . = transparent / do nothing
const TILE_MASK_EMPTY = [
    '........KK........',
    '......KK..KK......',
    '....KK......KK....',
    '..KK..........KK..',
    'KK..............KK',
    '..KK..........KK..',
    '....KK......KK....',
    '......KK..KK......',
    '........KK........'
];

const TILE_MASK_FILLED = [
    '........KK........',
    '......KKFFKK......',
    '....KKFFFFFFKK....',
    '..KKFFFFFFFFFFKK..',
    'KKFFFFFFFFFFFFFFKK',
    '..KKFFFFFFFFFFKK..',
    '....KKFFFFFFKK....',
    '......KKFFKK......',
    '........KK........'
];

const TILE_MASK_SELECTED_EMPTY = [
    '........KK........',
    '......KKWWKK......',
    '....KKWW..WWKK....',
    '..KKWW......WWKK..',
    'KKWW..........WWKK',
    '..KKWW......WWKK..',
    '....KKWW..WWKK....',
    '......KKWWKK......',
    '........KK........'
];

const TILE_MASK_SELECTED_FILLED = [
    '........KK........',
    '......KKWWKK......',
    '....KKWWFFWWKK....',
    '..KKWWFFFFFFWWKK..',
    'KKWWFFFFFFFFFFWWKK',
    '..KKWWFFFFFFWWKK..',
    '....KKWWFFWWKK....',
    '......KKWWKK......',
    '........KK........'
];

const drawGridBorder = (
    context: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    gridHw: number,
    gridHh: number
) =>
{
    // inner-to-outer so white paints last over black
    const rings: Array<{ offset: number; color: string }> = [
        { offset: 3, color: '#000000' },
        { offset: 2, color: '#000000' },
        { offset: 1, color: '#000000' },
        { offset: 4, color: '#ffffff' },
    ];

    for(const { offset, color } of rings)
    {
        context.fillStyle = color;

        const hw = gridHw + offset * 2;
        const hh = gridHh + offset;
        const steps = hw / 2;

        for(let i = 0; i < steps; i++)
        {
            const dx = i * 2;
            const dy = i;

            context.fillRect(Math.round(cx + dx),          Math.round(cy - hh + dy + 1), 2, 1);
            context.fillRect(Math.round(cx - dx - 2),      Math.round(cy - hh + dy + 1), 2, 1);
            context.fillRect(Math.round(cx + dx),          Math.round(cy + hh - dy - 1), 2, 1);
            context.fillRect(Math.round(cx - dx - 2),      Math.round(cy + hh - dy - 1), 2, 1);
        }
    }
};

const drawHabboTile = (
    context: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    fillColor: string | null,
    selected: boolean
) =>
{
    const mask = fillColor
        ? (selected ? TILE_MASK_SELECTED_FILLED : TILE_MASK_FILLED)
        : (selected ? TILE_MASK_SELECTED_EMPTY : TILE_MASK_EMPTY);

    const startX = Math.round(cx - 9);
    const startY = Math.round(cy - 4);

    for(let y = 0; y < HABBO_TILE_HEIGHT; y++)
    {
        const row = mask[y];

        for(let x = 0; x < row.length; x++)
        {
            const pixel = row[x];

            if(pixel === '.') continue;

            if(pixel === 'K') context.fillStyle = '#000000';
            else if(pixel === 'W') context.fillStyle = '#ffffff';
            else if(pixel === 'F') context.fillStyle = fillColor ?? '#323232';

            context.fillRect(startX + x, startY + y, 1, 1);
        }
    }
};

const getCanvasFrameMetrics = (gridSize: number) =>
{
    const gridMetrics = getGridMetrics(gridSize);

    return {
        ...gridMetrics,
        outerHw: (gridMetrics.width / 2) + 14,
        outerHh: (gridMetrics.height / 2) + 8,
        blackHw: (gridMetrics.width / 2) + 8,
        blackHh: (gridMetrics.height / 2) + 4,
        fillHw: gridMetrics.width / 2,
        fillHh: gridMetrics.height / 2
    };
};

export const WiredSelectorNeighborhoodView: FC<WiredSelectorNeighborhoodViewProps> = props =>
{
    const { defaultSourceKind = SOURCE_KIND_FURNI, defaultSource = SOURCE_SELECTED } = props;
    const [ gridSize, setGridSize ] = useState(GRID_COLLAPSED);
    const [ editMode, setEditMode ] = useState<EditMode>('add');
    const [ originX, setOriginX ] = useState(0);
    const [ originY, setOriginY ] = useState(0);
    const [ selection, setSelection ] = useState(createDefaultSelection);
    const [ sourceKind, setSourceKind ] = useState<SourceKind>(defaultSourceKind);
    const [ source, setSource ] = useState(defaultSource);
    const [ filterExistingSelection, setFilterExistingSelection ] = useState(false);
    const [ invert, setInvert ] = useState(false);
    const [ dragState, setDragState ] = useState<DragState>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { trigger = null, setIntParams = null, furniIds = [] } = useWired();

    const tiles = useMemo(() =>
    {
        const radius = Math.floor(gridSize / 2);
        const result: NeighborhoodTile[] = [];

        for(let y = -radius; y <= radius; y++)
        {
            for(let x = -radius; x <= radius; x++) result.push({ x, y });
        }

        return result;
    }, [ gridSize ]);

    const canvasMetrics = getCanvasFrameMetrics(gridSize);
    const canvasWidth = canvasMetrics.outerHw * 2;
    const canvasHeight = canvasMetrics.outerHh * 2;
    const canvasCX = canvasWidth / 2;
    const canvasCY = canvasHeight / 2;
    const canvasTileHw = canvasMetrics.tileWidth / 2;
    const canvasTileHh = canvasMetrics.tileHeight / 2;

    const applySourceKind = (nextSourceKind: SourceKind) =>
    {
        setSourceKind(nextSourceKind);
        setSource(normalizeSource(nextSourceKind, nextSourceKind === SOURCE_KIND_USER ? SOURCE_TRIGGER : SOURCE_SELECTED));
    };

    useEffect(() =>
    {
        const clearDragState = () => setDragState(null);

        window.addEventListener('mouseup', clearDragState);

        return () => window.removeEventListener('mouseup', clearDragState);
    }, []);

    useEffect(() =>
    {
        const canvas = canvasRef.current;

        if(!canvas) return;

        const context = canvas.getContext('2d');

        if(!context) return;

        context.imageSmoothingEnabled = false;
        context.clearRect(0, 0, canvasWidth, canvasHeight);

        drawGridBorder(
            context,
            canvasCX,
            canvasCY,
            canvasMetrics.fillHw,
            canvasMetrics.fillHh
        );

        tiles
            .slice()
            .sort((a, b) => (a.x + a.y) - (b.x + b.y))
            .forEach(tile =>
            {
                const tcx = canvasCX + (tile.x - tile.y) * canvasTileHw;
                const tcy = canvasCY + (tile.x + tile.y) * canvasTileHh;

                const isSelected = selection.has(tileKey(tile.x, tile.y));
                const isOrigin = tile.x === originX && tile.y === originY;

                drawHabboTile(
                    context,
                    tcx,
                    tcy,
                    isSelected ? TILE_SELECTED : TILE_FILL,
                    isOrigin
                );
            });
    }, [ canvasCX, canvasCY, canvasHeight, canvasMetrics, canvasTileHh, canvasTileHw, canvasWidth, gridSize, originX, originY, selection, tiles ]);

    const save = () =>
    {
        const patternWords = encodePattern(gridSize, selection);

        setIntParams([
            gridSize,
            originX,
            originY,
            sourceKind,
            source,
            patternWords.length,
            ...patternWords,
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData || [];
        const savedGridSize = normalizeGridSize(intData[0] ?? GRID_COLLAPSED);
        const patternWordCount = Math.max(0, Math.min(intData[5] ?? 0, Math.ceil((savedGridSize * savedGridSize) / 32)));
        const patternWords = intData.slice(6, 6 + patternWordCount);
        const savedSourceKind = normalizeSourceKind(intData[3] ?? defaultSourceKind);

        const optionOffset = 6 + patternWordCount;

        setGridSize(savedGridSize);
        setOriginX(intData[1] ?? 0);
        setOriginY(intData[2] ?? 0);
        setSourceKind(savedSourceKind);
        setSource(normalizeSource(savedSourceKind, intData[4] ?? defaultSource));
        setSelection(patternWords.some(word => word !== 0) ? decodePattern(savedGridSize, patternWords) : createDefaultSelection());
        setFilterExistingSelection((intData.length > optionOffset) ? (intData[optionOffset] === 1) : false);
        setInvert((intData.length > (optionOffset + 1)) ? (intData[optionOffset + 1] === 1) : false);
    }, [ trigger, defaultSourceKind, defaultSource ]);

    const paintTile = (tile: NeighborhoodTile, action: 'add' | 'remove') =>
    {
        const key = tileKey(tile.x, tile.y);

        setSelection(previous =>
        {
            const nextSelection = new Set(previous);

            if(action === 'add') nextSelection.add(key);
            else nextSelection.delete(key);

            return nextSelection;
        });
    };

    const paintRectangle = (startTile: NeighborhoodTile, endTile: NeighborhoodTile, action: 'add' | 'remove', baseSelection: Set<string>) =>
    {
        const nextSelection = new Set(baseSelection);
        const minX = Math.min(startTile.x, endTile.x);
        const maxX = Math.max(startTile.x, endTile.x);
        const minY = Math.min(startTile.y, endTile.y);
        const maxY = Math.max(startTile.y, endTile.y);

        for(let y = minY; y <= maxY; y++)
        {
            for(let x = minX; x <= maxX; x++)
            {
                const key = tileKey(x, y);

                if(action === 'add') nextSelection.add(key);
                else nextSelection.delete(key);
            }
        }

        setSelection(nextSelection);
    };

    const getTileFromCanvasEvent = (event: ReactMouseEvent<HTMLCanvasElement>) =>
    {
        const canvas = canvasRef.current;

        if(!canvas) return null;

        const bounds = canvas.getBoundingClientRect();
        const px = (event.clientX - bounds.left) * (canvas.width / bounds.width);
        const py = (event.clientY - bounds.top) * (canvas.height / bounds.height);
        const ix = (px - canvasCX) / canvasTileHw;
        const iy = (py - canvasCY) / canvasTileHh;
        const tileX = Math.floor((ix + iy) / 2);
        const tileY = Math.floor((iy - ix) / 2);
        const radius = Math.floor(gridSize / 2);

        if((tileX < -radius) || (tileX > radius) || (tileY < -radius) || (tileY > radius)) return null;

        return { x: tileX, y: tileY };
    };

    const beginTileDrag = (event: ReactMouseEvent<HTMLElement>, tile: NeighborhoodTile) =>
    {
        event.preventDefault();

        if(editMode === 'origin')
        {
            setOriginX(tile.x);
            setOriginY(tile.y);
            return;
        }

        const action = editMode === 'remove' ? 'remove' : 'add';

        if(event.shiftKey)
        {
            const baseSelection = new Set(selection);

            setDragState({ mode: 'rectangle', action, startTile: tile, baseSelection });
            paintRectangle(tile, tile, action, baseSelection);
            return;
        }

        setDragState({ mode: 'paint', action });
        paintTile(tile, action);
    };

    const continueTileDrag = (event: ReactMouseEvent<HTMLElement>, tile: NeighborhoodTile) =>
    {
        if(!(event.buttons & 1) || !dragState) return;

        if(dragState.mode === 'rectangle' && dragState.startTile && dragState.baseSelection)
        {
            paintRectangle(dragState.startTile, tile, dragState.action, dragState.baseSelection);
            return;
        }

        paintTile(tile, dragState.action);
    };

    const beginCanvasDrag = (event: ReactMouseEvent<HTMLCanvasElement>) =>
    {
        const tile = getTileFromCanvasEvent(event);

        if(!tile) return;

        beginTileDrag(event, tile);
    };

    const continueCanvasDrag = (event: ReactMouseEvent<HTMLCanvasElement>) =>
    {
        const tile = getTileFromCanvasEvent(event);

        if(!tile) return;

        continueTileDrag(event, tile);
    };

    const sourceOptions = sourceKind === SOURCE_KIND_USER
        ? [ SOURCE_TRIGGER, SOURCE_SIGNAL ]
        : [ SOURCE_TRIGGER, SOURCE_SELECTED, SOURCE_SIGNAL ];

    const isSelectedSource = sourceKind === SOURCE_KIND_FURNI && source === SOURCE_SELECTED;
    const requiresFurni = isSelectedSource
        ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE
        : WiredFurniType.STUFF_SELECTION_OPTION_NONE;
    const sourceSelector: WiredSourceSelectorConfig = {
        value: source,
        onChange: nextSource => setSource(normalizeSource(sourceKind, nextSource)),
        options: sourceOptions,
        titleKey: 'wiredfurni.params.sources.merged.title.neighborhood',
        labelPrefix: sourceKind === SOURCE_KIND_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources.furni',
        optionLabels: {
            [SOURCE_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ furniIds.length }/${ MAXIMUM_FURNI_SELECTION }]`
        },
        titleAccessory: (
            <WiredVariableTypeSelector
                value={ sourceKind === SOURCE_KIND_USER ? WIRED_VARIABLE_USER : WIRED_VARIABLE_FURNI }
                onChange={ variableType => applySourceKind(variableType === WIRED_VARIABLE_USER ? SOURCE_KIND_USER : SOURCE_KIND_FURNI) }
                hiddenTypes={ [ 1, 3 ] } />
        )
    };

    return (
        <WiredSelectorBaseView
            requiresFurni={ requiresFurni }
            hideFurniSelector={ isSelectedSource }
            hasSpecialInput={ true }
            save={ save }
            expandedWindow={ gridSize === GRID_EXPANDED }
            sourceSelectors={ [ sourceSelector ] }
            alwaysExpandedSources={ true }
            expanded={ true }
        >
            <WiredParam titleKey="wiredfurni.params.neighborhood_selection">
                <div className="d-flex flex-column gap-2 wired-neighborhood-selector">
                <Flex alignItems="center" justifyContent="between">
                    <div className="nw-selector-tool-row">
                        <WiredSelectorToolButton icon={ WiredIcon.addTileSelector } active={ editMode === 'add' } onClick={ () => setEditMode('add') } />
                        <WiredSelectorToolButton icon={ WiredIcon.removeTileSelector } active={ editMode === 'remove' } onClick={ () => setEditMode('remove') } />
                        <div className="nw-selector-tool-separator" />
                        <WiredSelectorToolButton icon={ WiredIcon.changeOriginSelector } active={ editMode === 'origin' } onClick={ () => setEditMode('origin') } />
                    </div>

                    <WiredSelectorToolButton
                        icon={ gridSize === GRID_COLLAPSED ? WiredIcon.maximizeSelector : WiredIcon.minimizeSelector }
                        onClick={ () => setGridSize(value => value === GRID_COLLAPSED ? GRID_EXPANDED : GRID_COLLAPSED) }
                    />
                </Flex>

                <div style={ { height: canvasHeight + 18, width: gridSize === GRID_EXPANDED ? 394 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#c9c9c9', borderRadius: 6, overflow: 'hidden' } }>
                    <canvas
                        ref={ canvasRef }
                        width={ canvasWidth }
                        height={ canvasHeight }
                        onMouseDown={ beginCanvasDrag }
                        onMouseMove={ continueCanvasDrag }
                        style={ { display: 'block', flexShrink: 0, cursor: 'pointer', width: canvasWidth, height: canvasHeight, imageRendering: 'pixelated' } }
                    />
                </div>

                <Flex alignItems="center" justifyContent="end" gap={ 1 }>
                    <WiredButtonInfoText>x:</WiredButtonInfoText>
                    <WiredTextInput className="nw-w-32" type="number" value={ originX } onChange={ event => setOriginX(parseInt(event.target.value || '0')) } />
                    <WiredButtonInfoText>y:</WiredButtonInfoText>
                    <WiredTextInput className="nw-w-32" type="number" value={ originY } onChange={ event => setOriginY(parseInt(event.target.value || '0')) } />
                </Flex>

                </div>
            </WiredParam>

            <WiredSelectorOptionsParam
                filterExistingSelection={ filterExistingSelection }
                invert={ invert }
                onFilterExistingSelectionChange={ setFilterExistingSelection }
                onInvertChange={ setInvert }
                divider={ false } />
        </WiredSelectorBaseView>
    );
};
