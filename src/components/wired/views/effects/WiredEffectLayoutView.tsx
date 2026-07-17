import { WiredEffectLayout } from '../../../../api';
import { WiredEffectAdjustCounterTimeView } from './WiredEffectAdjustCounterTimeView';
import { WiredEffectBotChangeClothesView } from './WiredEffectBotChangeClothesView';
import { WiredEffectBotFollowAvatarView } from './WiredEffectBotFollowAvatarView';
import { WiredEffectBotGiveHandItemView } from './WiredEffectBotGiveHandItemView';
import { WiredEffectBotTalkToAvatarView } from './WiredEffectBotTalkToAvatarView';
import { WiredEffectBotTalkToRoomView } from './WiredEffectBotTalkToRoomView';
import { WiredEffectBotTeleportToFurniView } from './WiredEffectBotTeleportToFurniView';
import { WiredEffectBotWalkToFurniView } from './WiredEffectBotWalkToFurniView';
import { WiredEffectChangeFurniDirectionView } from './WiredEffectChangeFurniDirectionView';
import { WiredEffectChangeVariableValueView } from './WiredEffectChangeVariableValueView';
import { WiredEffectControlCounterView } from './WiredEffectControlCounterView';
import { WiredEffectCancelTransactionView } from './WiredEffectCancelTransactionView';
import { WiredEffectExecuteStacksView } from './WiredEffectExecuteStacksView';
import { WiredEffectExecuteStacksNegativeView } from './WiredEffectExecuteStacksNegativeView';
import { WiredEffectFreezeAvatarView } from './WiredEffectFreezeAvatarView';
import { WiredEffectGiveCurrencyFromChestView } from './WiredEffectGiveCurrencyFromChestView';
import { WiredEffectGiveFurniFromChestView } from './WiredEffectGiveFurniFromChestView';
import { WiredEffectGivePointsToTeamView } from './WiredEffectGivePointsToTeamView';
import { WiredEffectGivePointsView } from './WiredEffectGivePointsView';
import { WiredEffectGiveVariableView } from './WiredEffectGiveVariableView';
import { WiredEffectInitiateTransactionView } from './WiredEffectInitiateTransactionView';
import { WiredEffectJoinTeamView } from './WiredEffectJoinTeamView';
import { WiredEffectKickAvatarView } from './WiredEffectKickAvatarView';
import { WiredEffectLeaveTeamView } from './WiredEffectLeaveTeamView';
import { WiredEffectMatchFurniPositionStateView } from './WiredEffectMatchFurniPositionStateView';
import { WiredEffectMoveAvatarToFurniView } from './WiredEffectMoveAvatarToFurniView';
import { WiredEffectMoveFurniAwayAvatarView } from './WiredEffectMoveFurniAwayAvatarView';
import { WiredEffectMoveFurniAsGroupView } from './WiredEffectMoveFurniAsGroupView';
import { WiredEffectMoveFurniToAvatarView } from './WiredEffectMoveFurniToAvatarView';
import { WiredEffectMoveFurniToFurniView } from './WiredEffectMoveFurniToFurniView';
import { WiredEffectMoveFurniTowardsAvatarView } from './WiredEffectMoveFurniTowardsAvatarView';
import { WiredEffectMoveRotateFurniView } from './WiredEffectMoveRotateFurniView';
import { WiredEffectMoveRotateUserView } from './WiredEffectMoveRotateUserView';
import { WiredEffectPlaceTempFurniView } from './WiredEffectPlaceTempFurniView';
import { WiredEffectRelativeFurniMovementView } from './WiredEffectRelativeFurniMovementView';
import { WiredEffectRemoveTempFurniView } from './WiredEffectRemoveTempFurniView';
import { WiredEffectRemoveVariableView } from './WiredEffectRemoveVariableView';
import { WiredEffectSendSignalView } from './WiredEffectSendSignalView';
import { WiredEffectSendSignalNegativeView } from './WiredEffectSendSignalNegativeView';
import { WiredEffectSetClickConfigView } from './WiredEffectSetClickConfigView';
import { WiredEffectSetFurniAltitudeView } from './WiredEffectSetFurniAltitudeView';
import { WiredEffectShowMessageView } from './WiredEffectShowMessageView';
import { WiredEffectTeleportToFurniView } from './WiredEffectTeleportToFurniView';
import { WiredEffectTeleportToRoomView } from './WiredEffectTeleportToRoomView';
import { WiredEffectTimerResetView } from './WiredEffectTimerResetView';
import { WiredEffectToggleFurniStateView } from './WiredEffectToggleFurniStateView';
import { WiredEffectToggleRandomStateView } from './WiredEffectToggleRandomStateView';
import { WiredEffectUnfreezeAvatarView } from './WiredEffectUnfreezeAvatarView';
import { WiredEffectWriteLogView } from './WiredEffectWriteLogView';


