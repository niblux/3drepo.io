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
import * as Yup from 'yup';
import { Formik, Field, Form } from 'formik';
import { getPasswordStrength, getPasswordStrengthMessage, schema } from '../../services/validation';
import { clientConfigService } from './../../services/clientConfig';

import { Panel } from '../components/panel/panel.component';
import { Logo } from '../components/logo/logo.component';
import { Footer } from './components/footer';
import { SubmitButton } from '../components/submitButton/submitButton.component';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import {
	Container,
	Headline,
	StyledGrid,
	StyledFormControl,
	ButtonContainer
} from './signUp.styles';
import { FieldsRow, StyledTextField } from '../profile/profile.styles';

const RegistrationInitialValues = {
	captcha: undefined,
	company: '',
	countryCode: '',
	email: '',
	emailConfirm: '',
	username: '',
	firstName: '',
	lastName: '',
	password: '',
	passwordConfirm: '',
	termsAgreed: false,
	mailListAgreed: false
};

const RegistrationSchema = Yup.object().shape({
	username: schema.required,
	password: schema.password
		.min(0)
		.strength(1, 'This password is weak'),
	passwordConfirm: schema.password
		.min(0)
		.equalTo(
			Yup.ref('password'),
			'Password confirmation must match password'
		),
	firstName: schema.required,
	lastName: schema.required,
	email: schema.email,
	emailConfirm: schema.email
		.equalTo(
			Yup.ref('email'),
			'Email confirmation must match email'
		),
	countryCode: schema.required,
	termsAgreed: schema.required
});

const DEFAULT_INPUT_PROPS = {
	margin: 'normal',
	required: true
};

interface IProps {
	history: any;
	location: any;
	headlineText?: string;
	onRegister: (username, data) => void;
	isPending: boolean;
}

interface IState {
	passwordStrengthMessage: string;
}

export class SignUp extends React.PureComponent<IProps, IState> {
	public state = {
		passwordStrengthMessage: ''
	};

	public handleSubmit = (values, form) => {
		const data = {
			captcha: undefined,
			company: values.company,
			countryCode: values.countryCode,
			email: values.email,
			firstName: values.firstName,
			lastName: values.lastName,
			password: values.password,
			mailListAgreed: values.mailListAgreed
		};

		this.props.onRegister(values.username, data);
		this.resetForm(form);
	}

	public resetForm = (form) => {
		form.resetForm();
		this.setState({
			passwordStrengthMessage: ''
		});
	}

	public handlePasswordChange = (onChange) => (event, ...params) => {
		const password = event.target.value;
		getPasswordStrength(password).then((strength) => {
			this.setState({
				passwordStrengthMessage: password.length > 7 ? ` (${getPasswordStrengthMessage(strength)})` : ''
			});
		});

		onChange(event, ...params);
	}

	public renderCountries = () =>
		clientConfigService.countries.map((country) => (
			<MenuItem key={country.code} value={country.code}>
				{country.name}
			</MenuItem>
	))

	public render() {
		return (
			<Container
				container
				direction="column"
				justify="center"
				alignItems="center">
				<Logo />
				<StyledGrid item xs={9} sm={6} md={6} lg={6} xl={2}>
					<Panel title="Sign up">
						<Headline>{'Creating a 3D Repo account is free'}</Headline>
						<Formik
							initialValues={RegistrationInitialValues}
							onSubmit={this.handleSubmit}
							validationSchema={RegistrationSchema}
						>
							<Form>
								<Field name="username" render={({ field, form }) => (
									<StyledTextField
										{...DEFAULT_INPUT_PROPS}
										{...field}
										error={Boolean(form.touched.username && form.errors.username)}
										helperText={form.touched.username && (form.errors.username || '')}
										label="Username"
										fullWidth={true}
									/>
								)} />
								<FieldsRow container wrap="nowrap">
									<Field name="password" render={({ field, form }) => (
										<StyledTextField
											{...DEFAULT_INPUT_PROPS}
											{...field}
											error={Boolean(form.touched.password && form.errors.password)}
											helperText={form.touched.password && (form.errors.password || '')}
											label={`Password${this.state.passwordStrengthMessage}`}
											type="password"
											onChange={this.handlePasswordChange(field.onChange)}
										/>
									)} />
									<Field name="passwordConfirm" render={({ field, form }) => (
										<StyledTextField
											{...DEFAULT_INPUT_PROPS}
											{...field}
											error={Boolean(form.touched.passwordConfirm && form.errors.passwordConfirm)}
											helperText={form.touched.passwordConfirm && (form.errors.passwordConfirm || '')}
											label="Password confirmation"
											type="password"
											onChange={this.handlePasswordChange(field.onChange)}
										/>
									)} />
								</FieldsRow>
								<FieldsRow container wrap="nowrap">
									<Field name="firstName" render={({ field, form }) => (
										<StyledTextField
											{...DEFAULT_INPUT_PROPS}
											{...field}
											error={Boolean(form.touched.firstName && form.errors.firstName)}
											helperText={form.touched.firstName && (form.errors.firstName || '')}
											label="First name"
										/>
									)} />
									<Field name="lastName" render={({ field, form }) => (
										<StyledTextField
											{...DEFAULT_INPUT_PROPS}
											{...field}
											error={Boolean(form.touched.lastName && form.errors.lastName)}
											helperText={form.touched.lastName && (form.errors.lastName || '')}
											label="Last name"
										/>
									)} />
								</FieldsRow>
								<FieldsRow container wrap="nowrap">
									<Field name="email" render={({ field, form }) => (
										<StyledTextField
											{...DEFAULT_INPUT_PROPS}
											{...field}
											error={Boolean(form.touched.email && form.errors.email)}
											helperText={form.touched.email && (form.errors.email || '')}
											label="Email"
										/>
									)} />
									<Field name="emailConfirm" render={({ field, form }) => (
										<StyledTextField
											{...DEFAULT_INPUT_PROPS}
											{...field}
											error={Boolean(form.touched.emailConfirm && form.errors.emailConfirm)}
											helperText={form.touched.emailConfirm && (form.errors.emailConfirm || '')}
											label="Confirm email"
										/>
									)} />
								</FieldsRow>
								<FieldsRow container wrap="nowrap">
									<Field name="company" render={({ field, form }) => (
										<StyledTextField
											{...field}
											label="Company"
											margin="normal"
										/>
									)} />
									<StyledFormControl>
										<InputLabel>Country *</InputLabel>
										<Field
											name="countryCode"
											render={({ field }) => (
												<Select
													{...field}
													required>
													{ this.renderCountries() }
												</Select>
											)}
										/>
									</StyledFormControl>
								</FieldsRow>

								<Field
									name="mailListAgreed"
									render={({ field }) => (
										<FormControlLabel
											{...field}
											value={field.value ? '1' : '0'}
											control={<Checkbox color="secondary"/>}
											label="Sign up for the latest news and tutorials!"
										/>
									)}
								/>

								<Field
									name="termsAgreed"
									required
									render={({ field }) => (
											<FormControlLabel
												{...field}
												value={field.value ? '1' : '0'}
												control={<Checkbox color="secondary" />}
												label="I agree to the Terms & Conditions and I have read the Privacy policy and the Cookies policy."
											/>
										)
									}
								/>
								<ButtonContainer>
									<Field render={({ form }) => (
										<SubmitButton
											pending={false}
											disabled={!form.isValid || form.isValidating}
										>
											Sign up
										</SubmitButton>
									)} />
								</ButtonContainer>
							</Form>
						</Formik>
						<Footer />
					</Panel>
				</StyledGrid>
			</Container>
		);
	}
}