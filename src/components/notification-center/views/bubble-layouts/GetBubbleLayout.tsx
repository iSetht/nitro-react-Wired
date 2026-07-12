import { NotificationBubbleItem, NotificationBubbleType } from '../../../../api';
import { NotificationClubGiftBubbleView } from './NotificationClubGiftBubbleView';
import { NotificationDefaultBubbleView } from './NotificationDefaultBubbleView';
import { NotificationWiredChestBubbleView } from './NotificationWiredChestBubbleView';

export const GetBubbleLayout = (item: NotificationBubbleItem, onClose: () => void) =>
{
    if(!item) return null;

    const props = { key: item.id, item, onClose };

    switch(item.notificationType)
    {
        case NotificationBubbleType.CLUBGIFT:
            return <NotificationClubGiftBubbleView { ...props } />
        case NotificationBubbleType.WIRED_CHEST:
            return <NotificationWiredChestBubbleView { ...props } />
        default:
            return <NotificationDefaultBubbleView { ...props } />
    }
}