export const WiredEffectLayoutView = (code: number) =>
{
    switch(code)
    {
        case WiredEffectLayout.TOGGLE_STATE:
            return<WiredEffectToggleFurniStateView />;
        case WiredEffectLayout.MOVE_ROTATE_FURNI:
            return<WiredEffectMoveRotateFurniView />;
        case WiredEffectLayout.MOVE_ROTATE_AVATAR:
            return<WiredEffectMoveRotateUserView />;
        case WiredEffectLayout.MATCH_POS_STATE:
            return<WiredEffectMatchFurniPositionStateView />;
        case WiredEffectLayout.TELEPORT_TO_FURNI:
            return<WiredEffectTeleportToFurniView />;
        case WiredEffectLayout.SHOW_MESSAGE:
            return<WiredEffectShowMessageView />;
        case WiredEffectLayout.TOGGLE_RANDOM_STATE:
            return<WiredEffectToggleRandomStateView />;
        case WiredEffectLayout.EXECUTE_STACKS:
            return<WiredEffectExecuteStacksView />;
        case WiredEffectLayout.CONTROL_COUNTER:
            return<WiredEffectControlCounterView />;
        case WiredEffectLayout.ADJUST_COUNTER:
            return<WiredEffectAdjustCounterTimeView />;
        case WiredEffectLayout.TIMER_RESET:
            return<WiredEffectTimerResetView />;
        case WiredEffectLayout.SEND_SIGNAL:
            return<WiredEffectSendSignalView />;
        case WiredEffectLayout.TELEPORT_TO_ROOM:
            return<WiredEffectTeleportToRoomView />;
        case WiredEffectLayout.SET_FURNI_ALTITUDE:
            return<WiredEffectSetFurniAltitudeView />;
        case WiredEffectLayout.CHANGE_FURNI_DIRECTION:
            return<WiredEffectChangeFurniDirectionView />;
        case WiredEffectLayout.FURNI_TO_FURNI:
            return<WiredEffectMoveFurniToFurniView />;
        case WiredEffectLayout.FURNI_TO_AVATAR:
            return<WiredEffectMoveFurniToAvatarView />;
        case WiredEffectLayout.AVATAR_TO_FURNI:
            return<WiredEffectMoveAvatarToFurniView />;
        case WiredEffectLayout.RELATIVE_FURNI_MOVEMENT:
            return<WiredEffectRelativeFurniMovementView />;
        case WiredEffectLayout.PLACE_TEMP_FURNI:
            return<WiredEffectPlaceTempFurniView />;
        case WiredEffectLayout.REMOVE_TEMP_FURNI:
            return<WiredEffectRemoveTempFurniView />;
        case WiredEffectLayout.MOVE_FURNI_AS_GROUP:
            return<WiredEffectMoveFurniAsGroupView />;
        case WiredEffectLayout.MOVE_FURNI_TOWARDS_AVATAR:
            return<WiredEffectMoveFurniTowardsAvatarView />;
        case WiredEffectLayout.MOVE_FURNI_AWAY_AVATAR:
            return<WiredEffectMoveFurniAwayAvatarView />;
        case WiredEffectLayout.JOIN_TEAM:
            return<WiredEffectJoinTeamView />;
        case WiredEffectLayout.LEAVE_TEAM:
            return<WiredEffectLeaveTeamView />;
        case WiredEffectLayout.GIVE_POINTS:
            return<WiredEffectGivePointsView />;
        case WiredEffectLayout.GIVE_PREDEFINED_POINTS:
            return<WiredEffectGivePointsToTeamView />;
        case WiredEffectLayout.FREEZE_AVATAR:
            return<WiredEffectFreezeAvatarView />;
        case WiredEffectLayout.UNFREEZE_AVATAR:
            return<WiredEffectUnfreezeAvatarView />;
        case WiredEffectLayout.SET_CLICK_CONFIG:
            return<WiredEffectSetClickConfigView />;
        case WiredEffectLayout.KICK_AVATAR:
            return<WiredEffectKickAvatarView />;
        case WiredEffectLayout.BOT_GIVE_HANDITEM:
            return<WiredEffectBotGiveHandItemView />;
        case WiredEffectLayout.BOT_WALK_TO_FURNI:
            return<WiredEffectBotWalkToFurniView />;
        case WiredEffectLayout.BOT_TELEPORT_TO_FURNI:
            return<WiredEffectBotTeleportToFurniView />;
        case WiredEffectLayout.BOT_TALK_TO_ROOM:
            return<WiredEffectBotTalkToRoomView />;
        case WiredEffectLayout.BOT_TALK_TO_AVATAR:
            return<WiredEffectBotTalkToAvatarView />;
        case WiredEffectLayout.BOT_FOLLOW_AVATAR:
            return<WiredEffectBotFollowAvatarView />;
        case WiredEffectLayout.BOT_CHANGE_CLOTHES:
            return<WiredEffectBotChangeClothesView />;
        case WiredEffectLayout.WRITE_LOGS:
            return<WiredEffectWriteLogView />;
        case WiredEffectLayout.NEGATIVE_EXECUTE_STACKS:
            return<WiredEffectExecuteStacksNegativeView />;
        case WiredEffectLayout.NEGATIVE_SEND_SIGNAL:
            return<WiredEffectSendSignalNegativeView />;
        case WiredEffectLayout.NEGATIVE_WRITE_LOGS:
            return<WiredEffectWriteLogView />;
        case WiredEffectLayout.CHANGE_VARIABLE_VALUE:
            return<WiredEffectChangeVariableValueView />;
        case WiredEffectLayout.GIVE_VARIABLE:
            return<WiredEffectGiveVariableView />;
        case WiredEffectLayout.REMOVE_VARIABLE:
            return<WiredEffectRemoveVariableView />;
        case WiredEffectLayout.GIVE_CURRENCY_FROM_CHEST:
            return<WiredEffectGiveCurrencyFromChestView />;
        case WiredEffectLayout.GIVE_FURNI_FROM_CHEST:
            return<WiredEffectGiveFurniFromChestView />;
        case WiredEffectLayout.INITIATE_TRANSACTION:
            return<WiredEffectInitiateTransactionView />;
        case WiredEffectLayout.CANCEL_TRANSACTION:
            return<WiredEffectCancelTransactionView />;
    }

    return null;
}
