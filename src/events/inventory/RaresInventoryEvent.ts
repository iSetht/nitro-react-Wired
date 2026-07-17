import { NitroEvent } from '@nitrots/nitro-renderer';
import { GroupItem } from '../../api';

export class RaresInventoryEvent extends NitroEvent
{
    public static RARES_RECEIVED: string = 'RIE_RARES_RECEIVED';

    constructor(public readonly items: GroupItem[])
    {
        super(RaresInventoryEvent.RARES_RECEIVED);
    }
}
