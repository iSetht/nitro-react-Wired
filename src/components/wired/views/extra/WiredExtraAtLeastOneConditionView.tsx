import { RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { GetRoomEngine, LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useNotification, useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { clampWiredText, clampWiredValue, parseWiredData, WiredInfoDesc, WiredParam, WiredRadio, WiredTextInput, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER } from '../WiredControls';

const MODE_ALL = 0;
const MODE_AT_LEAST_ONE = 1;
const MODE_NOT_ALL = 2;
const MODE_NONE = 3;
const MODE_LESS_THAN = 4;
const MODE_EXACTLY = 5;
const MODE_MORE_THAN = 6;
const SOURCE_OPTIONS = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER ];
const MIN_COMPARE_VALUE = 0;
const MAX_COMPARE_VALUE = 1000;

interface OrEvalData
{
    evalMode?: number;
    compareValue?: number;
    conditionSource?: number;
}

const normalizeMode = (value: number) => value >= MODE_ALL && value <= MODE_MORE_THAN ? value : MODE_AT_LEAST_ONE;
const normalizeSource = (source: number) => SOURCE_OPTIONS.includes(source) ? source : WIRED_SOURCE_SELECTED;
const clampCompareValue = (value: number) => clampWiredValue(Number.isFinite(value) ? value : 0, MIN_COMPARE_VALUE, MAX_COMPARE_VALUE);
const isConditionEvaluatorType = (type: string) => !!type && (type.startsWith('wf_cnd_') || type === 'wf_xtra_or_eval');

const EvalRadio: FC<{ mode: number; currentMode: number; onChange: (mode: number) => void; labelKey: string; children?: ReactNode }> = props =>
{
    const { mode, currentMode, onChange, labelKey, children = null } = props;

    return (
        <Flex alignItems="center" gap={ 1 }>
            <WiredRadio
                name="wiredConditionEvaluationMode"
                checked={ currentMode === mode }
                onChange={ () => onChange(mode) }
                label={ LocalizeText(labelKey) } />
            { children }
        </Flex>
    );
}

export const WiredExtraAtLeastOneConditionView: FC<{}> = props =>
{
    const [ evalMode, setEvalMode ] = useState(MODE_AT_LEAST_ONE);
    const [ compareValue, setCompareValue ] = useState('1');
    const [ conditionSource, setConditionSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ infoExpanded, setInfoExpanded ] = useState(false);
    const [ sourceExpanded, setSourceExpanded ] = useState(false);
    const { trigger = null, setIntParams = null, furniIds = [] } = useWired() as any;
    const { simpleAlert = null } = useNotification();

    const data = useMemo(() => parseWiredData<OrEvalData>(trigger?.stringData ?? ''), [ trigger ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedMode = normalizeMode(intData[0] ?? data.evalMode ?? MODE_AT_LEAST_ONE);
        const savedSource = normalizeSource(intData[2] ?? data.conditionSource ?? WIRED_SOURCE_SELECTED);

        setEvalMode(savedMode);
        setCompareValue(String(clampCompareValue(intData[1] ?? data.compareValue ?? 1)));
        setConditionSource(savedSource);
        setSourceExpanded(savedSource !== WIRED_SOURCE_SELECTED);
    }, [ trigger, data ]);

    const validate = () =>
    {
        for(const furniId of furniIds)
        {
            const roomObject = GetRoomEngine().getRoomObject(
                GetRoomEngine().activeRoomId,
                furniId,
                RoomObjectCategory.FLOOR
            );

            if(!roomObject || !isConditionEvaluatorType(roomObject.type))
            {
                simpleAlert(LocalizeText('wiredfurni.error.condition_evaluation_furni'));
                return false;
            }
        }

        return true;
    }

    const save = () => setIntParams([
        normalizeMode(evalMode),
        clampCompareValue(Number(compareValue || 0)),
        normalizeSource(conditionSource)
    ]);

    const onCompareValueChange = (value: string) =>
    {
        setCompareValue(clampWiredText(value.replace(/[^0-9]/g, ''), MIN_COMPARE_VALUE, MAX_COMPARE_VALUE));
    }

    const compareInput = (enabled: boolean) => (
        <WiredTextInput
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            compact
            disabled={ !enabled }
            value={ compareValue }
            onChange={ event => onCompareValueChange(event.target.value) } />
    );

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE }
            hasSpecialInput={ true }
            save={ save }
            validate={ validate }
            sourceSelectors={ [ {
                value: conditionSource,
                onChange: setConditionSource,
                options: SOURCE_OPTIONS,
                titleKey: 'wiredfurni.params.sources.furni.title',
                labelPrefix: 'wiredfurni.params.sources.furni'
            } as any ] }
            expanded={ sourceExpanded }
            onToggleExpanded={ () => setSourceExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.general_box_info" chevron expanded={ infoExpanded } onToggle={ () => setInfoExpanded(value => !value) }>
                <WiredInfoDesc textKey="wiredfurni.params.cond_eval.note" />
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.eval_mode" divider={ false }>
                <Column gap={ 1 }>
                    <EvalRadio mode={ MODE_ALL } currentMode={ evalMode } onChange={ setEvalMode } labelKey="wiredfurni.params.eval_mode.0" />
                    <EvalRadio mode={ MODE_AT_LEAST_ONE } currentMode={ evalMode } onChange={ setEvalMode } labelKey="wiredfurni.params.eval_mode.1" />
                    <EvalRadio mode={ MODE_NOT_ALL } currentMode={ evalMode } onChange={ setEvalMode } labelKey="wiredfurni.params.eval_mode.2" />
                    <EvalRadio mode={ MODE_NONE } currentMode={ evalMode } onChange={ setEvalMode } labelKey="wiredfurni.params.eval_mode.3" />
                    <EvalRadio mode={ MODE_LESS_THAN } currentMode={ evalMode } onChange={ setEvalMode } labelKey="wiredfurni.params.eval_mode.cmp.0">
                        { compareInput(evalMode === MODE_LESS_THAN) }
                    </EvalRadio>
                    <EvalRadio mode={ MODE_EXACTLY } currentMode={ evalMode } onChange={ setEvalMode } labelKey="wiredfurni.params.eval_mode.cmp.1">
                        { compareInput(evalMode === MODE_EXACTLY) }
                    </EvalRadio>
                    <EvalRadio mode={ MODE_MORE_THAN } currentMode={ evalMode } onChange={ setEvalMode } labelKey="wiredfurni.params.eval_mode.cmp.2">
                        { compareInput(evalMode === MODE_MORE_THAN) }
                    </EvalRadio>
                </Column>
            </WiredParam>
        </WiredBaseView>
    );
}
