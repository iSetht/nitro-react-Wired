import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import {
    WiredControlTitle,
    WiredControlText,
    WiredCheckbox,
    WiredParam,
    WiredRadio,
    WiredSelect,
    WiredSlider,
    WiredTextInput,
    WIRED_SOURCE_SELECTED,
    WIRED_SOURCE_TRIGGER
} from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import {
    createFurniSourceSelector,
    createUserSourceSelector,
    FURNI_SOURCE_OPTIONS,
    USER_SOURCE_OPTIONS,
    useWiredEffectSource
} from './WiredEffectSourceSelector';

const VISIBILITY_SOURCE_USER = 0;
const VISIBILITY_EVERYONE = 1;
const EASING_INSTANT = 0;
const MIN_OPACITY = 0;
const MAX_OPACITY = 100;
const MIN_DURATION = 1;
const MAX_DURATION = 10;

const EASING_OPTIONS = [
    { value: EASING_INSTANT, label: 'Instant' },
    { value: 1, label: 'Linear' },
    { value: 2, label: 'Ease in' },
    { value: 3, label: 'Ease out' },
    { value: 4, label: 'Ease in-out' }
];

const clamp = (value: number, minimum: number, maximum: number) =>
    Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));

export const WiredEffectChangeOpacityView: FC<{}> = props =>
{
    const [ visibility, setVisibility ] = useState(VISIBILITY_SOURCE_USER);
    const [ opacity, setOpacity ] = useState(MAX_OPACITY);
    const [ easing, setEasing ] = useState(EASING_INSTANT);
    const [ duration, setDuration ] = useState(MIN_DURATION);
    const [ clickThrough, setClickThrough ] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, furniExpanded, setFurniExpanded ] = useWiredEffectSource(trigger, 4, WIRED_SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);
    const [ userSource, setUserSource, userExpanded, setUserExpanded ] = useWiredEffectSource(trigger, 5, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);
    const expanded = furniExpanded || userExpanded;

    const save = () => setIntParams([ visibility, opacity, easing, duration, furniSource, userSource, clickThrough ? 1 : 0 ]);

    useEffect(() =>
    {
        const data = trigger.intData ?? [];

        setVisibility(data[0] === VISIBILITY_EVERYONE ? VISIBILITY_EVERYONE : VISIBILITY_SOURCE_USER);
        setOpacity(clamp(data.length > 1 ? data[1] : MAX_OPACITY, MIN_OPACITY, MAX_OPACITY));
        setEasing(EASING_OPTIONS.some(option => option.value === data[2]) ? data[2] : EASING_INSTANT);
        setDuration(clamp(data.length > 3 ? data[3] : MIN_DURATION, MIN_DURATION, MAX_DURATION));
        setClickThrough(data.length > 6 && data[6] === 1);
    }, [ trigger ]);

    const toggleExpanded = () =>
    {
        const next = !expanded;

        setFurniExpanded(next);
        setUserExpanded(next);
    };

    const userSelector = {
        ...createUserSourceSelector(userSource, setUserSource),
        disabled: visibility === VISIBILITY_EVERYONE
    };

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource), userSelector ] }
            expanded={ expanded }
            onToggleExpanded={ toggleExpanded }>
            <WiredParam titleKey="wiredfurni.params.opacity.visibility_selection.title">
                <Column gap={ 1 }>
                    <WiredRadio
                        name="wired-opacity-visibility"
                        checked={ visibility === VISIBILITY_SOURCE_USER }
                        onChange={ () => setVisibility(VISIBILITY_SOURCE_USER) }
                        label={ LocalizeText('wiredfurni.params.show_message.visibility_selection.0') } />
                    <WiredRadio
                        name="wired-opacity-visibility"
                        checked={ visibility === VISIBILITY_EVERYONE }
                        onChange={ () => setVisibility(VISIBILITY_EVERYONE) }
                        label={ LocalizeText('wiredfurni.params.show_message.visibility_selection.1') } />
                </Column>
            </WiredParam>

            <WiredParam>
                <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.opacity.visibility_amount') }</WiredControlTitle>
                    <WiredTextInput
                        compact
                        type="number"
                        min={ MIN_OPACITY }
                        max={ MAX_OPACITY }
                        step={ 1 }
                        value={ opacity }
                        onChange={ event => setOpacity(clamp(Number(event.target.value || MIN_OPACITY), MIN_OPACITY, MAX_OPACITY)) } />
                </Flex>
                <WiredSlider
                    min={ MIN_OPACITY }
                    max={ MAX_OPACITY }
                    step={ 1 }
                    value={ opacity }
                    onChange={ value => setOpacity(clamp(value, MIN_OPACITY, MAX_OPACITY)) } />
                <WiredCheckbox
                    checked={ clickThrough }
                    onChange={ setClickThrough }
                    label={ LocalizeText('wiredfurni.params.opacity.clickthrough') } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.easing_function" divider={ false }>
                <WiredSelect
                    value={ easing }
                    onChange={ event => setEasing(Number(event.target.value)) }
                    options={ EASING_OPTIONS } />
                { easing !== EASING_INSTANT &&
                    <div className="nw-indent-1 mt-1">
                        <Flex alignItems="center" gap={ 1 }>
                            <WiredControlText>{ LocalizeText('wiredfurni.params.variables.duration') }</WiredControlText>
                            <WiredTextInput
                                compact
                                type="number"
                                min={ MIN_DURATION }
                                max={ MAX_DURATION }
                                step={ 1 }
                                value={ duration }
                                onChange={ event => setDuration(clamp(Number(event.target.value || MIN_DURATION), MIN_DURATION, MAX_DURATION)) } />
                        </Flex>
                    </div> }
            </WiredParam>
        </WiredEffectBaseView>
    );
}
