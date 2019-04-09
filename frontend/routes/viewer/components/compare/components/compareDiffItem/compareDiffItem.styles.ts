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
import { COLOR } from '../../../../../../styles';

interface IContainer {
	disabled: boolean;
}

interface IName {
	disabled: boolean;
}

interface ICurrentRevision {
	disabled: boolean;
}

export const Container = styled.div<IContainer>`
  display: flex;
  align-items: center;
  border-bottom: 1px solid ${COLOR.BLACK_6};
	height: 80px;
	padding-right: 30px;
`;

export const ModelData = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const Name = styled.div<IName>`
  color: ${(props) => props.disabled ? COLOR.BLACK_20 : COLOR.BLACK_80};
  font-size: 14px;
`;

export const CurrentRevision = styled.div<ICurrentRevision>`
  color: ${(props) => props.disabled ? COLOR.BLACK_20 : '#757575'};
  font-size: 14px;
`;

export const Revisions = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  height: 20px;
  align-items: center;
  overflow: hidden;
  margin-top: 6px;
`;