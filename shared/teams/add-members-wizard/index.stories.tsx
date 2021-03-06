import * as React from 'react'
import * as Sb from '../../stories/storybook'
import * as Container from '../../util/container'
import * as Constants from '../../constants/teams'
import EnableContacts from './enable-contacts'
import AddEmail from './add-email'
import AddFromWhere from './add-from-where'

const fakeTeamID = 'fakeTeamID'
const store = Container.produce(Sb.createStoreWithCommon(), draftState => {
  draftState.teams = {
    ...draftState.teams,
    teamMeta: new Map([[fakeTeamID, {...Constants.emptyTeamMeta, teamname: 'greenpeace.board'}]]),
  }
  draftState.config = {
    ...draftState.config,
    username: 'andonuts',
  }
})

const fromWhereProps = Sb.createNavigator({teamID: fakeTeamID})
const fromWhereNewProps = Sb.createNavigator({newTeam: true, teamID: fakeTeamID})

const load = () => {
  Sb.storiesOf('Teams/Add member wizard', module)
    .addDecorator(story => <Sb.MockStore store={store}>{story()}</Sb.MockStore>)
    .add('Add from where', () => <AddFromWhere {...fromWhereProps} />)
    .add('Add from where (new team)', () => <AddFromWhere {...fromWhereNewProps} />)
    .add('Enable contacts', () => <EnableContacts onClose={Sb.action('onClose')} />)
    .add('Add by email', () => <AddEmail teamID={fakeTeamID} errorMessage="" />)
}

export default load
