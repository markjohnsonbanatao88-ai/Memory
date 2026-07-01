import { createProjectArtifact } from "@/lib/operating/projects";
import { createProjectArtifactSchema } from "@/lib/operating/project-schemas";
import { parseJson, withOperatingApi } from "@/lib/operating/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ projectKey: string }> }) {
  return withOperatingApi(async () => {
    const { projectKey } = await context.params;
    return createProjectArtifact(projectKey, await parseJson(request, createProjectArtifactSchema));
  });
}
