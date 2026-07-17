import { ConditionDefinition, Triggerable, TriggerDefinition, UpdateActionMessageComposer, UpdateConditionMessageComposer, UpdateTriggerMessageComposer, WiredActionDefinition, WiredFurniActionEvent, WiredFurniConditionEvent, WiredFurniTriggerEvent, WiredSaveSuccessEvent, SelectorDefinition, WiredFurniSelectorEvent, UpdateSelectorMessageComposer, VariableDefinition, WiredFurniVariableEvent, UpdateVariableMessageComposer, ExtraDefinition, WiredFurniExtraEvent, UpdateExtraMessageComposer } from '@nitrots/nitro-renderer';
import { useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { IsOwnerOfFloorFurniture, LocalizeText, SendMessageComposer, WiredFurniType, WiredSelectionVisualizer } from '../../api';
import { useMessageEvent } from '../events';
import { useNotification } from '../notification';

const DEFAULT_MAXIMUM_FURNI_SELECTION_COUNT = 20;

const useWiredState = () =>
{
    const [ trigger, setTrigger ] = useState<Triggerable>(null);
    const [ intParams, setIntParams ] = useState<number[]>([]);
    const [ stringParam, setStringParam ] = useState<string>('');
    const [ furniIds, setFurniIds ] = useState<number[]>([]);
    const [ actionDelay, setActionDelay ] = useState<number>(0);
    const [ allowsFurni, setAllowsFurni ] = useState<number>(WiredFurniType.STUFF_SELECTION_OPTION_NONE);
    const { showConfirm = null } = useNotification();

    const serializedSelectionLimit = trigger?.maximumItemSelectionCount ?? 0;
    const maximumItemSelectionCount = serializedSelectionLimit > 0 ? serializedSelectionLimit : (allowsFurni > WiredFurniType.STUFF_SELECTION_OPTION_NONE ? DEFAULT_MAXIMUM_FURNI_SELECTION_COUNT : 0);

    const saveWired = () =>
    {
        if(!trigger || trigger.canModify === false) return;

        const save = (trigger: Triggerable) =>
        {
            if(!trigger) return;

            if(trigger instanceof WiredActionDefinition)
            {
                SendMessageComposer(new UpdateActionMessageComposer(trigger.id, intParams, stringParam, furniIds, actionDelay, trigger.stuffTypeSelectionCode));
            }

            else if(trigger instanceof TriggerDefinition)
            {
                SendMessageComposer(new UpdateTriggerMessageComposer(trigger.id, intParams, stringParam, furniIds, trigger.stuffTypeSelectionCode));
            }

            else if(trigger instanceof ConditionDefinition)
            {
                SendMessageComposer(new UpdateConditionMessageComposer(trigger.id, intParams, stringParam, furniIds, trigger.stuffTypeSelectionCode));
            }
            else if(trigger instanceof SelectorDefinition)
            {
                SendMessageComposer(new UpdateSelectorMessageComposer(trigger.id, intParams, stringParam, furniIds, trigger.stuffTypeSelectionCode));
            }
            else if(trigger instanceof VariableDefinition)
            {
                SendMessageComposer(new UpdateVariableMessageComposer(trigger.id, (intParams.length > 0) ? intParams[0] : 1, stringParam, (intParams.length > 1) ? String(intParams[1]) : trigger.value));
            }
            else if(trigger instanceof ExtraDefinition)
            {
                SendMessageComposer(new UpdateExtraMessageComposer(trigger.id, intParams, stringParam, furniIds, trigger.stuffTypeSelectionCode));
            }
        }

        if(!IsOwnerOfFloorFurniture(trigger.id))
        {
            showConfirm(LocalizeText('wiredfurni.nonowner.change.confirm.body'), () =>
            {
                save(trigger)
            }, null, null, null, LocalizeText('wiredfurni.nonowner.change.confirm.title'));
        }
        else
        {
            save(trigger);
        }
    }

    const selectObjectForWired = (objectId: number, category: number) =>
    {
        if(!trigger || !allowsFurni) return;

        if(objectId <= 0) return;

        setFurniIds(prevValue =>
        {
            const newFurniIds = [ ...prevValue ];

            const index = prevValue.indexOf(objectId);

            if(index >= 0)
            {
                newFurniIds.splice(index, 1);

                WiredSelectionVisualizer.hide(objectId);
            }

            else if(newFurniIds.length < maximumItemSelectionCount)
            {
                newFurniIds.push(objectId);

                WiredSelectionVisualizer.show(objectId);
            }

            return newFurniIds;
        });
    }

    useMessageEvent<WiredSaveSuccessEvent>(WiredSaveSuccessEvent, event =>
    {
        const parser = event.getParser();

        setTrigger(null);
    });

    useMessageEvent<WiredFurniActionEvent>(WiredFurniActionEvent, event =>
    {
        const parser = event.getParser();

        setTrigger(parser.definition);
    });

    useMessageEvent<WiredFurniConditionEvent>(WiredFurniConditionEvent, event =>
    {
        const parser = event.getParser();

        setTrigger(parser.definition);
    });

    useMessageEvent<WiredFurniTriggerEvent>(WiredFurniTriggerEvent, event =>
    {
        const parser = event.getParser();

        setTrigger(parser.definition);
    });

    useMessageEvent<WiredFurniSelectorEvent >(WiredFurniSelectorEvent , event =>
    {
        const parser = event.getParser();

        setTrigger(parser.definition);
    });

    useMessageEvent<WiredFurniVariableEvent>(WiredFurniVariableEvent, event =>
    {
        const parser = event.getParser();

        setTrigger(parser.definition);
    });

    useMessageEvent<WiredFurniExtraEvent>(WiredFurniExtraEvent, event =>
    {
        const parser = event.getParser();

        setTrigger(parser.definition);
    });

    useEffect(() =>
    {
        if(!trigger) return;

        return () =>
        {
            setIntParams([]);
            setStringParam('');
            setActionDelay(0);
            setFurniIds(prevValue =>
            {
                if(prevValue && prevValue.length) WiredSelectionVisualizer.clearSelectionShaderFromFurni(prevValue);
    
                return [];
            });
            setAllowsFurni(WiredFurniType.STUFF_SELECTION_OPTION_NONE);
        }
    }, [ trigger ]);

    return { trigger, setTrigger, intParams, setIntParams, stringParam, setStringParam, furniIds, setFurniIds, actionDelay, setActionDelay, maximumItemSelectionCount, setAllowsFurni, saveWired, selectObjectForWired };
}

export const useWired = () => useBetween(useWiredState);
