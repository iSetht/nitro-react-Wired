import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import {
    clampWiredText,
    clampWiredValue,
    normalizeWiredSource,
    parseWiredData,
    WiredButtonInfoText,
    WiredCheckbox,
    WiredControlTitle,
    WiredDisabled,
    WiredDivider,
    WiredInfoDesc,
    WiredParam,
    WiredRadio,
    WiredSelect,
    WiredSlider,
    WiredSubInfo,
    WiredTextInput,
    WiredValueOrVariable,
    wiredVariableSourceOptions,
    WIRED_VARIABLE_CONTEXT,
    WIRED_REFERENCE_FROM_VARIABLE,
    WIRED_REFERENCE_SET_VALUE,
    WIRED_SOURCE_SELECTED,
    WIRED_SOURCE_SELECTOR,
    WIRED_SOURCE_SIGNAL,
    WIRED_SOURCE_STACK_FURNI,
    WIRED_SOURCE_TRIGGER,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER
} from '../WiredControls';
import { wiredIconUrl } from '../WiredIcons';

const TRAJECTORY_STRAIGHT = 0;
const TRAJECTORY_CURVED = 1;
const DISTANCE_NORMAL = 0;
const DISTANCE_OVERSHOOT = 1;
const DISTANCE_FIXED = 2;
const MIN_CURVE_STRENGTH = -1000;
const MAX_CURVE_STRENGTH = 1000;
const MIN_DISTANCE_TILES = -64;
const MAX_DISTANCE_TILES = 64;
const MAX_SPEED_INCREASE_MS = 100000;

