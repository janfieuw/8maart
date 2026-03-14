import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoCompanyId } from "@/lib/demo-company";

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

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a, b) {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function buildTrialWarning(company) {
  if (!company?.trialEndsAt) return null;
  if (company.subscriptionStatus !== "TRIAL") return null;

  const today = new Date();
  const trialEndsAt = new Date(company.trialEndsAt);
  const daysLeft = daysBetween(today, trialEndsAt);

  if (daysLeft === 5) {
    return {
      level: "warning",
      message:
        "Je trial loopt binnen 5 dagen af. Wijzig jouw status naar ACTIVE en confirm om jouw abonnement verder te zetten.",
    };
  }

  if (daysLeft === 1) {
    return {
      level: "error",
      message:
        "Laatste waarschuwing: jouw trial verloopt morgen. Wijzig jouw status naar ACTIVE en confirm.",
    };
  }

  if (daysLeft < 0) {
    return {
      level: "error",
      message:
        "Jouw trial is verlopen. Wijzig jouw status naar ACTIVE en confirm om verder te gaan.",
    };
  }

  return null;
}

const companySelect = {
  id: true,
  name: true,
  vatNumber: true,
  phone: true,

  billingStreet: true,
  billingHouseNumber: true,
  billingPostalCode: true,
  billingCity: true,
  billingCountry: true,

  contactEmail: true,

  subscriptionNumber: true,
  subscriptionStatus: true,
  trialStartsAt: true,
  trialEndsAt: true,
  activatedAt: true,
  nextRenewalAt: true,
  deactivatedAt: true,

  createdAt: true,
  updatedAt: true,
};

export async function GET() {
  try {
    const companyId = await getDemoCompanyId();

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: companySelect,
    });

    if (!company) {
      return jsonError("Bedrijf niet gevonden", 404);
    }

    return jsonOk({
      company,
      warning: buildTrialWarning(company),
    });
  } catch (error) {
    console.error("GET /api/account error:", error);
    return jsonError("Failed to load account", 500);
  }
}

export async function PATCH(req) {
  try {
    const companyId = await getDemoCompanyId();
    const body = await req.json();

    const section = String(body?.section || "").trim();

    if (!section) {
      return jsonError("Section is verplicht", 400);
    }

    const existing = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        subscriptionStatus: true,
        activatedAt: true,
      },
    });

    if (!existing) {
      return jsonError("Bedrijf niet gevonden", 404);
    }

    if (section === "company") {
      const name = String(body?.name || "").trim();
      const billingStreet = String(body?.billingStreet || "").trim() || null;
      const billingHouseNumber =
        String(body?.billingHouseNumber || "").trim() || null;
      const billingPostalCode =
        String(body?.billingPostalCode || "").trim() || null;
      const billingCity = String(body?.billingCity || "").trim() || null;
      const billingCountry = String(body?.billingCountry || "").trim() || null;
      const contactEmail = String(body?.contactEmail || "").trim() || null;
      const phone = String(body?.phone || "").trim() || null;

      if (!name) {
        return jsonError("Bedrijfsnaam is verplicht", 400);
      }

      const company = await prisma.company.update({
        where: { id: companyId },
        data: {
          name,
          billingStreet,
          billingHouseNumber,
          billingPostalCode,
          billingCity,
          billingCountry,
          contactEmail,
          phone,
        },
        select: companySelect,
      });

      return jsonOk({
        company,
        warning: buildTrialWarning(company),
      });
    }

    if (section === "subscription") {
      const nextStatus = String(body?.subscriptionStatus || "")
        .trim()
        .toUpperCase();

      if (!["ACTIVE", "INACTIVE"].includes(nextStatus)) {
        return jsonError("Ongeldige abonnementsstatus", 400);
      }

      const now = new Date();
      let data = {};

      if (nextStatus === "ACTIVE") {
        const firstActive = existing.activatedAt
          ? new Date(existing.activatedAt)
          : now;

        data = {
          subscriptionStatus: "ACTIVE",
          activatedAt: existing.activatedAt ?? now,
          nextRenewalAt: addDays(firstActive, 365),
          deactivatedAt: null,
        };
      }

      if (nextStatus === "INACTIVE") {
        data = {
          subscriptionStatus: "INACTIVE",
          deactivatedAt: now,
        };
      }

      const company = await prisma.company.update({
        where: { id: companyId },
        data,
        select: companySelect,
      });

      return jsonOk({
        company,
        warning: buildTrialWarning(company),
      });
    }

    return jsonError("Onbekende section", 400);
  } catch (error) {
    console.error("PATCH /api/account error:", error);
    return jsonError("Failed to save account", 500);
  }
}