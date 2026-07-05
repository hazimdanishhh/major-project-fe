import { useMemo, useState } from "react";
import { PlusCircleIcon, UsersIcon } from "@phosphor-icons/react";
import Button from "../../../components/buttons/button/Button";
import StatusBox from "../../../components/status/statusBox/StatusBox";
import DataSidebar from "../../../components/dataSidebar/DataSidebar";
import PageHeader from "../../../components/crud/pageHeader/PageHeader";
import SectionHeader from "../../../components/sectionHeader/SectionHeader";
import { useTeamMembers, useCreateTeamMember } from "../../../hooks/useTeam";
import { getTeamMemberColumns } from "./config/teamFormConfig";
import TemporaryPasswordPanel from "./components/TemporaryPasswordPanel";
import "./TeamPage.scss";
import CardLayout from "../../../components/cardLayout/CardLayout";
import NoResult from "../../../components/crud/noResult/NoResult";
import LoadingIcon from "../../../components/loadingIcon/LoadingIcon";

const ROLE_LABELS = { pm: "Project Manager", member: "Member" };

function TeamPage() {
  const { teamMembers, isLoading, error } = useTeamMembers();
  const { createTeamMember, creating } = useCreateTeamMember();
  const [search, setSearch] = useState("");

  // { mode: "create" } | { mode: "reveal", user, temporary_password }
  const [teamSidebar, setTeamSidebar] = useState(null);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teamMembers;
    return teamMembers.filter((member) =>
      member.full_name?.toLowerCase().includes(query),
    );
  }, [teamMembers, search]);

  async function handleSaveTeamMember(formData) {
    const result = await createTeamMember({
      email: formData.email,
      full_name: formData.full_name,
      role: formData.role,
    });
    setTeamSidebar({
      mode: "reveal",
      user: result.user,
      temporary_password: result.temporary_password,
    });
  }

  return (
    <div className="pageLayout">
      <PageHeader>
        <SectionHeader title="Team" icon={UsersIcon} />
        <Button
          style="button buttonType5 approval textXXS"
          onClick={() => setTeamSidebar({ mode: "create" })}
          name="Add Team Member"
          icon2={PlusCircleIcon}
          weight="fill"
        />
      </PageHeader>

      <div className="searchInputWrapper">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── 5. Main Data Display ────────────────────────────────────────── */}
      <CardLayout style="cardWrapperScroll generalCard">
        {isLoading ? (
          <CardLayout style="cardLayoutFlexFull">
            <LoadingIcon />
          </CardLayout>
        ) : error ? (
          <NoResult title="Error loading members" />
        ) : filteredMembers.length === 0 ? (
          <NoResult title="No members found." />
        ) : (
          <CardLayout style="cardLayout1 cardPaddingSmall cardGapSmall">
            {filteredMembers.map((member) => (
              <div key={member.id} className="generalCard teamMemberCard">
                <p className="textXS textBold">{member.full_name}</p>
                <StatusBox
                  status={ROLE_LABELS[member.role] || member.role}
                  type={member.role === "pm" ? "green" : "blue"}
                />
              </div>
            ))}
          </CardLayout>
        )}
      </CardLayout>

      {teamSidebar?.mode === "create" && (
        <DataSidebar
          title="Add Team Member"
          icon={PlusCircleIcon}
          open
          onClose={() => setTeamSidebar(null)}
          rowData={{}}
          columns={getTeamMemberColumns()}
          onSave={handleSaveTeamMember}
          onCancel={() => setTeamSidebar(null)}
          creating
          saving={creating}
        />
      )}

      {teamSidebar?.mode === "reveal" && (
        <DataSidebar
          title="Team Member Created"
          icon={PlusCircleIcon}
          open
          isEditing={false}
          onClose={() => setTeamSidebar(null)}
        >
          <TemporaryPasswordPanel
            user={teamSidebar.user}
            temporaryPassword={teamSidebar.temporary_password}
            onDone={() => setTeamSidebar(null)}
          />
        </DataSidebar>
      )}
    </div>
  );
}

export default TeamPage;
