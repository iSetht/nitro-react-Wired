import { FC } from 'react';
import { WiredSelectorNeighborhoodView } from './WiredSelectorNeighborhoodView';

const SOURCE_KIND_USER = 1;
const SOURCE_TRIGGER = 0;

export const WiredSelectorUserInNeighborhoodView: FC<{}> = props =>
{
    return <WiredSelectorNeighborhoodView defaultSourceKind={ SOURCE_KIND_USER } defaultSource={ SOURCE_TRIGGER } />;
};
