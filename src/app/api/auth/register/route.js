import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildUniqueCompanySlug,
  createAndSetSession,
  hashPassword,
} from "@/lib/auth";
import crypto from "crypto";

function jsonOk(data = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

function jsonError(error, status = 400) {
  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : String(error) },
    { status }
  );
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function generateSubscriptionNumberCandidate() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SUB-${year}-${random}`;
}

async function generateUniqueSubscriptionNumber(tx) {
  for (let i = 0; i < 20; i += 1) {
    const candidate = generateSubscriptionNumberCandidate();

    const existing = await tx.company.findFirst({
      where: {
        subscriptionNumber: candidate,
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Kon geen uniek abonnementsnummer genereren");
}

function generateSecret() {
  return crypto.randomBytes(24).toString("hex");
}

export async function POST(req) {
  try {
    const body = await req.json();

    const companyName = String(body?.companyName || "").trim();
    const contactName = String(body?.contactName || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    const vatNumber = String(body?.vatNumber || "").trim() || null;
    const phone = String(body?.phone || "").trim() || null;

    const billingStreet = String(body?.billingStreet || "").trim() || null;
    const billingHouseNumber =
      String(body?.billingHouseNumber || "").trim() || null;
    const billingPostalCode =
      String(body?.billingPostalCode || "").trim() || null;
    const billingCity = String(body?.billingCity || "").trim() || null;
    const billingCountry = String(body?.billingCountry || "").trim() || null;

    const shippingSameAsBilling = !!body?.shippingSameAsBilling;

    const shippingStreet = shippingSameAsBilling
      ? billingStreet
      : String(body?.shippingStreet || "").trim() || null;

    const shippingHouseNumber = shippingSameAsBilling
      ? billingHouseNumber
      : String(body?.shippingHouseNumber || "").trim() || null;

    const shippingPostalCode = shippingSameAsBilling
      ? billingPostalCode
      : String(body?.shippingPostalCode || "").trim() || null;

    const shippingCity = shippingSameAsBilling
      ? billingCity
      : String(body?.shippingCity || "").trim() || null;

    const shippingCountry = shippingSameAsBilling
      ? billingCountry
      : String(body?.shippingCountry || "").trim() || null;

    if (!companyName) return jsonError("Bedrijfsnaam is verplicht", 400);
    if (!contactName) return jsonError("Contactnaam is verplicht", 400);
    if (!email) return jsonError("E-mailadres is verplicht", 400);

    if (!password || password.length < 6) {
      return jsonError("Wachtwoord moet minstens 6 tekens hebben", 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return jsonError("Er bestaat al een account met dit e-mailadres", 409);
    }

    const requestedSlug = await buildUniqueCompanySlug(prisma, companyName);
    const passwordHash = await hashPassword(password);

    const now = new Date();
    const trialStartsAt = now;
    const trialEndsAt = addDays(now, 15);

    const result = await prisma.$transaction(async (tx) => {
      let slug = requestedSlug;
      let suffix = 2;

      while (true) {
        const existingCompanyWithSlug = await tx.company.findFirst({
          where: { slug },
          select: { id: true },
        });

        if (!existingCompanyWithSlug) break;

        slug = `${requestedSlug}-${suffix}`;
        suffix += 1;
      }

      const subscriptionNumber = await generateUniqueSubscriptionNumber(tx);

      const company = await tx.company.create({
        data: {
          name: companyName,
          slug,
          vatNumber,
          phone,

          billingStreet,
          billingHouseNumber,
          billingPostalCode,
          billingCity,
          billingCountry,

          shippingStreet,
          shippingHouseNumber,
          shippingPostalCode,
          shippingCity,
          shippingCountry,

          contactEmail: email,

          subscriptionNumber,
          subscriptionStatus: "TRIAL",
          trialStartsAt,
          trialEndsAt,
          activatedAt: null,
          nextRenewalAt: null,
          deactivatedAt: null,
        },
      });

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email,
          passwordHash,
          name: contactName,
        },
      });

      await tx.scanTag.createMany({
        data: [
          {
            companyId: company.id,
            direction: "IN",
            secret: generateSecret(),
          },
          {
            companyId: company.id,
            direction: "OUT",
            secret: generateSecret(),
          },
        ],
      });

      return { company, user };
    });

    await createAndSetSession({
      id: result.user.id,
      companyId: result.user.companyId,
      companyName: result.company.name,
      email: result.user.email,
      name: result.user.name || "",
    });

    return jsonOk(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          companyId: result.user.companyId,
          companyName: result.company.name,
        },
        company: {
          id: result.company.id,
          name: result.company.name,
          slug: result.company.slug,
          subscriptionNumber: result.company.subscriptionNumber,
          subscriptionStatus: result.company.subscriptionStatus,
          trialStartsAt: result.company.trialStartsAt,
          trialEndsAt: result.company.trialEndsAt,
        },
      },
      201
    );
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return jsonError("Registratie mislukt", 500);
  }
}