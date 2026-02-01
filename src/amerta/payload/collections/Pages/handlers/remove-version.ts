import { PayloadRequest } from "payload";

export const removeVersion = async (req: PayloadRequest) => {
  const versionId: string = req.routeParams?.versionId as string;

  if (!versionId) {
    return Response.json({ message: "Missing version ID" }, { status: 400 });
  }

  try {
    await req.payload.findVersions({
      where: {
        id: {
          equals: versionId,
        },
      },
      collection: "pages",
    });

    const db = req.payload.db;

    await db.deleteVersions({
      collection: "pages" as any,
      req,
      where: {
        id: {
          equals: versionId,
        },
      },
    });

    return Response.json({ message: "Version deleted successfully" }, { status: 200 });
  } catch (error: any) {
    req.payload.logger.error({ msg: "Error deleting page version", error });
    return Response.json({ message: "Internal server error: " + error.message }, { status: 500 });
  }
};
