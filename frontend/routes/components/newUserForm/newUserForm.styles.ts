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

import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';

import { COLOR } from '../../../styles';

export const Title = styled.div`
	font-size: 14px;
	color: ${COLOR.BLACK_20};
`;

export const StyledTextField = styled(TextField)`
	font-size: 14px;
	margin-bottom: 12px;
`;

export const StyledSelect = styled(Select)``;

export const EmptySelectValue = styled(MenuItem)`
	&& {
		font-size: 14px;
		color: ${COLOR.BLACK_60};
	}
`;

export const SaveButton = styled(Button)`
	&& {
		width: 100%;
		margin-top: 8px;
	}
`;

export const Container = styled.div`
	width: 290px;

	${StyledTextField},
	${StyledSelect},
	${Title} {
		margin-bottom: 12px;
	}

	${StyledTextField}, ${StyledTextField} *,
	${StyledSelect} {
		font-size: 14px;
		color: ${COLOR.BLACK_60};
	}
`;

export const SuggestionsList = styled(Popper)`
	z-index: 12323;
	margin-top: -15px;
	position: absolute;

	.react-autosuggest__suggestions-list {
		max-height: 250px;
		overflow: auto;
		padding-left: 0;
	}

	.react-autosuggest__suggestion {
		list-style: none;
		height: 62px;
		border-bottom: 1px solid ${COLOR.BLACK_6};
		display: flex;
		flex: 1;
		align-items: center;
	}

	.react-autosuggest__suggestion > div {
		flex: 1;
	}
`;