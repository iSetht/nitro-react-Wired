import { FC } from 'react';
import { WIRED_VARIABLE_FURNI } from '../WiredControls';
import { WiredSelectorVariableHighLowFilterView } from './WiredSelectorVariableHighLowFilterView';

export const WiredSelectorFilterFurniHighLowView: FC<{}> = () => <WiredSelectorVariableHighLowFilterView variableType={ WIRED_VARIABLE_FURNI } />;
