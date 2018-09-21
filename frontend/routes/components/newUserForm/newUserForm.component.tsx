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
import * as Autosuggest from 'react-autosuggest';

import { ButtonProps } from '@material-ui/core/Button';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import TextField from '@material-ui/core/TextField';

import { JobItem } from '../jobItem/jobItem.component';
import { UserItem } from '../userItem/userItem.component';

import {
	Container, Title, SaveButton, StyledTextField, StyledSelect, SuggestionsList, EmptySelectValue
} from './newUserForm.styles';

interface IProps {
	title: string;
	jobs: any[];
	users: any[];
	onSave: (user) => void;
	onCancel: () => void;
	clearSuggestions: () => void;
	getUsersSuggestions: (searchText) => void;
}

interface IState {
	name: string;
	job: string;
	isAdmin: boolean;
}

export class NewUserForm extends React.PureComponent<IProps, IState> {
	public state = {
		name: '',
		job: '',
		isAdmin: false
	};

	private popperNode = null;

	public handleChange = (field) => (event) => {
		this.setState({[field]: event.target.value || ''});
	}

	public handlePermissionsChange = (event, isAdmin) => {
		this.setState({isAdmin});
	}

	public handleSave = () => {
		this.props.onSave({...this.state});
	}

	public renderJobs = (jobs) => {
		return jobs.map((jobProps, index) => {
			return (
				<MenuItem key={index} value={jobProps.name}>
					<JobItem {...jobProps} />
				</MenuItem>
			);
		});
	}

	public renderInputComponent = (inputProps) => {
		const {inputRef , ref, ...other} = inputProps;

		return (
			<StyledTextField
				fullWidth
				InputProps={{
					inputRef: (node) => {
						ref(node);
						inputRef(node);
					}
				}}
				{...other}
			/>
		);
	}

	public getSuggestionValue = (suggestion) => {
		return suggestion.user;
	}

	public onSuggestionSelected = (event, {suggestion}) => {
		this.setState({name: this.getSuggestionValue(suggestion)});
	}

	public onSuggestionsFetchRequested = ({value}) => {
		this.props.getUsersSuggestions(value);
	}

	public renderUserSuggestion = (suggestion, {query, isHighlighted}) => {
		return (
			<MenuItem selected={isHighlighted} component="div">
				<UserItem {...suggestion} searchText={query}/>
			</MenuItem>
		);
	}

	public render() {
		const { onSave, onCancel, clearSuggestions, jobs, users, title } = this.props;
		return (
			<Container>
				<Grid
					container
					direction="column">
					<Title>{title}</Title>

					<FormControl required>
						<Autosuggest
							suggestions={users}
							onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
							onSuggestionsClearRequested={clearSuggestions}
							onSuggestionSelected={this.onSuggestionSelected}
							getSuggestionValue={this.getSuggestionValue}
							renderInputComponent={this.renderInputComponent}
							renderSuggestion={this.renderUserSuggestion}
							inputProps={{
								onChange: this.handleChange('name'),
								label: 'Username or email address',
								value: this.state.name,
								inputRef: (node) => {
									this.popperNode = node;
								}
							}}
							renderSuggestionsContainer={(options) => (
								<SuggestionsList
									anchorEl={this.popperNode}
									open={Boolean(options.children)}
									placement="bottom"
								>
									<Paper
										square
										{...options.containerProps}
										style={{ width: this.popperNode ? this.popperNode.clientWidth : null }}
									>
										{options.children}
									</Paper>
								</SuggestionsList>
							)}
						/>
					</FormControl>

					<FormControl>
						<InputLabel shrink htmlFor="job">Job</InputLabel>
						<StyledSelect
							value={this.state.job}
							displayEmpty
							inputProps={{
								id: "job"
							}}
							onChange={this.handleChange('job')}
						>
							<EmptySelectValue value="">Unassigned</EmptySelectValue>
							{this.renderJobs(jobs)}
						</StyledSelect>
					</FormControl>

					<FormControlLabel
						control={
							<Checkbox
								color="secondary"
								checked={this.state.isAdmin}
								onChange={this.handlePermissionsChange}
							/>
						}
						label="Add as Teamspace Admin"
					/>

					<Grid
						container
						direction="row">
						<SaveButton
							variant="contained"
							color="secondary"
							disabled={!this.state.name}
							aria-label="Save"
							onClick={this.handleSave}>
							+ Add user
						</SaveButton>
					</Grid>
				</Grid>
			</Container>
		);
	}
}