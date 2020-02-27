import * as React from 'react'
import * as Kb from '../../../common-adapters'
import * as Container from '../../../util/container'
import * as Styles from '../../../styles'
import {ModalTitle} from '../../common'
import * as Types from '../../../constants/types/teams'
import {pluralize} from '../../../util/string'
import capitalize from 'lodash/capitalize'
import {InlineDropdown} from '../../../common-adapters/dropdown'
import {FloatingRolePicker} from '../../role-picker'

const NewTeamInfo = () => {
  const dispatch = Container.useDispatch()
  const nav = Container.useSafeNavigation()
  const onBack = () => dispatch(nav.safeNavigateUpPayload())

  const teamType = Container.useSelector(state => state.teams.newTeamWizard.teamType)

  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const teamNameTaken = false // TODO: get this live
  const [openTeam, setOpenTeam] = React.useState(teamType === 'community')
  const [showcase, setShowcase] = React.useState(teamType !== 'other')
  const [selectedRole, setSelectedRole] = React.useState<Types.TeamRoleType>('writer')
  const [rolePickerIsOpen, setRolePickerIsOpen] = React.useState(false)

  return (
    <Kb.Modal
      onClose={onBack}
      header={{
        leftButton: <Kb.Icon type="iconfont-arrow-left" onClick={onBack} />,
        title: <ModalTitle teamname="New team" title="Enter team info" />,
      }}
      allowOverflow={true}
    >
      <Kb.Box2 direction="vertical" fullWidth={true} style={styles.body} gap={'tiny'}>
        <Kb.LabeledInput
          placeholder="Team name"
          value={name}
          onChangeText={setName}
          maxLength={16}
          autoFocus={true}
        />
        {teamNameTaken ? (
          // TODO: make this the same size as the two line message below
          <Kb.Text type="BodySmallError">This team name is already taken</Kb.Text>
        ) : (
          <Kb.Text type="BodySmall">
            Choose wisely. Team names are unique and can't be changed in the future.
          </Kb.Text>
        )}
        <Kb.LabeledInput
          placeholder="What is your team about?"
          label="Description"
          value={description}
          rowsMin={3}
          rowsMax={3}
          multiline={true}
          onChangeText={setDescription}
          maxLength={280}
        />

        <Kb.Checkbox
          labelComponent={
            <Kb.Box2 direction="vertical" alignItems="flex-start">
              <Kb.Text type="Body">Make it an open team</Kb.Text>
              <Kb.Text type="BodySmall">Anyone can join without admin approval.</Kb.Text>
              {openTeam && (
                <Kb.Box2 direction="horizontal" gap="xtiny" alignSelf="flex-start">
                  <Kb.Text type="BodySmall">People will join as</Kb.Text>
                  <FloatingRolePicker
                    confirmLabel={`Let in as ${capitalize(pluralize(selectedRole))}`}
                    selectedRole={selectedRole}
                    onSelectRole={setSelectedRole}
                    floatingContainerStyle={styles.floatingRolePicker}
                    onConfirm={() => setRolePickerIsOpen(false)}
                    position="bottom center"
                    open={rolePickerIsOpen}
                  >
                    <InlineDropdown
                      label={pluralize(selectedRole)}
                      onPress={() => setRolePickerIsOpen(!rolePickerIsOpen)}
                      type="BodySmall"
                    />
                  </FloatingRolePicker>
                </Kb.Box2>
              )}
            </Kb.Box2>
          }
          checked={openTeam}
          onCheck={setOpenTeam}
        />
        <Kb.Checkbox
          onCheck={setShowcase}
          checked={showcase}
          label="Feature team on your profile"
          labelSubtitle="Your profile will mention this team. Team description and number of members will be public."
        />
      </Kb.Box2>
    </Kb.Modal>
  )
}

const styles = Styles.styleSheetCreate(() => ({
  body: Styles.platformStyles({
    common: {
      ...Styles.padding(Styles.globalMargins.small),
      backgroundColor: Styles.globalColors.blueGrey,
      borderRadius: 4,
    },
    isElectron: {minHeight: 326},
    isMobile: {...Styles.globalStyles.flexOne},
  }),
  container: {
    padding: Styles.globalMargins.small,
  },
  floatingRolePicker: Styles.platformStyles({
    isElectron: {
      position: 'relative',
      top: -20,
    },
  }),
  wordBreak: Styles.platformStyles({
    isElectron: {
      wordBreak: 'break-all',
    },
  }),
}))

export default NewTeamInfo
