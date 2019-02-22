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

import { bindActionCreators } from 'redux';
import { createStructuredSelector } from 'reselect';
import { connect } from '../../../../helpers/migration';

import { Groups } from './groups.component';
import { 
  GroupsActions, 
  selectGroupsMap, 
  selectGroups, 
  selectIsPending,
  selectActiveGroupId,
  selectActiveGroupDetails,
  selectShowDetails,
  selectHighlightedGroups
} from './../../../../modules/groups';

const mapStateToProps = createStructuredSelector({
  groups: selectGroups,
  isPending: selectIsPending,
  activeGroupId: selectActiveGroupId,
	activeGroupDetails: selectActiveGroupDetails,
  showDetails: selectShowDetails,
  highlightedGroups: selectHighlightedGroups
});

export const mapDispatchToProps = (dispatch) => bindActionCreators({
  setActiveGroup: GroupsActions.setActiveGroup,
  setState: GroupsActions.setComponentState,
	showGroupDetails: GroupsActions.showDetails,
	closeDetails: GroupsActions.closeDetails
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Groups);