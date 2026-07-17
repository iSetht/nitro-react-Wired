import { FC, useState } from 'react';
import { ChestRewardPopupEvent, ChestRewardPopupItem, GetRoomEngine, LocalizeText, RegisterContractMessages } from '../../api';
import { Base, BitmapText, Flex, NitroCardView } from '../../common';
import { useMessageEvent } from '../../hooks';
import chestCoinIcon from '../../assets/images/wired/chest_coin.png';

interface RewardPopup
{
    id: number;
    message: string;
    credits: number;
    items: ChestRewardPopupItem[];
}

let popupId = 0;

const text = (key: string, fallback: string) =>
{
    const localized = LocalizeText(key);

    return localized && localized !== key ? localized : fallback;
};

const furniIconUrl = (productType: string, spriteId: number) =>
    productType === 'wall'
        ? GetRoomEngine().getFurnitureWallIconUrl(spriteId)
        : GetRoomEngine().getFurnitureFloorIconUrl(spriteId);

export const RewardPopupView: FC<{}> = () =>
{
    RegisterContractMessages();

    const [ popups, setPopups ] = useState<RewardPopup[]>([]);

    useMessageEvent<ChestRewardPopupEvent>(ChestRewardPopupEvent, event =>
    {
        const parser = event.getParser();

        setPopups(prev => [
            ...prev.slice(-2),
            {
                id: ++popupId,
                message: parser.message,
                credits: parser.credits,
                items: parser.items
            }
        ]);
    });

    if(!popups.length) return null;

    return (
        <Base className="nitro-wired-reward-popups">
            { popups.map(popup =>
                <NitroCardView key={ popup.id } uniqueKey={ `wired-reward-popup-${ popup.id }` } theme="wired-tools" handleSelector=".wired-tools-drag-area" classNames={ [ 'nitro-wired-reward-popup' ] }>
                    <div className="wired-tools-window-top wired-tools-drag-area">
                        <BitmapText className="wired-tools-window-title" font="il_heading_1" text={ text('wiredcontracts.reward_contract.reward_popup', 'Reward pop-up') } scale={ 1 } />
                        <button className="nw-btn nw-btn-close" type="button" onClick={ () => setPopups(prev => prev.filter(item => item.id !== popup.id)) } />
                    </div>
                    <div className="reward-popup-body">
                        { popup.message && <span className="reward-popup-message">{ popup.message }</span> }
                        <Flex gap={ 1 } wrap className="reward-popup-items">
                            { popup.credits > 0 &&
                                <RewardTile amount={ popup.credits }>
                                    <img className="contract-credit-icon" alt="" src={ chestCoinIcon } />
                                </RewardTile> }
                            { popup.items.map(item =>
                                <RewardTile key={ item.furniCode } amount={ item.amount }>
                                    <img className="contract-furni-icon" alt="" src={ furniIconUrl(item.productType, item.spriteId) } />
                                </RewardTile>) }
                        </Flex>
                    </div>
                </NitroCardView>) }
        </Base>
    );
};

const RewardTile: FC<{ amount: number; children: any; }> = props =>
{
    return (
        <Base className="contract-element-tile">
            { props.children }
            <span className="contract-amount-badge">{ props.amount }</span>
        </Base>
    );
};
