import { WiredConditionlayout } from '../../../../api';
import { WiredConditionMatchStatePositionView } from './WiredConditionMatchStatePositionView';
import { WiredConditionAvatarOnFurniView } from './WiredConditionAvatarOnFurniView';
import { WiredConditionFurniHasAvatarView } from './WiredConditionFurniHasAvatarView';
import { WiredConditionFurniHasFurniView } from './WiredConditionFurniHasFurniView';
import { WiredConditionAvatarMatchesView } from './WiredConditionAvatarMatchesView';
import { WiredConditionAvatarDirectionView } from './WiredConditionAvatarDirectionView';
import { WiredConditionAvatarPerformActionView } from './WiredConditionAvatarPerformActionView';
import { WiredConditionAvatarInGroupView } from './WiredConditionAvatarInGroupView';
import { WiredConditionAvatarHasHanditemView } from './WiredConditionAvatarHasHanditemView';
import { WiredConditionCounterTimeMatchesView } from './WiredConditionCounterTimeMatchesView';
import { WiredConditionTimeElapsedLessView } from './WiredConditionTimeElapsedLessView';
import { WiredConditionTimeElapsedMoreView } from './WiredConditionTimeElapsedMoreView';
import { WiredConditionAltitudeMatchesView } from './WiredConditionAltitudeMatchesView';
import { WiredConditionFurniMatchesView } from './WiredConditionFurniMatchesView';
import { WiredConditionSelectorQuantityView } from './WiredConditionSelectorQuantityView';
import { WiredConditionAvatarOnTeamView } from './WiredConditionAvatarOnTeamView';
import { WiredConditionTeamHasScoreView } from './WiredConditionTeamHasScoreView';
import { WiredConditionTeamIsWinningView } from './WiredConditionTeamIsWinningView';
import { WiredConditionTimeMatchesView } from './WiredConditionTimeMatchesView';
import { WiredConditionDateMatchesView } from './WiredConditionDateMatchesView';
import { WiredConditionAvatarCountInRoomView } from './WiredConditionAvatarCountInRoomView';
import { WiredConditionChestHasFurniTypeView } from './WiredConditionChestHasFurniTypeView';
import { WiredConditionChestHasItemsView } from './WiredConditionChestHasItemsView';
import { WiredConditionMovementValidationView } from './WiredConditionMovementValidationView';
import { WiredConditionHasVariableView } from './WiredConditionHasVariableView';
import { WiredConditionVariableValueView } from './WiredConditionVariableValueView';
import { WiredConditionVariableAgeView } from './WiredConditionVariableAgeView';

