import { Drawer as PayloadDrawer } from "@payloadcms/ui";
import "./index.scss";
import { DrawerHeader } from "./DrawerHeader";

export function Drawer({ children, title, gutter = true, onClose, slug }) {
  return (
    <PayloadDrawer
      title={title}
      gutter={gutter}
      Header={
        <DrawerHeader
          onClose={() => {
            onClose(slug);
          }}
          title={title}
        />
      }
      slug={slug}
    >
      <div className="custom-drawer--content">{children}</div>
    </PayloadDrawer>
  );
}
