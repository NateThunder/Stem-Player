import { NextResponse } from "next/server";
import { createSavedSessionInDb, listSavedSessionsFromDb } from "@/lib/server/savedSessionsRepo";

export const runtime = "nodejs";

type CreateSessionBody = {
  title?: string;
  artistName?: string;
  stems?: Array<{
    name?: string;
    fileUrl?: string;
    color?: string;
  }>;
};

export async function GET() {
  try {
    const sessions = await listSavedSessionsFromDb();
    return NextResponse.json({ sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load saved sessions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSessionBody;
    const title = body?.title?.trim();
    const artistName = body?.artistName?.trim() || undefined;
    const stems =
      body?.stems
        ?.map((stem) => ({
          name: stem.name?.trim() || "",
          fileUrl: stem.fileUrl?.trim() || "",
          color: stem.color?.trim() || undefined,
        }))
        .filter((stem) => stem.name && stem.fileUrl) || [];

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (stems.length === 0) {
      return NextResponse.json({ error: "At least one stem is required." }, { status: 400 });
    }

    const session = await createSavedSessionInDb({ title, artistName, stems });
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
