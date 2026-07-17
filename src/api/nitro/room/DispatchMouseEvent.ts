import { MouseEventType } from '@nitrots/nitro-renderer';
import { GetRoomEngine } from './GetRoomEngine';

let didMouseMove = false;
let lastClick = 0;
let clickCount = 0;
let mouseDown = false;
let trackedAltKey = false;
let trackedCtrlKey = false;
let trackedShiftKey = false;

const stopHoldTracking = () =>
{
    mouseDown = false;
};

document.addEventListener(MouseEventType.MOUSE_UP, stopHoldTracking);

export const DispatchMouseEvent = (event: MouseEvent, canvasId: number = 1) =>
{
    const x = event.clientX;
    const y = event.clientY;

    trackedAltKey = event.altKey;
    trackedCtrlKey = (event.ctrlKey || event.metaKey);
    trackedShiftKey = event.shiftKey;

    let eventType = event.type;

    if(eventType === MouseEventType.MOUSE_CLICK)
    {
        if(lastClick)
        {
            clickCount = 1;

            if(lastClick >= Date.now() - 300) clickCount++;
        }

        lastClick = Date.now();

        if(clickCount === 2)
        {
            if(!didMouseMove) eventType = MouseEventType.DOUBLE_CLICK;

            clickCount = 0;
            lastClick = null;
        }
    }

    switch(eventType)
    {
        case MouseEventType.MOUSE_CLICK:
            break;
        case MouseEventType.DOUBLE_CLICK:
            break;
        case MouseEventType.MOUSE_MOVE:
            didMouseMove = true;
            break;
        case MouseEventType.MOUSE_DOWN:
            didMouseMove = false;
            mouseDown = true;
            break;
        case MouseEventType.MOUSE_UP:
            stopHoldTracking();
            break;
        case MouseEventType.RIGHT_CLICK:
            break;
        default: return;
    }
    
    const buttonDown = mouseDown || event.buttons > 0;
    GetRoomEngine().dispatchMouseEvent(canvasId, x, y, eventType, event.altKey, trackedCtrlKey, event.shiftKey, buttonDown);
}
