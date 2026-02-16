import { NextResponse } from "next/server";
import { deleteSavedSessionInDb, getSavedSessionByIdFromDb } from "@/lib/server/savedSessionsRepo";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await getSavedSessionByIdFromDb(id);
    if (!session) {
      return NextResponse.json({ error: "Saved session not found." }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load saved session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteSavedSessionInDb(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete saved session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