const FURNI_SOURCES = [ WIRED_SOURCE_STACK_FURNI, WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
const USER_SOURCES = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
const PROJECTILE_VARIABLES = [
    '@projectile.animation.tiles_travelled',
    '@projectile.animation.user_collisions',
    '@projectile.animation.furni_collisions',
    '@projectile.animation.position.x',
    '@projectile.animation.position.y',
    '@projectile.animation.position.altitude',
    '@projectile.animation.is_travelling'
] as const;

interface ProjectileData
{
    distanceVariableName?: string;
    timeVariableName?: string;
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
}

export const WiredExtraProjectileView: FC<{}> = props =>
{
    const [ rotateProjectileDirection, setRotateProjectileDirection ] = useState(true);
    const [ directionalSystem, setDirectionalSystem ] = useState(1);
    const [ changeShooterDirection, setChangeShooterDirection ] = useState(false);
    const [ bunnyHop, setBunnyHop ] = useState(false);
    const [ trajectoryType, setTrajectoryType ] = useState(TRAJECTORY_STRAIGHT);
    const [ curveStrength, setCurveStrength ] = useState('0');
    const [ distanceMode, setDistanceMode ] = useState(DISTANCE_NORMAL);
    const [ distanceReferenceMode, setDistanceReferenceMode ] = useState(WIRED_REFERENCE_SET_VALUE);
    const [ distanceValue, setDistanceValue ] = useState('0');
    const [ distanceVariableName, setDistanceVariableName ] = useState('');
    const [ distanceVariableType, setDistanceVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ distanceVariableSource, setDistanceVariableSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ overrideAnimationTime, setOverrideAnimationTime ] = useState(false);
    const [ timeReferenceMode, setTimeReferenceMode ] = useState(WIRED_REFERENCE_SET_VALUE);
    const [ timePerTileMs, setTimePerTileMs ] = useState('500');
    const [ timeVariableName, setTimeVariableName ] = useState('');
    const [ timeVariableType, setTimeVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ timeVariableSource, setTimeVariableSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ distanceX, setDistanceX ] = useState(true);
    const [ distanceY, setDistanceY ] = useState(true);
    const [ distanceZ, setDistanceZ ] = useState(false);
    const [ speedIncreaseMs, setSpeedIncreaseMs ] = useState('0');
    const [ rotationOffset, setRotationOffset ] = useState(0);
    const [ internalVariableMask, setInternalVariableMask ] = useState(0);
    const [ generalExpanded, setGeneralExpanded ] = useState(false);
    const [ directionExpanded, setDirectionExpanded ] = useState(true);
    const [ trajectoryExpanded, setTrajectoryExpanded ] = useState(false);
    const [ timeExpanded, setTimeExpanded ] = useState(false);
    const [ rotationExpanded, setRotationExpanded ] = useState(false);
    const [ variablesExpanded, setVariablesExpanded ] = useState(false);
    const [ sourceExpanded, setSourceExpanded ] = useState(false);
    const [ projectileSource, setProjectileSource ] = useState(WIRED_SOURCE_STACK_FURNI);
    const [ shooterSource, setShooterSource ] = useState(WIRED_SOURCE_TRIGGER);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<ProjectileData>(trigger?.stringData ?? ''), [ trigger ]);
    const variables = useMemo(() => ({
        global: data.globalVariables ?? [],
        furni: data.furniVariables ?? [],
        user: data.userVariables ?? [],
        context: data.contextVariables ?? []
    }), [ data ]);
    const distanceAmountEnabled = distanceMode === DISTANCE_OVERSHOOT || distanceMode === DISTANCE_FIXED;
    const timeOptionsEnabled = overrideAnimationTime;
    const distanceVariableEnabled = distanceAmountEnabled && distanceReferenceMode === WIRED_REFERENCE_FROM_VARIABLE;
    const timeVariableEnabled = timeOptionsEnabled && timeReferenceMode === WIRED_REFERENCE_FROM_VARIABLE;

    useEffect(() =>
    {
        if(!changeShooterDirection) setBunnyHop(false);
    }, [ changeShooterDirection ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedDistanceType = intData[9] ?? WIRED_VARIABLE_GLOBAL;
        const savedTimeType = intData[14] ?? WIRED_VARIABLE_GLOBAL;
        const variablesForType = (type: number) => type === WIRED_VARIABLE_FURNI ? (data.furniVariables ?? []) : (type === WIRED_VARIABLE_USER ? (data.userVariables ?? []) : (type === WIRED_VARIABLE_CONTEXT ? (data.contextVariables ?? []) : (data.globalVariables ?? [])));

        setRotateProjectileDirection((intData[0] ?? 1) === 1);
        setDirectionalSystem(clampWiredValue(intData[1] ?? 1, 0, 3));
        setChangeShooterDirection((intData[2] ?? 0) === 1);
        setBunnyHop((intData[3] ?? 0) === 1);
        setTrajectoryType((intData[4] ?? 0) === TRAJECTORY_CURVED ? TRAJECTORY_CURVED : TRAJECTORY_STRAIGHT);
        setCurveStrength(String(clampWiredValue(intData[5] ?? 0, MIN_CURVE_STRENGTH, MAX_CURVE_STRENGTH)));
        setDistanceMode([ DISTANCE_NORMAL, DISTANCE_OVERSHOOT, DISTANCE_FIXED ].includes(intData[6]) ? intData[6] : DISTANCE_NORMAL);
        setDistanceReferenceMode((intData[7] ?? 0) === WIRED_REFERENCE_FROM_VARIABLE ? WIRED_REFERENCE_FROM_VARIABLE : WIRED_REFERENCE_SET_VALUE);
        setDistanceValue(String(clampWiredValue(intData[8] ?? 0, MIN_DISTANCE_TILES, MAX_DISTANCE_TILES)));
        setDistanceVariableType(savedDistanceType);
        setDistanceVariableSource(normalizeWiredSource(intData[10] ?? WIRED_VARIABLE_GLOBAL, wiredVariableSourceOptions(savedDistanceType)));
        setOverrideAnimationTime((intData[11] ?? 0) === 1);
        setTimeReferenceMode((intData[12] ?? 0) === WIRED_REFERENCE_FROM_VARIABLE ? WIRED_REFERENCE_FROM_VARIABLE : WIRED_REFERENCE_SET_VALUE);
        setTimePerTileMs(String(clampWiredValue(intData[13] ?? 500, 0, MAX_SPEED_INCREASE_MS)));
        setTimeVariableType(savedTimeType);
        setTimeVariableSource(normalizeWiredSource(intData[15] ?? WIRED_VARIABLE_GLOBAL, wiredVariableSourceOptions(savedTimeType)));
        setDistanceX((intData[16] ?? 1) === 1);
        setDistanceY((intData[17] ?? 1) === 1);
        setDistanceZ((intData[18] ?? 0) === 1);
        setSpeedIncreaseMs(String(clampWiredValue(intData[19] ?? 0, 0, MAX_SPEED_INCREASE_MS)));
        setRotationOffset(clampWiredValue(intData[20] ?? 0, 0, 7));
        setInternalVariableMask(clampWiredValue(intData[21] ?? 0, 0, 127));
        setProjectileSource(normalizeWiredSource(intData[22] ?? WIRED_SOURCE_STACK_FURNI, FURNI_SOURCES));
        setShooterSource(normalizeWiredSource(intData[23] ?? WIRED_SOURCE_TRIGGER, USER_SOURCES));
        setDistanceVariableName(variablesForType(savedDistanceType).includes(data.distanceVariableName ?? '') ? data.distanceVariableName ?? '' : '');
        setTimeVariableName(variablesForType(savedTimeType).includes(data.timeVariableName ?? '') ? data.timeVariableName ?? '' : '');
    }, [ trigger, data ]);

    const save = () =>
    {
        setStringParam(JSON.stringify({
            distanceVariableName,
            timeVariableName
        }));
        setIntParams([
            rotateProjectileDirection ? 1 : 0,
            directionalSystem,
            changeShooterDirection ? 1 : 0,
            bunnyHop ? 1 : 0,
            trajectoryType,
            clampWiredValue(Number(curveStrength || 0), MIN_CURVE_STRENGTH, MAX_CURVE_STRENGTH),
            distanceMode,
            distanceReferenceMode,
            clampWiredValue(Number(distanceValue || 0), MIN_DISTANCE_TILES, MAX_DISTANCE_TILES),
            distanceVariableType,
            distanceVariableSource,
            overrideAnimationTime ? 1 : 0,
            timeReferenceMode,
            clampWiredValue(Number(timePerTileMs || 0), 0, MAX_SPEED_INCREASE_MS),
            timeVariableType,
            timeVariableSource,
            distanceX ? 1 : 0,
            distanceY ? 1 : 0,
            distanceZ ? 1 : 0,
            clampWiredValue(Number(speedIncreaseMs || 0), 0, MAX_SPEED_INCREASE_MS),
            rotationOffset,
            internalVariableMask,
            projectileSource,
            shooterSource,
            0,
            0,
            0
        ]);
    };

    const setInternalVariable = (index: number, checked: boolean) =>
    {
        const bit = 1 << index;
        setInternalVariableMask(value => checked ? (value | bit) : (value & ~bit));
    };

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            hideFurniSelector={ true }
            sourceSelectors={ [
                {
                    value: projectileSource,
                    onChange: setProjectileSource,
                    options: FURNI_SOURCES,
                    titleKey: 'wiredfurni.params.sources.furni.title.projectile',
                    labelPrefix: 'wiredfurni.params.sources.furni'
                },
                {
                    value: shooterSource,
                    onChange: setShooterSource,
                    options: USER_SOURCES,
                    titleKey: 'wiredfurni.params.sources.users.title.shooter',
                    labelPrefix: 'wiredfurni.params.sources.users'
                },
                ...(timeVariableEnabled ? [ {
                    value: timeVariableSource,
                    onChange: setTimeVariableSource,
                    options: wiredVariableSourceOptions(timeVariableType),
                    titleKey: 'wiredfurni.params.sources.merged.title.variable_time_per_tile',
                    labelPrefix: timeVariableType === WIRED_VARIABLE_FURNI ? 'wiredfurni.params.sources.furni' : (timeVariableType === WIRED_VARIABLE_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources'),
                    optionLabels: {
                        [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
                        [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
                    }
                } as any ] : []),
                ...(distanceVariableEnabled ? [ {
                    value: distanceVariableSource,
                    onChange: setDistanceVariableSource,
                    options: wiredVariableSourceOptions(distanceVariableType),
                    titleKey: 'wiredfurni.params.sources.merged.title.variable_animation_distance',
                    labelPrefix: distanceVariableType === WIRED_VARIABLE_FURNI ? 'wiredfurni.params.sources.furni' : (distanceVariableType === WIRED_VARIABLE_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources'),
                    optionLabels: {
                        [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
                        [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
                    }
                } as any ] : [])
            ] }
            expanded={ sourceExpanded }
            onToggleExpanded={ () => setSourceExpanded(value => !value) }
            windowWidth={ 306 }>
            <Column gap={ 1 }>
                <WiredParam chevron titleKey="wiredfurni.params.general_box_info" expanded={ generalExpanded } onToggle={ () => setGeneralExpanded(value => !value) }>
                    <WiredInfoDesc textKey="wiredfurni.params.projectile.usage_info" />
                </WiredParam>

                <WiredParam chevron titleKey="wiredfurni.params.projectile.direction" expanded={ directionExpanded } onToggle={ () => setDirectionExpanded(value => !value) }>
                    <WiredCheckbox checked={ rotateProjectileDirection } onChange={ setRotateProjectileDirection } label={ LocalizeText('wiredfurni.params.projectile.new_direction_enabled') } />
                    <Flex className="nw-indent-1" alignItems="center" gap={ 1 }>
                        <WiredButtonInfoText>{ LocalizeText('wiredfurni.params.projectile.directional_system') }</WiredButtonInfoText>
                        <WiredSelect
                            value={ directionalSystem }
                            onChange={ event => setDirectionalSystem(Number(event.target.value)) }
                            options={ [ 0, 1, 2, 3 ].map(value => ({ value, label: LocalizeText(`wiredfurni.params.projectile.directional_system.${ value }`) })) } />
                    </Flex>
                    <img className="nw-directional-preview" alt="" src={ wiredIconUrl(`directional_system_${ directionalSystem }.png`) } />
                    <WiredCheckbox className="nw-indent-1" checked={ changeShooterDirection } onChange={ setChangeShooterDirection } label={ LocalizeText('wiredfurni.params.projectile.change_shooter_direction') } />
                    <WiredDisabled disabled={ !changeShooterDirection }>
                        <WiredCheckbox className="nw-indent-2" checked={ bunnyHop && changeShooterDirection } onChange={ setBunnyHop } label={ LocalizeText('wiredfurni.params.projectile.bunny_hop') } />
                    </WiredDisabled>
                </WiredParam>

                <WiredParam chevron titleKey="wiredfurni.params.projectile.animation_trajectory" expanded={ trajectoryExpanded } onToggle={ () => setTrajectoryExpanded(value => !value) }>
                    <Column gap={ 1 }>
                        <WiredDivider />
                        <WiredControlTitle>{ LocalizeText('wiredfurni.params.projectile.animation_trajectory.trajectory') }</WiredControlTitle>
                        <WiredRadio name="projectileTrajectory" checked={ trajectoryType === TRAJECTORY_STRAIGHT } onChange={ () => setTrajectoryType(TRAJECTORY_STRAIGHT) } label={ LocalizeText('wiredfurni.params.projectile.animation_trajectory.trajectory.0') } />
                        <WiredSubInfo className="nw-indent-tab" textKey="wiredfurni.params.projectile.animation_trajectory.trajectory.0.info" />
                        <WiredRadio name="projectileTrajectory" checked={ trajectoryType === TRAJECTORY_CURVED } onChange={ () => setTrajectoryType(TRAJECTORY_CURVED) } label={ LocalizeText('wiredfurni.params.projectile.animation_trajectory.trajectory.1') } />
                        <WiredDisabled disabled={ trajectoryType !== TRAJECTORY_CURVED }>
                            <Flex className="nw-indent-tab" alignItems="center" gap={ 1 }>
                                <WiredButtonInfoText>{ LocalizeText('wiredfurni.params.projectile.animation_trajectory.trajectory.1.extra') }</WiredButtonInfoText>
                                <WiredTextInput compact type="number" min={ MIN_CURVE_STRENGTH } max={ MAX_CURVE_STRENGTH } value={ curveStrength } onChange={ event => setCurveStrength(clampWiredText(event.target.value, MIN_CURVE_STRENGTH, MAX_CURVE_STRENGTH)) } />
                            </Flex>
                        </WiredDisabled>
                        <WiredDivider />
                        <WiredControlTitle>{ LocalizeText('wiredfurni.params.projectile.animation_trajectory.distance') }</WiredControlTitle>
                        <WiredRadio name="projectileDistance" checked={ distanceMode === DISTANCE_NORMAL } onChange={ () => setDistanceMode(DISTANCE_NORMAL) } label={ LocalizeText('wiredfurni.params.projectile.animation_trajectory.distance.0') } />
                        <WiredRadio name="projectileDistance" checked={ distanceMode === DISTANCE_OVERSHOOT } onChange={ () => setDistanceMode(DISTANCE_OVERSHOOT) } label={ LocalizeText('wiredfurni.params.projectile.animation_trajectory.distance.1') } />
                        <WiredRadio name="projectileDistance" checked={ distanceMode === DISTANCE_FIXED } onChange={ () => setDistanceMode(DISTANCE_FIXED) } label={ LocalizeText('wiredfurni.params.projectile.animation_trajectory.distance.2') } />
                        <WiredDivider />
                        <WiredDisabled disabled={ !distanceAmountEnabled }>
                            <WiredControlTitle>{ LocalizeText('wiredfurni.params.projectile.animation_trajectory.distance_selection') }</WiredControlTitle>
                            <WiredValueOrVariable
                                radioName="projectileDistanceReference"
                                mode={ distanceReferenceMode }
                                onModeChange={ setDistanceReferenceMode }
                                value={ distanceValue }
                                onValueChange={ setDistanceValue }
                                min={ MIN_DISTANCE_TILES }
                                max={ MAX_DISTANCE_TILES }
                                variableType={ distanceVariableType }
                                onVariableTypeChange={ setDistanceVariableType }
                                variableName={ distanceVariableName }
                                onVariableNameChange={ setDistanceVariableName }
                                variableSource={ distanceVariableSource }
                                onVariableSourceChange={ setDistanceVariableSource }
                                variables={ variables } />
                        </WiredDisabled>
                    </Column>
                </WiredParam>

                <WiredParam chevron titleKey="wiredfurni.params.projectile.animation_time" expanded={ timeExpanded } onToggle={ () => setTimeExpanded(value => !value) }>
                    <Column gap={ 1 }>
                        <WiredCheckbox checked={ overrideAnimationTime } onChange={ setOverrideAnimationTime } label={ LocalizeText('wiredfurni.params.projectile.override_animation_time') } />
                        <WiredDivider />
                        <WiredDisabled className="nw-indent-sm" disabled={ !timeOptionsEnabled }>
                            <WiredControlTitle>{ LocalizeText('wiredfurni.params.projectile.time_per_tile') }</WiredControlTitle>
                            <WiredValueOrVariable
                                radioName="projectileTimeReference"
                                mode={ timeReferenceMode }
                                onModeChange={ setTimeReferenceMode }
                                value={ timePerTileMs }
                                onValueChange={ setTimePerTileMs }
                                min={ 0 }
                                max={ MAX_SPEED_INCREASE_MS }
                                variableType={ timeVariableType }
                                onVariableTypeChange={ setTimeVariableType }
                                variableName={ timeVariableName }
                                onVariableNameChange={ setTimeVariableName }
                                variableSource={ timeVariableSource }
                                onVariableSourceChange={ setTimeVariableSource }
                                variables={ variables } />
                        </WiredDisabled>
                        <WiredDivider />
                        <WiredControlTitle>{ LocalizeText('wiredfurni.params.projectile.distance_options') }</WiredControlTitle>
                        <WiredCheckbox checked={ distanceX } onChange={ setDistanceX } label={ LocalizeText('wiredfurni.params.projectile.distance_x') } />
                        <WiredCheckbox checked={ distanceY } onChange={ setDistanceY } label={ LocalizeText('wiredfurni.params.projectile.distance_y') } />
                        <WiredCheckbox checked={ distanceZ } onChange={ setDistanceZ } label={ LocalizeText('wiredfurni.params.projectile.distance_z') } />
                        <WiredDivider />
                        <WiredControlTitle>{ LocalizeText('wiredfurni.params.projectile.increase_speed.title') }</WiredControlTitle>
                        <Flex alignItems="center" gap={ 1 }>
                            <WiredButtonInfoText>{ LocalizeText('wiredfurni.params.projectile.increase_speed') }</WiredButtonInfoText>
                            <WiredTextInput compact type="number" min={ 0 } max={ MAX_SPEED_INCREASE_MS } value={ speedIncreaseMs } onChange={ event => setSpeedIncreaseMs(clampWiredText(event.target.value, 0, MAX_SPEED_INCREASE_MS)) } />
                        </Flex>
                    </Column>
                </WiredParam>

                <WiredParam chevron title={ LocalizeText('wiredfurni.params.projectile.rotation_offset', [ 'offset' ], [ String(rotationOffset) ]) } expanded={ rotationExpanded } onToggle={ () => setRotationExpanded(value => !value) }>
                    <WiredSlider min={ 0 } max={ 7 } value={ rotationOffset } onChange={ setRotationOffset } />
                </WiredParam>

                <WiredParam chevron titleKey="wiredfurni.params.projectile.projectile.variables" expanded={ variablesExpanded } onToggle={ () => setVariablesExpanded(value => !value) } divider={ false }>
                    <Column gap={ 1 }>
                        { PROJECTILE_VARIABLES.map((name, index) =>
                            <div key={ name }>
                                <Flex className="nw-time-util-row" alignItems="center" gap={ 1 }>
                                    <WiredCheckbox
                                        className="nw-time-util-choice"
                                        checked={ (internalVariableMask & (1 << index)) !== 0 }
                                        onChange={ checked => setInternalVariable(index, checked) }
                                        label={ LocalizeText(`wiredfurni.params.projectile.variable.${ index }`) } />
                                    <WiredTextInput
                                        className="nw-time-util-input"
                                        readOnly
                                        disabled={ (internalVariableMask & (1 << index)) === 0 }
                                        value={ name } />
                                </Flex>
                                { [ 0, 1, 2, 6 ].includes(index) && <WiredSubInfo textKey={ `wiredfurni.params.projectile.variable.${ index }.extra` } /> }
                            </div>) }
                    </Column>
                </WiredParam>
            </Column>
        </WiredBaseView>
    );
}
