import { WiredExtraLayout } from '../../../../api';
import { WiredExtraAnimationTimeView } from './WiredExtraAnimationTimeView';
import { WiredExtraAtLeastOneConditionView } from './WiredExtraAtLeastOneConditionView';
import { WiredExtraCarryAvatarView } from './WiredExtraCarryAvatarView';
import { WiredExtraCancelAnimationView } from './WiredExtraCancelAnimationView';
import { WiredExtraChestFurniTypeScannerView } from './WiredExtraChestFurniTypeScannerView';
import { WiredExtraCustomContractView } from './WiredExtraCustomContractView';
import { WiredExtraExecutionLimitView } from './WiredExtraExecutionLimitView';
import { WiredExtraExecuteInOrderView } from './WiredExtraExecuteInOrderView';
import { WiredExtraFurniNamePlaceholderView } from './WiredExtraFurniNamePlaceholderView';
import { WiredExtraLevelUpSystemView } from './WiredExtraLevelUpSystemView';
import { WiredExtraMovementCurveView } from './WiredExtraMovementCurveView';
import { WiredExtraMovementPhysicsView } from './WiredExtraMovementPhysicsView';
import { WiredExtraProjectileView } from './WiredExtraProjectileView';
import { WiredExtraRandomEffectView } from './WiredExtraRandomEffectView';
import { WiredExtraTextConnectorView } from './WiredExtraTextConnectorView';
import { WiredExtraTimeUtilitiesView } from './WiredExtraTimeUtilitiesView';
import { WiredExtraUnseenEffectView } from './WiredExtraUnseenEffectView';
import { WiredExtraUserNamePlaceholderView } from './WiredExtraUserNamePlaceholderView';
import { WiredExtraVariableCapturerView } from './WiredExtraVariableCapturerView';
import { WiredExtraVariablePlaceholderView } from './WiredExtraVariablePlaceholderView';


export const WiredExtraLayoutView = (code: number) =>
{
    switch(code)
    {
        case WiredExtraLayout.MOVEMENT_CURVE:
            return <WiredExtraMovementCurveView />;
        case WiredExtraLayout.EXECUTION_LIMIT:
            return <WiredExtraExecutionLimitView />;
        case WiredExtraLayout.CARRY_AVATAR:
            return <WiredExtraCarryAvatarView />;
        case WiredExtraLayout.CANCEL_ANIMATION:
            return <WiredExtraCancelAnimationView />;
        case WiredExtraLayout.ANIMATION_TIME:
            return <WiredExtraAnimationTimeView />;
        case WiredExtraLayout.RANDOM_EFFECT:
            return <WiredExtraRandomEffectView />;
        case WiredExtraLayout.UNSEEN_EFFECT:
            return <WiredExtraUnseenEffectView />;
        case WiredExtraLayout.EXECUTE_IN_ORDER:
            return <WiredExtraExecuteInOrderView />;
        case WiredExtraLayout.MOVEMENT_PHYSICS:
            return <WiredExtraMovementPhysicsView />;
        case WiredExtraLayout.AT_LEAST_ONE_CONDITION:
            return <WiredExtraAtLeastOneConditionView />;
        case WiredExtraLayout.FURNI_NAME_PLACEHOLDER:
            return <WiredExtraFurniNamePlaceholderView />;
        case WiredExtraLayout.USER_NAME_PLACEHOLDER:
            return <WiredExtraUserNamePlaceholderView />;
        case WiredExtraLayout.PROJECTILE:
            return <WiredExtraProjectileView />;
        case WiredExtraLayout.VARIABLE_PLACEHOLDER:
            return <WiredExtraVariablePlaceholderView />;
        case WiredExtraLayout.VARIABLE_CAPTURER:
            return <WiredExtraVariableCapturerView />;
        case WiredExtraLayout.TEXT_CONNECTOR:
            return <WiredExtraTextConnectorView />;
        case WiredExtraLayout.TIME_UTILITIES:
            return <WiredExtraTimeUtilitiesView />;
        case WiredExtraLayout.LEVEL_UP_SYSTEM:
            return <WiredExtraLevelUpSystemView />;
        case WiredExtraLayout.CHEST_FURNI_TYPE_SCANNER:
            return <WiredExtraChestFurniTypeScannerView />;
        case WiredExtraLayout.CUSTOM_CONTRACT:
            return <WiredExtraCustomContractView />;
    }

    return null;
}
