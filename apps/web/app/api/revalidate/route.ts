import { revalidateTag, revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || process.env.GATEWAY_API_KEY || "fa002b126085801f23d9375d94409752503639919e39690c42877fc58c624973";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-revalidate-secret") || req.headers.get("x-api-key");
    if (authHeader !== REVALIDATE_SECRET) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid revalidation secret." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const path = searchParams.get("path");

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, tag, now: Date.now() });
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path, now: Date.now() });
    }

    // Default: revalidate catalog and covers tags
    revalidateTag("catalog");
    revalidateTag("covers");
    revalidatePath("/");
    revalidatePath("/shop");

    return NextResponse.json({
      revalidated: true,
      tags: ["catalog", "covers"],
      paths: ["/", "/shop"],
      now: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "REVALIDATE_ERROR", message: err?.message || "Failed to revalidate cache." },
      { status: 500 }
    );
  }
}
