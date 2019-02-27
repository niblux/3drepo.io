import * as React from 'react';
import * as Yup from 'yup';

import { Form, Field, withFormik, connect } from 'formik';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';

import Label from '@material-ui/core/FormLabel';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';

import { TextField } from '../textField/textField.component';
import {
	SelectField,
	FormControl,
	NewCriterionFooter,
	CriteriaList,
	CriterionType,
	Operators
} from './criteriaField.styles';
import { SubmitButton } from '../submitButton/submitButton.component';
import { CRITERIA_LIST } from '../../../constants/criteria';
import { VALIDATIONS_MESSAGES } from '../../../services/validation';

const CriterionSchema = Yup.object().shape({
	field: Yup.string().required(),
	operation: Yup.string().required()
});

interface IProps {
	criterion: any;
	onSubmit: (values) => void;
}

class NewCreaterionFormComponent extends React.PureComponent<IProps, any> {
	public componentDidMount() {}

	public renderOperator = ({ operator, label }) => (
		<MenuItem key={operator} value={operator}>
			{label}
		</MenuItem>
	)

	public renderOperators = () => (
		<CriteriaList subheader={<li />}>
			{CRITERIA_LIST.map(({ name, operators }) => (
				<CriterionType key={name}>
					<Operators>
						<ListSubheader>{name}</ListSubheader>
						{operators.map(this.renderOperator)}
					</Operators>
				</CriterionType>
			))}
		</CriteriaList>
	)

	public render() {
		return (
			<Form>
				<FormControl>
					<InputLabel shrink>Field</InputLabel>
					<Field name="field" render={({ field, form }) => (
						<SelectField
							{...field}
						/>
					)} />
				</FormControl>

				<FormControl>
					<InputLabel shrink>Operation</InputLabel>
					<Field name="operator" render={({ field, form }) => (
						<SelectField
							{...field}
						>
							{this.renderOperators()}
						</SelectField>
					)} />
				</FormControl>

				<Field name="value" render={({ field }) => (
					<TextField
						{...field}
						label="Value"
						placeholder="Set value"
						fullWidth
						InputLabelProps={{
							shrink: true
						}}
					/>
				)} />

				<NewCriterionFooter>
					<Field render={({ form }) => (
						<SubmitButton disabled={!form.isValid || form.isValidating}>Confirm</SubmitButton>
					)} />
				</NewCriterionFooter>
			</Form>
		);
	}
}

export const NewCriterionForm = withFormik({
	mapPropsToValues: ({ criterion }) => ({
		field: criterion.field,
		operator: criterion.operator,
		value: criterion.value
	}),
	handleSubmit: (values, { props }) => {
		(props as IProps).onSubmit(values);
	},
	enableReinitialize: true,
	validationSchema: CriterionSchema
})(connect(NewCreaterionFormComponent as any)) as any;