/**
 *  Copyright (C) 2017 3D Repo Ltd
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import * as queryString from 'query-string';
import { isEmpty } from 'lodash';
import { Formik, Field } from 'formik';
import { snakeCase } from 'lodash';

import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import Chip from '@material-ui/core/Chip';

import { clientConfigService } from '../../services/clientConfig';
import { ENTER_KEY } from '../../constants/keys';

import { Panel } from '../components/panel/panel.component';
import { CellSelect } from '../components/customTable/components/cellSelect/cellSelect.component';

import {
	FieldsRow,
	StyledTextField,
	SelectWrapper,
	TopicTypesContainer,
	StyledForm,
	Headline,
	TypesGrid,
	GridColumn,
	StyledIcon,
	StyledLink
} from './modelSettings.styles';

const PANEL_PROPS = {
	paperProps: {
		height: '100%'
	}
};

interface IState {
	topicTypes?: any[];
	latitude?: number;
	longitude?: number;
	axisX?: number;
	axisY?: number;
	axisZ?: number;
	elevation?: number;
	angleFromNorth?: number;
	code?: string;
	unit?: string;
}

interface IProps {
	location: any;
	history: any;
	fetchModelSettings: (teamspace, modelId) => void;
	updateModelSettings: (teamspace, modelId, settings) => void;
	modelSettings: any;
	currentTeamspace: string;
}

export class ModelSettings extends React.PureComponent<IProps, IState> {
	public state = {
		topicTypes: [],
		latitude: 0,
		longitude: 0,
		axisX: 0,
		axisY: 0,
		axisZ: 0,
		elevation: 0,
		angleFromNorth: 0
	};

	public componentDidMount() {
		const queryParams = queryString.parse(this.props.location.search);
		const { modelId, targetAcct } = queryParams; // TODO: change targetAcct name

		this.props.fetchModelSettings(targetAcct, modelId);
	}

	public componentDidUpdate(prevProps, prevState) {
		const changes = {} as any;

		const { properties, surveyPoints, elevation, angleFromNorth } = this.props.modelSettings;
		const { axisX, axisY, axisZ, latitude, longitude } = this.state;
		const topicTypes = properties.topicTypes;
		const prevSurveyPoints = prevProps.modelSettings.surveyPoints;

		if (!prevProps.modelSettings.properties && properties) {
			if (topicTypes && topicTypes.length !== prevState.topicTypes.length) {
				changes.topicTypes = topicTypes;
			}
		}

		if (elevation && prevProps.modelSettings.elevation !== elevation) {
			changes.elevation = elevation;
		}

		if (angleFromNorth && prevProps.modelSettings.angleFromNorth !== angleFromNorth) {
			changes.angleFromNorth = angleFromNorth;
		}

		if (prevSurveyPoints !== surveyPoints && surveyPoints.length) {
			const [ { latLong, position } ] = surveyPoints;
			if (axisX !== position[0]) {
				changes.axisX = position[0];
			}

			if (axisY !== position[1]) {
				changes.axisY = position[1];
			}

			if (axisZ !== position[2]) {
				changes.axisZ = position[2];
			}

			if (latitude !== latLong[0]) {
				changes.latitude = latLong[0];
			}

			if (longitude !== latLong[1]) {
				changes.longitude = latLong[1];
			}
		}

		if (!isEmpty(changes)) {
			this.setState(changes);
		}
	}

	public handleUpdateSettings = (data) => {
		const queryParams = queryString.parse(this.props.location.search);
		const { modelId, targetAcct } = queryParams;
		const { name, unit, type, code, elevation, angleFromNorth, fourDSequenceTag } = data;
		const { topicTypes, axisX, axisY, axisZ, latitude, longitude } = this.state;
		const types = topicTypes.map((topicType) => topicType.label);

		const settings = {
			name,
			unit,
			angleFromNorth,
			code,
			elevation,
			type,
			fourDSequenceTag,
			surveyPoints: [{
				position: [ axisX, axisY, axisZ ],
				latLong: [ latitude, longitude ]
			}],
			topicTypes: types
		};

		this.props.updateModelSettings(targetAcct, modelId, settings);
	}

	public deleteTopicType = (name) => {
		this.setState({
			topicTypes: this.state.topicTypes.filter((typeName) => typeName !== name)
		});
	}

	public handleNewTopicSubmit = (event) => {
		if (event.key === ENTER_KEY) {
			this.setState({
				topicTypes: [...this.state.topicTypes, {
					label: event.target.value, value: snakeCase(event.target.value)
				}]
			});

			event.target.value = '';
			event.preventDefault();
		}
	}

	public handlePointChange = (onChange, name) => (event, ...params) => {
		this.setState({
			[name]: Number(event.target.value)
		});

		onChange(event, ...params);
	}

	public renderTitleWithBackLink = () => (
		<>
			<StyledLink to={this.props.location.pathname}>
				<StyledIcon />
			</StyledLink>
			Model Settings
		</>
	)

	public render() {
		const { id, name, type, fourDSequenceTag, properties } = this.props.modelSettings;
		const { latitude, longitude, axisX, axisY, axisZ, angleFromNorth, elevation } = this.state;

		if (!id || !properties) {
			return null;
		}

		return (
			<Panel {...PANEL_PROPS} title={this.renderTitleWithBackLink()}>
				<Formik
					initialValues={{
						id, name, type, code: properties.code, unit: properties.unit, fourDSequenceTag,
						latitude, longitude, axisX, axisY, axisZ, elevation, angleFromNorth
					}}
					onSubmit={this.handleUpdateSettings}
					>
					<StyledForm>
						<Headline color="primary" variant="subheading">Model Information</Headline>
						<Grid>
							<FieldsRow container wrap="nowrap">
								<Field name="id" render={({ field }) => (
									<StyledTextField
										{...field}
										label="Model ID"
										margin="normal"
										disabled
									/>
								)} />
								<Field name="name" render={({ field, form }) => (
									<StyledTextField
										{...field}
										error={Boolean(form.errors.name)}
										helperText={form.errors.name}
										label="Model name"
										margin="normal"
									/>
								)} />
							</FieldsRow>
							<FieldsRow container wrap="nowrap">
								<Field name="type" render={({ field }) => (
									<StyledTextField
										{...field}
										label="Model type"
										margin="normal"
										disabled
									/>
								)} />
								<Field name="code" render={({ field }) => (
									<StyledTextField
										{...field}
										label="Model code"
										margin="normal"
									/>
								)} />
							</FieldsRow>
							<FieldsRow container wrap="nowrap">
								<Field name="fourDSequenceTag" render={({ field }) => (
									<StyledTextField
										{...field}
										label="4D Sequence Tag"
										margin="normal"
									/>
								)} />
								<SelectWrapper fullWidth={true}>
									<InputLabel shrink htmlFor="unit-select">Unit</InputLabel>
									<Field name="unit" render={({ field }) => (
										<CellSelect
											{...field}
											items={clientConfigService.units}
											inputId="unit-select"
										/>
									)} />
								</SelectWrapper>
							</FieldsRow>
							<TypesGrid container direction="column">
								<TopicTypesContainer>
									{this.state.topicTypes.map(
										(topicType, index) => (
											<Chip key={index} label={topicType.label} onDelete={() => this.deleteTopicType(topicType)} />
										)
									)}
								</TopicTypesContainer>
								<Input
									onKeyPress={(event) => this.handleNewTopicSubmit(event)}
									placeholder="Enter topic types"
								/>
							</TypesGrid>
						</Grid>
						<Headline color="primary" variant="subheading">GIS Reference Information</Headline>
						<Grid container direction="column" wrap="nowrap">
							<Grid container direction="row" wrap="nowrap">
								<GridColumn container direction="column" wrap="nowrap">
									<Headline color="textPrimary" variant="subheading">Survey Point</Headline>
									<Field name="latitude" render={({ field }) => (
										<StyledTextField
											{...field}
											type="number"
											label="Latitude (Decimal)"
											margin="normal"
											value={latitude}
											onChange={this.handlePointChange(field.onChange, field.name)}
										/>
									)} />
									<Field name="longitude" render={({ field }) => (
										<StyledTextField
											{...field}
											type="number"
											label="Longitude"
											margin="normal"
											value={longitude}
											onChange={this.handlePointChange(field.onChange, field.name)}
										/>
									)} />
									<Field name="elevation" render={({ field }) => (
										<StyledTextField
											{...field}
											type="number"
											label="Elevation"
											margin="normal"
											value={elevation}
											onChange={this.handlePointChange(field.onChange, field.name)}
										/>
									)} />
									<Field name="angleFromNorth" render={({ field }) => (
										<StyledTextField
											{...field}
											type="number"
											label="Angle from North (Clockwise Degrees)"
											margin="normal"
											value={angleFromNorth}
											onChange={this.handlePointChange(field.onChange, field.name)}
										/>
									)} />
								</GridColumn>
								<GridColumn container direction="column" wrap="nowrap">
									<Headline color="textPrimary" variant="subheading">Project Point</Headline>
									<Field name="axisX" render={({ field }) => (
										<StyledTextField
											{...field}
											type="number"
											label="x (mm)"
											margin="normal"
											value={axisX}
											onChange={this.handlePointChange(field.onChange, field.name)}
										/>
									)} />
									<Field name="axisY" render={({ field }) => (
										<StyledTextField
											{...field}
											type="number"
											label="y (mm)"
											margin="normal"
											value={axisY}
											onChange={this.handlePointChange(field.onChange, field.name)}
										/>
									)} />
									<Field name="axisZ" render={({ field }) => (
										<StyledTextField
											{...field}
											type="number"
											label="z (mm)"
											margin="normal"
											value={axisZ}
											onChange={this.handlePointChange(field.onChange, field.name)}
										/>
									)} />
								</GridColumn>
							</Grid>
						</Grid>
						<Grid container direction="column" alignItems="flex-end">
							<Field render={({ form }) =>
								<Button
										type="submit"
										variant="raised"
										color="secondary"
										disabled={
											!form.isValid ||
											form.isValidating
										}
									>
										Save
								</Button>
							} />
						</Grid>
					</StyledForm>
				</Formik>
			</Panel>
		);
	}
}