export const WiredConditionLayoutView = (code: number) =>
{
    switch(code)
    {
        case WiredConditionlayout.STATE_POSITION_MATCH:
            return <WiredConditionMatchStatePositionView />;

        case WiredConditionlayout.NOT_STATE_POSITION_MATCH:
            return <WiredConditionMatchStatePositionView isNegative={ true } />;

        case WiredConditionlayout.AVATAR_ON_FURNI:
            return <WiredConditionAvatarOnFurniView />;

        case WiredConditionlayout.NOT_AVATAR_ON_FURNI:
            return <WiredConditionAvatarOnFurniView isNegative={ true } />;

        case WiredConditionlayout.FURNI_HAS_AVATAR:
            return <WiredConditionFurniHasAvatarView />;

        case WiredConditionlayout.NOT_FURNI_HAS_AVATAR:
            return <WiredConditionFurniHasAvatarView isNegative={ true } />;

        case WiredConditionlayout.HAS_FURNI_ON:
            return <WiredConditionFurniHasFurniView />;

        case WiredConditionlayout.NOT_HAS_FURNI_ON:
            return <WiredConditionFurniHasFurniView isNegative={ true } />;

        case WiredConditionlayout.AVATAR_MATCHES:
            return <WiredConditionAvatarMatchesView />;

        case WiredConditionlayout.NOT_AVATAR_MATCHES:
            return <WiredConditionAvatarMatchesView isNegative={ true } />;

        case WiredConditionlayout.AVATAR_DIRECTION:
            return <WiredConditionAvatarDirectionView />;

        case WiredConditionlayout.AVATAR_PERFORMING_ACTION:
            return <WiredConditionAvatarPerformActionView />;

        case WiredConditionlayout.NOT_AVATAR_PERFORMING_ACTION:
            return <WiredConditionAvatarPerformActionView isNegative={ true } />;

        case WiredConditionlayout.AVATAR_IN_GROUP:
            return <WiredConditionAvatarInGroupView />;

        case WiredConditionlayout.NOT_AVATAR_IN_GROUP:
            return <WiredConditionAvatarInGroupView isNegative={ true } />;

        case WiredConditionlayout.AVATAR_HAS_HANDITEM:
            return <WiredConditionAvatarHasHanditemView />;

        case WiredConditionlayout.NOT_AVATAR_HAS_HANDITEM:
            return <WiredConditionAvatarHasHanditemView isNegative={ true } />;

        case WiredConditionlayout.COUNTER_TIME_MATCHES:
            return <WiredConditionCounterTimeMatchesView />;

        case WiredConditionlayout.LESS_THAN_X_ELAPSED:
            return <WiredConditionTimeElapsedLessView />;
    
        case WiredConditionlayout.MORE_THAN_X_ELAPSED:
            return <WiredConditionTimeElapsedMoreView />;

        case WiredConditionlayout.FURNI_ALTITUDE_MATCHES:
            return <WiredConditionAltitudeMatchesView />;

        case WiredConditionlayout.FURNI_MATCHES:
            return <WiredConditionFurniMatchesView />;

        case WiredConditionlayout.NOT_FURNI_MATCHES:
            return <WiredConditionFurniMatchesView isNegative={ true } />;

        case WiredConditionlayout.SELECTION_AMOUNT:
            return <WiredConditionSelectorQuantityView />;

        case WiredConditionlayout.AVATAR_IN_TEAM:
            return <WiredConditionAvatarOnTeamView />;

        case WiredConditionlayout.NOT_AVATAR_IN_TEAM:
            return <WiredConditionAvatarOnTeamView isNegative={ true } />;

        case WiredConditionlayout.TEAM_HAS_SCORE:
            return <WiredConditionTeamHasScoreView />;

        case WiredConditionlayout.TEAM_IS_WINNING:
            return <WiredConditionTeamIsWinningView />;

        case WiredConditionlayout.TIME_MATCHES:
            return <WiredConditionTimeMatchesView />;

        case WiredConditionlayout.DATE_MATCHES:
            return <WiredConditionDateMatchesView />;

        case WiredConditionlayout.AVATAR_COUNT_IN_ROOM:
        case WiredConditionlayout.NOT_AVATAR_COUNT_IN_ROOM:
            return <WiredConditionAvatarCountInRoomView />;

        case WiredConditionlayout.CAN_PERFORM_MOVEMENT:
            return <WiredConditionMovementValidationView />;

        case WiredConditionlayout.HAS_VARIABLE:
            return <WiredConditionHasVariableView />;

        case WiredConditionlayout.VARIABLE_VALUE_MATCHES:
            return <WiredConditionVariableValueView />;

        case WiredConditionlayout.VARIABLE_AGE_MATCHES:
            return <WiredConditionVariableAgeView />;

        case WiredConditionlayout.NOT_HAS_VARIABLE:
            return <WiredConditionHasVariableView isNegative={ true } />;

        case WiredConditionlayout.CHEST_HAS_ITEMS:
            return <WiredConditionChestHasItemsView />;

        case WiredConditionlayout.CHEST_HAS_FURNI_TYPE:
            return <WiredConditionChestHasFurniTypeView />;

            
    }

    return null;
}
