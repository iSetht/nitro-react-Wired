import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { createFurniSourceSelector, createUserSourceSelector, FURNI_SOURCE_OPTIONS, USER_SOURCE_OPTIONS, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const SOURCE_TRIGGER = 0;
const SOURCE_SELECTED = 100;

export const WiredConditionAvatarOnFurniView: FC<{ isNegative?: boolean }> = props =>
{
    const { isNegative = false } = props;
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, furniExpanded, setFurniExpanded ] = useWiredEffectSource(trigger, 1, SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);
    const [ userSource, setUserSource, userExpanded, setUserExpanded ] = useWiredEffectSource(trigger, 2, SOURCE_TRIGGER, USER_SOURCE_OPTIONS);
    const expanded = furniExpanded || userExpanded;

    const save = () => setIntParams([ quantifier, furniSource, userSource ]);

    useEffect(() =>
    {
        if(!trigger) return;
        setQuantifier((trigger.intData?.[0] ?? QUANTIFIER_ALL) === QUANTIFIER_ANY ? QUANTIFIER_ANY : QUANTIFIER_ALL);
    }, [ trigger ]);

    const quantifierSlot = (
        <WiredConditionQuantifierSection kind="users" name="avatarOnFurniQuantifier" value={ quantifier } onChange={ setQuantifier } negative={ isNegative } />
    );

    return (
        <WiredConditionBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [
                createFurniSourceSelector(furniSource, setFurniSource),
                createUserSourceSelector(userSource, setUserSource)
            ] }
            advancedSlot={ quantifierSlot }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                setFurniExpanded(!expanded);
                setUserExpanded(!expanded);
            } }>
        </WiredConditionBaseView>
    );
}
