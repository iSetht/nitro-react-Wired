import { ConditionDefinition, TriggerDefinition, WiredActionDefinition, SelectorDefinition, VariableDefinition, ExtraDefinition } from '@nitrots/nitro-renderer';
import { RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { useRoomSessionManagerEvent, useWired } from '../../hooks';
import { WiredEffectLayoutView } from './views/effects/WiredEffectLayoutView';
import { WiredConditionLayoutView } from './views/conditions/WiredConditionLayoutView';
import { WiredTriggerLayoutView } from './views/triggers/WiredTriggerLayoutView';
import { WiredSelectorLayoutView } from './views/selectors/WiredSelectorLayoutView';
import { WiredVariableLayoutView } from './views/variables/WiredVariableLayoutView';
import { WiredExtraLayoutView } from './views/extra/WiredExtraLayoutView';

export const WiredView: FC<{}> = props =>
{
    const { trigger = null, setTrigger = null } = useWired();

    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.ENDED, event => setTrigger(null));

    if(!trigger) return null;

    if(trigger instanceof WiredActionDefinition) return WiredEffectLayoutView(trigger.code);

    if(trigger instanceof TriggerDefinition) return WiredTriggerLayoutView(trigger.code);
    
    if(trigger instanceof ConditionDefinition) return WiredConditionLayoutView(trigger.code);

    if(trigger instanceof SelectorDefinition) return WiredSelectorLayoutView(trigger.code);

    if(trigger instanceof VariableDefinition) return WiredVariableLayoutView(trigger.code);

    if(trigger instanceof ExtraDefinition) return WiredExtraLayoutView(trigger.code);
    
    return null;
};
