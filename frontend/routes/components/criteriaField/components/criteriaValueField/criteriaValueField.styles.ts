import styled, { css } from 'styled-components';
import { Grid, TextField } from '@material-ui/core';

export const RangeInput = styled(TextField)`
  margin-top: 6px;
`;

export const SingleInput = styled(TextField)`
  margin-top: 6px;
`;

export const MultipleInput = styled(TextField)`
  display: block;
  margin-top: 6px;
  width: 85%;
`;

export const InputWrapper = styled(Grid)`
  display: flex;
  margin-top: 14px;
  width: 100%;

  ${SingleInput} {
    width: 100%;
	}
`;

export const RangeInputs = styled(Grid)`
  display: flex;
  margin-top: 14px;

  ${RangeInput} {
		width: 50%;
	}

	${/* sc-selector */ RangeInput}:nth-child(2n) {
		margin-left: 12px;
	}

	${/* sc-selector */ RangeInput}:nth-child(2n + 1) {
		margin-right: 12px;
	}
`;

export const MultipleInputsContainer = styled(Grid)`
  display: flex;
  margin-top: 12px;
  position: relative;
`;

export const MultipleInputs = styled(Grid)`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  width: 100%;
`;

export const AddButton = styled.div`
  position: absolute;
  right: 0;
  top: -20px;
`;

export const NewMultipleInputWrapper = styled.div`
  position: relative;
  margin-bottom: 12px;
`;

export const RemoveButton = styled.div`
  position: absolute;
  right: 0;
  top: 8px;
`;

export const RegexInfoLink = styled.a`
  margin-top: 20px;
  text-decoration: none;
`;