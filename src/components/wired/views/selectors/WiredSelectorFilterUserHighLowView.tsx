import { FC } from 'react';
import { WIRED_VARIABLE_USER } from '../WiredControls';
import { WiredSelectorVariableHighLowFilterView } from './WiredSelectorVariableHighLowFilterView';

export const WiredSelectorFilterUserHighLowView: FC<{}> = () => <WiredSelectorVariableHighLowFilterView variableType={ WIRED_VARIABLE_USER } />;
