import { FC } from 'react';
import { WiredParam, WiredRadioGroup } from '../WiredControls';

export const WIRED_CONDITION_QUANTIFIER_ALL = 0;
export const WIRED_CONDITION_QUANTIFIER_ANY = 1;

export type WiredConditionQuantifierKind = 'furni' | 'users' | 'variables';

const quantifierKeyBase = (kind: WiredConditionQuantifierKind, negative = false) =>
    `wiredfurni.params.quantifier.${ kind }${ negative ? '.neg' : '' }`;

export const WiredConditionQuantifierSection: FC<{
    kind: WiredConditionQuantifierKind;
    name: string;
    value: number;
    onChange: (value: number) => void;
    negative?: boolean;
}> = props =>
{
    const { kind, name, value, onChange, negative = false } = props;
    const keyBase = quantifierKeyBase(kind, negative);

    return (
        <WiredParam titleKey="wiredfurni.params.quantifier_selection" divider={ false }>
            <WiredRadioGroup
                name={ name }
                value={ value }
                onChange={ next => onChange(Number(next)) }
                options={ [
                    { value: WIRED_CONDITION_QUANTIFIER_ALL, labelKey: `${ keyBase }.0` },
                    { value: WIRED_CONDITION_QUANTIFIER_ANY, labelKey: `${ keyBase }.1` }
                ] } />
        </WiredParam>
    );
}
