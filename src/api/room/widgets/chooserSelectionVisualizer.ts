import { GetTicker, IRoomObjectSpriteVisualization, RoomObjectCategory, RoomObjectVariable } from '@nitrots/nitro-renderer';
import { ChooserSelectionFilter, GetRoomEngine } from '../..';

const glowFilter = new ChooserSelectionFilter(
    [0.721, 0.886, 0.988],
    [0.288, 0.354, 0.395]
);

export class chooserSelectionVisualizer
{
    private static _persistentTargets = new Map<string, { id: number; category: number; enabled: boolean; }>();
    private static _isTickerRunning = false;

    public static show(id: number, category: number = RoomObjectCategory.FLOOR, persistent = false): void
    {
        if(persistent)
        {
            chooserSelectionVisualizer._persistentTargets.set(chooserSelectionVisualizer.getKey(id, category), { id, category, enabled: true });
            chooserSelectionVisualizer.updateTicker();
        }

        chooserSelectionVisualizer.apply(id, category);
    }

    public static hide(id: number, category: number = RoomObjectCategory.FLOOR, clearPersistent = true): void
    {
        const key = chooserSelectionVisualizer.getKey(id, category);

        if(clearPersistent) chooserSelectionVisualizer._persistentTargets.delete(key);
        else
        {
            const target = chooserSelectionVisualizer._persistentTargets.get(key);

            if(target) target.enabled = false;
        }

        chooserSelectionVisualizer.clear(id, category);
        chooserSelectionVisualizer.updateTicker();
    }

    public static clearAll(): void
    {
        const roomEngine = GetRoomEngine();

        chooserSelectionVisualizer._persistentTargets.clear();
        chooserSelectionVisualizer.updateTicker();

        const unitObjects = roomEngine.getRoomObjects(roomEngine.activeRoomId, RoomObjectCategory.UNIT);
        const roomObjects = [
            ...roomEngine.getRoomObjects(roomEngine.activeRoomId, RoomObjectCategory.FLOOR),
            ...roomEngine.getRoomObjects(roomEngine.activeRoomId, RoomObjectCategory.WALL),
            ...unitObjects
        ];

        for(const roomObject of roomObjects)
        {
            const visualization = roomObject.visualization as IRoomObjectSpriteVisualization;

            if(roomObject.model && unitObjects.includes(roomObject))
            {
                roomObject.model.setValue(RoomObjectVariable.FIGURE_HIGHLIGHT_ENABLE, 0);
                roomObject.model.setValue(RoomObjectVariable.FIGURE_HIGHLIGHT, 0);
            }

            if(!visualization) continue;

            for(const sprite of visualization.sprites) sprite.filters = [];
        }
    }

    private static getKey(id: number, category: number): string
    {
        return `${ category }:${ id }`;
    }

    private static updateTicker(): void
    {
        const hasEnabledTargets = Array.from(chooserSelectionVisualizer._persistentTargets.values()).some(target => target.enabled);

        if(hasEnabledTargets && !chooserSelectionVisualizer._isTickerRunning)
        {
            GetTicker().add(chooserSelectionVisualizer.refreshPersistentTargets);
            chooserSelectionVisualizer._isTickerRunning = true;
        }
        else if(!hasEnabledTargets && chooserSelectionVisualizer._isTickerRunning)
        {
            GetTicker().remove(chooserSelectionVisualizer.refreshPersistentTargets);
            chooserSelectionVisualizer._isTickerRunning = false;
        }
    }

    private static refreshPersistentTargets = () =>
    {
        chooserSelectionVisualizer._persistentTargets.forEach(target =>
        {
            if(target.enabled) chooserSelectionVisualizer.apply(target.id, target.category);
        });
    };

    private static apply(id: number, category: number): void
    {
        const roomObject = GetRoomEngine().getRoomObject(GetRoomEngine().activeRoomId, id, category);
        if(!roomObject) return;

        if(category === RoomObjectCategory.UNIT)
        {
            roomObject.model.setValue(RoomObjectVariable.FIGURE_HIGHLIGHT_ENABLE, 1);
            roomObject.model.setValue(RoomObjectVariable.FIGURE_HIGHLIGHT, 1);
        }

        const visualization = roomObject.visualization as IRoomObjectSpriteVisualization;
        if (!visualization || !visualization.sprites || !visualization.sprites.length) return;


        for(const sprite of visualization.sprites)
        {
            if(sprite.blendMode === 1) continue;
            sprite.filters = [ glowFilter ];
        }
    }

    private static clear(id: number, category: number): void
    {
        const roomObject = GetRoomEngine().getRoomObject(GetRoomEngine().activeRoomId, id, category);
        if(!roomObject) return;

        if(category === RoomObjectCategory.UNIT)
        {
            roomObject.model.setValue(RoomObjectVariable.FIGURE_HIGHLIGHT_ENABLE, 0);
            roomObject.model.setValue(RoomObjectVariable.FIGURE_HIGHLIGHT, 0);
        }

        const visualization = roomObject.visualization as IRoomObjectSpriteVisualization;
        if(!visualization) return;

        for(const sprite of visualization.sprites) sprite.filters = [];
    }
}
