import { RoomEngineEvent, RoomEngineObjectEvent, RoomId, RoomObjectCategory, RoomObjectVariable } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useRef } from 'react';
import { GetRoomEngine, RegisterWiredFurniOpacityMessages, WiredFurniOpacityEvent, WiredFurniOpacityUpdate } from '../../api';
import { useMessageEvent, useRoomEngineEvent } from '../events';

const MIN_OPACITY = 0;
const MAX_OPACITY = 100;

const itemKey = (roomId: number, itemId: number, category: number) => `${ roomId }:${ category }:${ itemId }`;
const clampOpacity = (value: number) => Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, Number.isFinite(value) ? value : MAX_OPACITY));

interface OpacityTarget
{
    opacity: number;
    clickThrough: boolean;
}

const easeProgress = (progress: number, easing: number) =>
{
    switch(easing)
    {
        case 2:
            return progress * progress * progress;
        case 3:
            return 1 - Math.pow(1 - progress, 3);
        case 4:
            return progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - (Math.pow(-2 * progress + 2, 3) / 2);
        case 1:
        default:
            return progress;
    }
}

export const useWiredFurniOpacity = () =>
{
    RegisterWiredFurniOpacityMessages();

    const targetsRef = useRef<Map<string, OpacityTarget>>(new Map());
    const framesRef = useRef<Map<string, number>>(new Map());

    const cancelAnimation = useCallback((key: string) =>
    {
        const frame = framesRef.current.get(key);

        if(frame !== undefined) cancelAnimationFrame(frame);
        framesRef.current.delete(key);
    }, []);

    const clearState = useCallback(() =>
    {
        framesRef.current.forEach(frame => cancelAnimationFrame(frame));
        framesRef.current.clear();
        targetsRef.current.clear();
    }, []);

    const setObjectOpacity = useCallback((roomId: number, itemId: number, category: number, opacity: number) =>
    {
        const object = GetRoomEngine().getRoomObject(roomId, itemId, category);

        if(!object?.model) return false;

        object.model.setValue(RoomObjectVariable.FURNITURE_WIRED_OPACITY, clampOpacity(opacity) / MAX_OPACITY);
        return true;
    }, []);

    const setObjectClickThrough = useCallback((roomId: number, itemId: number, category: number, clickThrough: boolean) =>
    {
        const object = GetRoomEngine().getRoomObject(roomId, itemId, category);

        if(!object?.model) return false;

        object.model.setValue(RoomObjectVariable.FURNITURE_WIRED_CLICK_THROUGH, clickThrough ? 1 : 0);
        return true;
    }, []);

    const applyUpdate = useCallback((update: WiredFurniOpacityUpdate) =>
    {
        const roomId = update.roomId;
        const category = update.wallItem ? RoomObjectCategory.WALL : RoomObjectCategory.FLOOR;
        const key = itemKey(roomId, update.itemId, category);
        const target = clampOpacity(update.opacity);
        const durationMs = Math.max(0, update.durationMs);

        targetsRef.current.set(key, { opacity: target, clickThrough: update.clickThrough });
        cancelAnimation(key);

        const object = GetRoomEngine().getRoomObject(roomId, update.itemId, category);
        if(!object?.model) return;

        setObjectClickThrough(roomId, update.itemId, category, update.clickThrough);

        const savedStart = object.model.getValue<number>(RoomObjectVariable.FURNITURE_WIRED_OPACITY);
        const start = Number.isFinite(savedStart) ? clampOpacity(savedStart * MAX_OPACITY) : MAX_OPACITY;

        if(update.easing === 0 || durationMs === 0 || start === target)
        {
            setObjectOpacity(roomId, update.itemId, category, target);
            return;
        }

        const startedAt = performance.now();
        const animate = (time: number) =>
        {
            const progress = Math.min(1, Math.max(0, (time - startedAt) / durationMs));
            const opacity = start + ((target - start) * easeProgress(progress, update.easing));

            if(!setObjectOpacity(roomId, update.itemId, category, opacity) || progress >= 1)
            {
                framesRef.current.delete(key);
                return;
            }

            framesRef.current.set(key, requestAnimationFrame(animate));
        };

        framesRef.current.set(key, requestAnimationFrame(animate));
    }, [ cancelAnimation, setObjectClickThrough, setObjectOpacity ]);

    const onOpacity = useCallback((event: WiredFurniOpacityEvent) =>
    {
        event.getParser().updates.forEach(applyUpdate);
    }, [ applyUpdate ]);

    const onObjectEvent = useCallback((event: RoomEngineObjectEvent) =>
    {
        if(event.category !== RoomObjectCategory.FLOOR && event.category !== RoomObjectCategory.WALL) return;

        const key = itemKey(event.roomId, event.objectId, event.category);

        if(event.type === RoomEngineObjectEvent.REMOVED)
        {
            cancelAnimation(key);
            targetsRef.current.delete(key);
            return;
        }

        const target = targetsRef.current.get(key);
        if(target !== undefined)
        {
            setObjectOpacity(event.roomId, event.objectId, event.category, target.opacity);
            setObjectClickThrough(event.roomId, event.objectId, event.category, target.clickThrough);
        }
    }, [ cancelAnimation, setObjectClickThrough, setObjectOpacity ]);

    const onRoomEvent = useCallback((event: RoomEngineEvent) =>
    {
        if(RoomId.isRoomPreviewerId(event.roomId)) return;
        if(event.type === RoomEngineEvent.DISPOSED) clearState();
    }, [ clearState ]);

    useMessageEvent<WiredFurniOpacityEvent>(WiredFurniOpacityEvent, onOpacity);
    useRoomEngineEvent<RoomEngineObjectEvent>([ RoomEngineObjectEvent.ADDED, RoomEngineObjectEvent.REMOVED ], onObjectEvent);
    useRoomEngineEvent<RoomEngineEvent>(RoomEngineEvent.DISPOSED, onRoomEvent);
    useEffect(() => clearState, [ clearState ]);
}
