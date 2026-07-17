import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredControlTitle, WiredParam, WiredRadio, WiredSlider, WiredTextInput, WiredVariableTypeSelector, WIRED_VARIABLE_FURNI, WIRED_VARIABLE_USER } from '../WiredControls';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const COMPARISON_LOWER_THAN  = 0;
const COMPARISON_EQUALS      = 1;
const COMPARISON_HIGHER_THAN = 2;
const COMPARISONS            = [ COMPARISON_LOWER_THAN, COMPARISON_EQUALS, COMPARISON_HIGHER_THAN ];

const SOURCE_KIND_FURNI = 0;
const SOURCE_KIND_USER  = 1;

const SOURCE_TRIGGER  = 0;
const SOURCE_SELECTOR = 200;
const SOURCE_SIGNAL   = 201;

// Both kinds share the same three options
const SOURCE_OPTIONS = [ SOURCE_TRIGGER, SOURCE_SELECTOR, SOURCE_SIGNAL ];

const MAX_AMOUNT = 1000;

const normalizeComparison = (v: number) => COMPARISONS.includes(v) ? v : COMPARISON_EQUALS;
const clampAmount         = (v: number) => Math.max(0, Math.min(MAX_AMOUNT, isNaN(v) ? 0 : Math.floor(v)));
const normalizeSourceKind = (v: number) => v === SOURCE_KIND_USER ? SOURCE_KIND_USER : SOURCE_KIND_FURNI;
const normalizeSource     = (source: number) => SOURCE_OPTIONS.includes(source) ? source : SOURCE_TRIGGER;
const sourceKindToVariableType = (sourceKind: number) => sourceKind === SOURCE_KIND_USER ? WIRED_VARIABLE_USER : WIRED_VARIABLE_FURNI;
const variableTypeToSourceKind = (variableType: number) => variableType === WIRED_VARIABLE_USER ? SOURCE_KIND_USER : SOURCE_KIND_FURNI;

export const WiredConditionSelectorQuantityView: FC<{}> = () =>
{
    const [ comparison, setComparison ] = useState(COMPARISON_EQUALS);
    const [ amount,     setAmount     ] = useState(0);
    const [ sourceKind, setSourceKind ] = useState(SOURCE_KIND_FURNI);
    const [ source,     setSource     ] = useState(SOURCE_SELECTOR);

    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ comparison, amount, sourceKind, source ]);

    useEffect(() =>
    {
        if (!trigger) return;

        setComparison(normalizeComparison(trigger.intData?.[0] ?? COMPARISON_EQUALS));
        setAmount(clampAmount(trigger.intData?.[1] ?? 0));
        setSourceKind(normalizeSourceKind(trigger.intData?.[2] ?? SOURCE_KIND_FURNI));
        setSource(normalizeSource(trigger.intData?.[3] ?? SOURCE_SELECTOR));
    }, [ trigger ]);

    const sourceSelector: WiredSourceSelectorConfig = {
        value: source,
        onChange: setSource,
        options: SOURCE_OPTIONS,
        titleKey: 'wiredfurni.params.sources.merged.title',
        labelPrefix: sourceKind === SOURCE_KIND_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources.furni',
        titleAccessory: (
            <WiredVariableTypeSelector
                value={ sourceKindToVariableType(sourceKind) }
                onChange={ variableType => setSourceKind(variableTypeToSourceKind(variableType)) }
                hiddenTypes={ [ 1, 3 ] } />
        )
    };

    return (
        <WiredConditionBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ sourceSelector ] }
            alwaysExpandedSources={ true }
            expanded={ true }>
            <WiredParam titleKey="wiredfurni.params.choose_type">
                { COMPARISONS.map(value => (
                    <WiredRadio key={ value } name="slcQuantityComparison" checked={ comparison === value } onChange={ () => setComparison(value) } label={ LocalizeText(`wiredfurni.params.comparison.${ value }`) } />
                )) }
            </WiredParam>

            <WiredParam divider={ false }>
                <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.setamount2') }</WiredControlTitle>
                    <WiredTextInput
                        compact
                        type="number"
                        min={ 0 }
                        max={ MAX_AMOUNT }
                        step={ 1 }
                        value={ amount }
                        onChange={ e => setAmount(clampAmount(parseInt(e.target.value || '0'))) } />
                </Flex>
                <WiredSlider
                    min={ 0 }
                    max={ MAX_AMOUNT }
                    step={ 1 }
                    value={ amount }
                    onChange={ value => setAmount(clampAmount(value)) } />
            </WiredParam>
        </WiredConditionBaseView>
    );
}
