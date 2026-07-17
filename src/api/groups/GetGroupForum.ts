import { GetForumsListMessageComposer } from '@nitrots/nitro-renderer';
import { SendMessageComposer } from '..';

export function GetGroupForum(groupId: number, offset: number = 0, amount: number = 20): void
{
    console.log(`📨 Sending request for threads: groupId=${groupId}, offset=${offset}, amount=${amount}`);
    SendMessageComposer(new GetForumsListMessageComposer(groupId, offset, amount));
}
