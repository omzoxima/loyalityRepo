import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  parentMobile: z.string().regex(/^[6-9]\d{9}$/),
  familyMobile: z.string().regex(/^[6-9]\d{9}$/),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input format" }, { status: 400 });
  const d = parsed.data;

  // Find the family customer
  const familyCustomer = await prisma.customer.findUnique({
    where: { mobile: d.familyMobile },
    include: { parent: true },
  });

  if (!familyCustomer) {
    return NextResponse.json({ error: "Family customer account not found" }, { status: 404 });
  }

  // Ensure they are linked to this parent
  if (familyCustomer.parent?.mobile !== d.parentMobile) {
    return NextResponse.json({ error: "This family member is not linked to your account" }, { status: 400 });
  }

  // Unlink them
  await prisma.customer.update({
    where: { id: familyCustomer.id },
    data: { parentId: null },
  });

  return NextResponse.json({ ok: true });
}
