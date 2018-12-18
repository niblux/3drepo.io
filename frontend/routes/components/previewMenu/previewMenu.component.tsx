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
import { ButtonMenu } from './../buttonMenu/buttonMenu.component';
import IconButton from '@material-ui/core/IconButton';
import MoreIcon from '@material-ui/icons/MoreVert';

import { Menu, MenuItem } from './previewMenu.styles';
interface IProps {
	items: any[];
}

const MenuButton = ({ IconProps, Icon, ...props }) => (
	<IconButton
		{...props}
		aria-label="Show menu"
		aria-haspopup="true"
	>
		<MoreIcon {...IconProps} />
	</IconButton>
);

export class PreviewMenu extends React.PureComponent<IProps, any> {
	public renderMenuContent = () => (
		<Menu>
			{ this.props.items.map(
				({ Icon, title, action }) =>
					<MenuItem key={title} button onClick={action}>
						<Icon/> {title}
					</MenuItem>
			)}
		</Menu>
	)

	public render() {
		return (
			<ButtonMenu
				renderButton={MenuButton}
				renderContent={this.renderMenuContent}
				PopoverProps={{
					anchorOrigin: { vertical: 'center', horizontal: 'left' }
				}}
				ButtonProps={{
					disabled: false
				}}
			/>
		);
	}
}
