import fs from "fs";
import path from "path";

export const generateIconsJson = async () => {
  try {
    const outputDir = path.join(process.cwd(), "src/payload/fields/icon");
    const outputPath = path.join(outputDir, "icons.json");
    if (fs.existsSync(outputPath)) {
      try {
        const data = fs.readFileSync(outputPath, "utf8");
        return JSON.parse(data);
      } catch (err) {
        console.error("Error reading existing icons.json:", err);
        // Continue to regenerate if existing file is corrupted
      }
    }

    // Path to lucide-react icons
    const iconsPath = path.join(process.cwd(), "node_modules/lucide-react/dist/esm/icons");

    // Check if directory exists
    if (!fs.existsSync(iconsPath)) {
      console.error("Icons directory not found:", iconsPath);
      return [];
    }

    // Read all files in the icons directory
    const files = fs.readdirSync(iconsPath);

    // Filter for .js files and extract icon information
    const icons = files
      .filter((file) => file.endsWith(".js"))
      .map((file) => {
        const fileName = file.replace(".js", "");

        // Convert kebab-case or snake_case to title case
        const title = fileName
          .split(/[-_]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");

        return {
          name: fileName,
          title: title,
          fileName: file,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title)); // Sort alphabetically by title

    // Create output directory if it doesn't exist

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(icons, null, 2));
    return icons;
  } catch (error) {
    console.error("Error generating icons JSON:", error);
    return [];
  }
};
