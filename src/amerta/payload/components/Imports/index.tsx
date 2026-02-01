import { getNavPrefs } from "./getNavPrefs";
import { ImportsNav } from "./Nav";

const Imports = async ({ req }) => {
  const navPreferences = await getNavPrefs(req);
  return <ImportsNav label="Imports" navPreferences={navPreferences} />;
};

export default Imports;
