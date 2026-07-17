import { WiredTriggerLayout } from '../../../../api';
import { WiredTriggerAtSetTimeView } from './WiredTriggerAtSetTimeView';
import { WiredTriggerAvatarClicksAvatarView } from './WiredTriggerAvatarClicksAvatarView';
import { WiredTriggerAvatarClicksFurniView } from './WiredTriggerAvatarClicksFurniView';
import { WiredTriggerAvatarClicksTileView } from './WiredTriggerAvatarClicksTileView';
import { WiredTriggerAvatarEntersRoomView } from './WiredTriggerAvatarEntersRoomView';
import { WiredTriggerAvatarLeavesRoomView } from './WiredTriggerAvatarLeavesRoomView';
import { WiredTriggerAvatarPerformsActionView } from './WiredTriggerAvatarPerformsActionView';
import { WiredTriggerAvatarSaysKeywordView } from './WiredTriggerAvatarSaysKeywordView';
import { WiredTriggerAvatarWalksOffFurniView } from './WiredTriggerAvatarWalksOffFurniView';
import { WiredTriggerAvatarWalksOnFurniView } from './WiredTriggerAvatarWalksOnFurni';
import { WiredTriggerBotReachedAvatarView } from './WiredTriggerBotReachedAvatarView';
import { WiredTriggerBotReachedFurniView } from './WiredTriggerBotReachedFurniView';
import { WiredTriggerCollisionView } from './WiredTriggerCollisionView';
import { WiredTriggerCounterReachesSetTimeView } from './WiredTriggerCounterReachesSetTimeView';
import { WiredTriggerFurniIsUsedView } from './WiredTriggerFurniIsUsedView';
import { WiredTriggerFurniStateChangeView } from './WiredTriggerFurniStateChangeView';
import { WiredTriggerGameEndsView } from './WiredTriggerGameEndsView';
import { WiredTriggerGameStartsView } from './WiredTriggerGameStartsView';
import { WiredTriggerReceiveSignalView } from './WiredTriggerReceiveSignalView';
import { WiredTriggerRepeaterLongView } from './WiredTriggerRepeaterLongView';
import { WiredTriggerRepeaterShortView } from './WiredTriggerRepeaterShortView';
import { WiredTriggerRepeaterView } from './WiredTriggerRepeaterView';
import { WiredTriggerScoreAchievedView } from './WiredTriggerScoreAchievedView';
import { WiredTriggerTransactionView } from './WiredTriggerTransactionView';
import { WiredTriggerUserReleasesView } from './WiredTriggerUserReleasesView';
import { WiredTriggerVariableChangedView } from './WiredTriggerVariableChangedView';


export const WiredTriggerLayoutView = (code: number) =>
{
    switch(code)
    {
        case WiredTriggerLayout.WALKS_ON_FURNI:
            return <WiredTriggerAvatarWalksOnFurniView />;
        case WiredTriggerLayout.WALKS_OFF_FURNI:
            return <WiredTriggerAvatarWalksOffFurniView />;
        case WiredTriggerLayout.SAYS_KEYWORD:
            return <WiredTriggerAvatarSaysKeywordView />;
        case WiredTriggerLayout.FURNI_USED:
            return <WiredTriggerFurniIsUsedView />;
        case WiredTriggerLayout.FURNI_STATE_CHANGED:
            return <WiredTriggerFurniStateChangeView />;
        case WiredTriggerLayout.ENTER_ROOM:
            return <WiredTriggerAvatarEntersRoomView />;
        case WiredTriggerLayout.LEAVE_ROOM:
            return <WiredTriggerAvatarLeavesRoomView />;
        case WiredTriggerLayout.CLICK_FURNI:
            return <WiredTriggerAvatarClicksFurniView />;
        case WiredTriggerLayout.CLICK_AVATAR:
            return <WiredTriggerAvatarClicksAvatarView />;
        case WiredTriggerLayout.CLICK_TILE:
            return <WiredTriggerAvatarClicksTileView />;
        case WiredTriggerLayout.PERIODICALLY:
            return <WiredTriggerRepeaterView />;
        case WiredTriggerLayout.PERIODICALLY_LONG:
            return <WiredTriggerRepeaterLongView />;
        case WiredTriggerLayout.PERIODICALLY_SHORT:
            return <WiredTriggerRepeaterShortView />;
        case WiredTriggerLayout.PERFORM_ACTION:
            return <WiredTriggerAvatarPerformsActionView />;
        case WiredTriggerLayout.COLLISION:
            return <WiredTriggerCollisionView />;
        case WiredTriggerLayout.RECEIVE_SIGNAL:
            return <WiredTriggerReceiveSignalView />;
        case WiredTriggerLayout.COUNTER_REACHES_SET_TIME:
            return <WiredTriggerCounterReachesSetTimeView />;
        case WiredTriggerLayout.AT_SET_TIME:
            return <WiredTriggerAtSetTimeView />;
        case WiredTriggerLayout.GAME_ENDS:
            return <WiredTriggerGameEndsView />;
        case WiredTriggerLayout.GAME_STARTS:
            return <WiredTriggerGameStartsView />;
        case WiredTriggerLayout.SCORE_ACHIEVED:
            return <WiredTriggerScoreAchievedView />;
        case WiredTriggerLayout.BOT_REACHES_AVATAR:
            return <WiredTriggerBotReachedAvatarView />;
        case WiredTriggerLayout.BOT_REACHES_FURNI:
            return <WiredTriggerBotReachedFurniView />;
        case WiredTriggerLayout.VARIABLE_CHANGED:
            return <WiredTriggerVariableChangedView />;
        case WiredTriggerLayout.USER_RELEASES:
            return <WiredTriggerUserReleasesView />;
        case WiredTriggerLayout.TRANSACTION_COMPLETED:
        case WiredTriggerLayout.TRANSACTION_FAILED:
            return <WiredTriggerTransactionView />;
    }

    return null;
}
