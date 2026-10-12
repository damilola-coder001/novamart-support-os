// GET, POST, PUT, DELETE /api/admin/knowledge
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireStaff } from "@/lib/auth/guard";
import { logActivity } from "@/lib/activity/logger";

export async function GET(req: NextRequest) {
  try {
    // Agents need read access for the workspace knowledge lookup.
    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (search && search.trim() !== "") {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, articles });
  } catch (error) {
    console.error("Knowledge fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireAdmin(req);
    if ("response" in gate) return gate.response;

    const body = await req.json();
    const { title, slug, category, excerpt, content, tags, isPublished } = body;

    const formattedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const article = await prisma.knowledgeArticle.create({
      data: {
        title,
        slug: formattedSlug,
        category: category || "GENERAL",
        excerpt: excerpt || title,
        content: content || "",
        tags: tags || "",
        isPublished: isPublished !== undefined ? isPublished : true,
      },
    });

    await logActivity({
      actorType: "ADMIN",
      actorName: "Admin Eleanor Vance",
      action: "TICKET_UPDATED",
      entityType: "KnowledgeArticle",
      entityId: article.id,
      details: { title: article.title, category: article.category },
    });

    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error("Knowledge create error:", error);
    return NextResponse.json({ success: false, error: "Failed to create article" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const gate = await requireAdmin(req);
    if ("response" in gate) return gate.response;

    const body = await req.json();
    const { id, title, category, excerpt, content, tags, isPublished } = body;

    const article = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(category && { category }),
        ...(excerpt && { excerpt }),
        ...(content && { content }),
        ...(tags !== undefined && { tags }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error("Knowledge update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const gate = await requireAdmin(req);
    if ("response" in gate) return gate.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
    }

    await prisma.knowledgeArticle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Knowledge delete error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete article" }, { status: 500 });
  }
}
