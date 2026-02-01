import { BasePayload } from "payload";
import React from "react";

const DashboardLink: React.FC<{ payload: BasePayload; viewType: string }> = ({ payload, viewType }) => {
  return (
    <div className="nav-group">
      <a className={"mb-4 nav__link" + (viewType == "dashboard" ? " active" : "")} id="nav-dashboard" href={payload.config.serverURL + "/admin"}>
        {viewType == "dashboard" ? <div className="nav__link-indicator"></div> : null}
        <span className="nav__link-label">Dashboard</span>
      </a>
    </div>
  );
};

export default DashboardLink;
