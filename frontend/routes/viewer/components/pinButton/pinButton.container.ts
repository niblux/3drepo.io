/**
 *  Copyright (C) 2019 3D Repo Ltd
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

import { bindActionCreators } from 'redux';
import { createStructuredSelector } from 'reselect';
import { connect } from '../../../../helpers/migration';
import { MeasureActions } from '../../../../modules/measure';
import { PinButton } from './pinButton.component';

const mapStateToProps = createStructuredSelector({});

export const mapDispatchToProps = (dispatch) => bindActionCreators({
	disableMeasure: MeasureActions.setDisabled,
	deactivateMeasure: MeasureActions.deactivateMeasure
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(PinButton);
