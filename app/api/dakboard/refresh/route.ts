import { NextResponse } from "next/server";
import { refreshDakboardDisplays } from "@/lib/dakboard";

export async function POST() {
  try {
    const results = await refreshDakboardDisplays();

    return NextResponse.json({
      ok: true,
      message: "DAKboard refresh requested for all displays",
      results,
    });
  } catch (error) {
    console.error("DAKboard refresh failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DAKboard refresh failed",
      },
      { status: 500 }
    );
  }
}