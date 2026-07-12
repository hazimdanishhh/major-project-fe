import { UserCircleIcon } from "@phosphor-icons/react";
import PageHeader from "../../../components/crud/pageHeader/PageHeader";
import SectionHeader from "../../../components/sectionHeader/SectionHeader";
import StatusBox from "../../../components/status/statusBox/StatusBox";
import { useAuth } from "../../../context/AuthContext";

const ROLE_LABELS = { pm: "Project Manager", client: "Client", member: "Member" };

function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="pageLayout">
      <PageHeader>
        <SectionHeader title="Profile" icon={UserCircleIcon} />
      </PageHeader>

      <div className="generalCard">
        <div className="requirementCard">
          <div className="requirementCardLeft">
            <h4 className="textS textBold">{user?.full_name}</h4>
            <p className="textXS textLight">{user?.email}</p>
          </div>
          <div className="requirementCardRight">
            <StatusBox
              status={ROLE_LABELS[user?.role] || user?.role}
              type={user?.role === "pm" ? "green" : user?.role === "client" ? "blue" : "grey"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
