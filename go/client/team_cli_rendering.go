package client

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"text/tabwriter"

	"github.com/keybase/client/go/libkb"
	"github.com/keybase/client/go/protocol/keybase1"
)

type teamMembersRenderer struct {
	libkb.Contextified
	json, showInviteID bool
	tabw               *tabwriter.Writer
}

func newTeamMembersRenderer(g *libkb.GlobalContext, json, showInviteID bool) *teamMembersRenderer {
	return &teamMembersRenderer{
		Contextified: libkb.NewContextified(g),
		json:         json,
	}
}

func (c *teamMembersRenderer) output(details keybase1.TeamDetails, team string, verbose bool) error {
	if c.json {
		return c.outputJSON(details)
	}

	return c.outputTerminal(details, team, verbose)
}

func (c *teamMembersRenderer) outputJSON(details keybase1.TeamDetails) error {
	b, err := json.MarshalIndent(details, "", "    ")
	if err != nil {
		return err
	}
	dui := c.G().UI.GetDumbOutputUI()
	_, err = dui.Printf(string(b) + "\n")
	return err
}

func (c *teamMembersRenderer) outputTerminal(details keybase1.TeamDetails, team string, verbose bool) error {
	dui := c.G().UI.GetTerminalUI()
	c.tabw = new(tabwriter.Writer)
	c.tabw.Init(dui.OutputWriter(), 0, 8, 2, ' ', 0)

	c.outputRole(team, "owner", details.Members.Owners)
	c.outputRole(team, "admin", details.Members.Admins)
	c.outputRole(team, "writer", details.Members.Writers)
	c.outputRole(team, "reader", details.Members.Readers)
	c.outputRole(team, "bot", details.Members.Bots)
	c.outputRole(team, "restricted_bot", details.Members.RestrictedBots)
	c.outputInvites(details.AnnotatedActiveInvites)
	c.tabw.Flush()

	if verbose {
		dui.Printf("At team key generation: %d\n", details.KeyGeneration)
	}

	return nil
}

func (c *teamMembersRenderer) outputRole(team, role string, members []keybase1.TeamMemberDetails) {
	for _, member := range members {
		var status string
		switch member.Status {
		case keybase1.TeamMemberStatus_RESET:
			status = " (inactive due to account reset)"
		case keybase1.TeamMemberStatus_DELETED:
			status = " (inactive due to account delete)"
		}
		fmt.Fprintf(c.tabw, "%s\t%s\t%s\t%s%s\n", team, role, member.Username, member.FullName, status)
	}
}

func (c *teamMembersRenderer) formatInviteName(invite keybase1.AnnotatedTeamInvite) (res string) {
	res = string(invite.Name)
	category, err := invite.Type.C()
	if err == nil {
		switch category {
		case keybase1.TeamInviteCategory_SBS:
			res = fmt.Sprintf("%s@%s", invite.Name, string(invite.Type.Sbs()))
		case keybase1.TeamInviteCategory_SEITAN:
			if res == "" {
				res = "<token without label>"
			}
		}
	}
	return res
}

func (c *teamMembersRenderer) outputInvites(invites map[keybase1.TeamInviteID]keybase1.AnnotatedTeamInvite) {
	for _, invite := range invites {
		category, err := invite.Type.C()
		if err != nil {
			category = keybase1.TeamInviteCategory_UNKNOWN
		}
		trailer := fmt.Sprintf("(* invited by %s, awaiting acceptance)", invite.InviterUsername)
		switch category {
		case keybase1.TeamInviteCategory_EMAIL:
			trailer = fmt.Sprintf("(* invited via email by %s, awaiting acceptance)", invite.InviterUsername)
		case keybase1.TeamInviteCategory_SEITAN:
			inviteIDTrailer := ""
			if c.showInviteID {
				// Show invite IDs for SEITAN tokens, which can be used to cancel the invite.
				inviteIDTrailer = fmt.Sprintf(" (Invite ID: %s)", invite.Id)
			}
			trailer = fmt.Sprintf("(* invited via secret token by %s, awaiting acceptance)%s",
				invite.InviterUsername, inviteIDTrailer)
		}
		fmtstring := "%s\t%s*\t%s\t%s\n"
		fmt.Fprintf(c.tabw, fmtstring, invite.TeamName, strings.ToLower(invite.Role.String()),
			c.formatInviteName(invite), trailer)
	}
}

func (c *teamMembersRenderer) outputTeams(list keybase1.AnnotatedTeamList, showAll bool) error {

	sort.Slice(list.Teams, func(i, j int) bool {
		if list.Teams[i].FqName == list.Teams[j].FqName {
			return list.Teams[i].Username < list.Teams[j].Username
		}
		return list.Teams[i].FqName < list.Teams[j].FqName
	})

	if c.json {
		b, err := json.Marshal(list)
		if err != nil {
			return err
		}
		tui := c.G().UI.GetTerminalUI()
		err = tui.OutputDesc(OutputDescriptorTeamList, string(b)+"\n")
		return err
	}

	dui := c.G().UI.GetTerminalUI()
	c.tabw = new(tabwriter.Writer)
	c.tabw.Init(dui.OutputWriter(), 0, 8, 4, ' ', 0)

	// Only print the username and full name columns when we're showing other users.
	if showAll {
		fmt.Fprintf(c.tabw, "Team\tRole\tUsername\tFull name\n")
	} else {
		fmt.Fprintf(c.tabw, "Team\tRole\tMembers\n")
	}
	for _, t := range list.Teams {
		var role string
		if t.Implicit != nil {
			role += "implied admin"
		}
		if t.Role != keybase1.TeamRole_NONE {
			if t.Implicit != nil {
				role += ", "
			}
			role += strings.ToLower(t.Role.String())
		}
		if showAll {
			var status string
			switch t.Status {
			case keybase1.TeamMemberStatus_RESET:
				status = " (inactive due to account reset)"
			case keybase1.TeamMemberStatus_DELETED:
				status = " (inactive due to account delete)"
			}
			if len(t.FullName) > 0 && len(status) > 0 {
				status = " " + status
			}
			fmt.Fprintf(c.tabw, "%s\t%s\t%s\t%s%s\n", t.FqName, role, t.Username, t.FullName, status)
		} else {
			fmt.Fprintf(c.tabw, "%s\t%s\t%d\n", t.FqName, role, t.MemberCount)
		}
	}
	if showAll {
		c.outputInvites(list.AnnotatedActiveInvites)
	}

	c.tabw.Flush()
	return nil
}
