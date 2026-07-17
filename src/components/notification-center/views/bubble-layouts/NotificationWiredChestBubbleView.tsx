import chestNotificationIcon from '../../../../assets/images/wired/chest_notification.png';
import chestCoinIcon from '../../../../assets/images/wired/chest_coin.png';
import chestFurniIcon from '../../../../assets/images/wired/chest_furni.png';
import { GetUserProfile, NotificationBubbleItem } from '../../../../api';
import { LayoutNotificationBubbleView, LayoutNotificationBubbleViewProps } from '../../../../common';

export interface NotificationWiredChestBubbleViewProps extends LayoutNotificationBubbleViewProps
{
    item: NotificationBubbleItem;
}

export const NotificationWiredChestBubbleView: FC<NotificationWiredChestBubbleViewProps> = props =>
{
    const { item = null, onClose = null, ...rest } = props;
    const data = item?.data || {};
    const lines = (item?.message || '').split(/\r\n|\r|\n/g).filter(line => line.length);
    const userId = Number(data.userId || 0);
    const username = data.username || '';
    const furniCount = Number(data.furniCount || 0);
    const coinCount = Number(data.coinCount || 0);
    const amountLinePattern = /^\d+\s+(Furni|Coins)$/i;
    const bodyLines = lines.filter(line => !amountLinePattern.test(line));
    const primaryLine = bodyLines[0] || '';
    const secondaryLines = bodyLines.slice(1);

    return (
        <LayoutNotificationBubbleView
            fadesOut={ !data.persistent }
            timeoutMs={ item.timeoutMs || 8000 }
            className="wired-chest-notification"
            onClose={ onClose }
            onClick={ event => event.stopPropagation() }
            { ...rest }>
            <button
                className="wired-chest-notification-close"
                type="button"
                onClick={ event =>
                {
                    event.stopPropagation();
                    onClose();
                } }>
                X
            </button>
            <div className="wired-chest-notification-body">
                <div className="wired-chest-notification-main">
                    <img className="wired-chest-notification-icon" src={ chestNotificationIcon } alt="" />
                    <div className="wired-chest-notification-copy">
                        <div className={ username ? 'wired-chest-notification-line' : 'wired-chest-notification-title' }>
                            { username &&
                                <button
                                    className="wired-chest-notification-user"
                                    type="button"
                                    onClick={ event =>
                                    {
                                        event.stopPropagation();
                                        if(userId > 0) GetUserProfile(userId);
                                    } }>
                                    { username }
                                </button> }
                            { primaryLine && <span>{ username ? ` ${ primaryLine }` : primaryLine }</span> }
                        </div>
                        { secondaryLines.map((line, index) =>
                            <div key={ index } className="wired-chest-notification-subline">{ line }</div>) }
                    </div>
                </div>
                { (furniCount > 0 || coinCount > 0) &&
                    <div className="wired-chest-notification-rewards">
                        { furniCount > 0 &&
                            <div className="wired-chest-notification-reward">
                                <img className="wired-chest-notification-reward-icon" src={ chestFurniIcon } alt="" />
                                <span>{ `${ furniCount } Furni` }</span>
                            </div> }
                        { coinCount > 0 &&
                            <div className="wired-chest-notification-reward">
                                <img className="wired-chest-notification-reward-icon" src={ chestCoinIcon } alt="" />
                                <span>{ `${ coinCount } Coins` }</span>
                            </div> }
                    </div> }
            </div>
        </LayoutNotificationBubbleView>
    );
}
