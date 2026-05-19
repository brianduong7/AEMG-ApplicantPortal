import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  APPLICANT_COMPANY_COOKIE,
  APPLICANT_FRAPPE_COOKIE,
  DEPARTMENT_MANAGER_COMPANY_COOKIE,
  DEPARTMENT_MANAGER_FRAPPE_COOKIE,
  RECRUITER_COMPANY_COOKIE,
  RECRUITER_FRAPPE_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth-constants";
import { parseCompanyId } from "@/lib/companies";
import { legacyStaffUrlRedirect } from "@/lib/staff-legacy-redirect";
import {
  isApplicantPortal,
  isDepartmentManagerPortal,
  isHrPortal,
  isRecruiterPortal,
  isStaffPortal,
  parseSessionCookieJson,
} from "@/lib/session";

function applicantSessionIsValid(raw: string | undefined): boolean {
  const s = parseSessionCookieJson(raw);
  return s !== null && isApplicantPortal(s);
}

function recruiterSessionIsValid(raw: string | undefined): boolean {
  const s = parseSessionCookieJson(raw);
  return s !== null && isRecruiterPortal(s);
}

function departmentManagerSessionIsValid(raw: string | undefined): boolean {
  const s = parseSessionCookieJson(raw);
  return s !== null && isDepartmentManagerPortal(s);
}

function hrPortalSessionIsValid(raw: string | undefined): boolean {
  const s = parseSessionCookieJson(raw);
  return s !== null && isHrPortal(s);
}

function unifiedStaffSessionIsValid(raw: string | undefined): boolean {
  const s = parseSessionCookieJson(raw);
  return s !== null && isStaffPortal(s) && Boolean(s.staffRoles?.length);
}

/** Legacy `/jobs/*` URLs before applicant routes moved under `/applicant`. */
function legacyJobsRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/jobs")) return null;

  const url = request.nextUrl.clone();
  if (pathname === "/jobs" || pathname === "/jobs/") {
    url.pathname = "/applicant/jobs";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/jobs/dashboard") {
    url.pathname = "/applicant/dashboard";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/jobs/applications") {
    url.pathname = "/applicant/applications";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/jobs/profile") {
    url.pathname = "/applicant/profile";
    return NextResponse.redirect(url, 308);
  }
  const applyMatch = /^\/jobs\/([^/]+)\/apply\/?$/.exec(pathname);
  if (applyMatch) {
    url.pathname = `/applicant/jobs/${applyMatch[1]}/apply`;
    return NextResponse.redirect(url, 308);
  }
  if (pathname.startsWith("/jobs/")) {
    url.pathname = "/applicant/jobs";
    return NextResponse.redirect(url, 308);
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacy = legacyJobsRedirect(request);
  if (legacy) return legacy;

  if (pathname === "/hr" || pathname.startsWith("/hr/")) {
    const url = request.nextUrl.clone();
    const tail = pathname.slice("/hr".length);
    url.pathname =
      tail === "" || tail === "/" ? "/staff/dashboard" : `/staff${tail}`;
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/hiring-manager" || pathname.startsWith("/hiring-manager/")) {
    const url = request.nextUrl.clone();
    const tail = pathname.slice("/hiring-manager".length);
    url.pathname =
      tail === "" || tail === "/" ? "/staff/dashboard" : `/staff${tail}`;
    return NextResponse.redirect(url, 308);
  }

  const staffLegacy = legacyStaffUrlRedirect(pathname);
  if (staffLegacy && staffLegacy !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = staffLegacy;
    return NextResponse.redirect(url, 308);
  }

  if (
    pathname === "/recruiter/login" ||
    pathname === "/department-manager/login" ||
    pathname === "/hr-portal/login"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/staff/login";
    return NextResponse.redirect(url, 308);
  }

  const cookieVal = request.cookies.get(SESSION_COOKIE)?.value;
  const hasApplicantFrappeSession = Boolean(
    request.cookies.get(APPLICANT_FRAPPE_COOKIE)?.value?.trim(),
  );
  const hasApplicantSession =
    hasApplicantFrappeSession || applicantSessionIsValid(cookieVal);
  const hasRecruiterFrappeSession = Boolean(
    request.cookies.get(RECRUITER_FRAPPE_COOKIE)?.value?.trim(),
  );
  const hasRecruiterSession =
    recruiterSessionIsValid(cookieVal) || hasRecruiterFrappeSession;
  const hasDepartmentManagerFrappeSession = Boolean(
    request.cookies.get(DEPARTMENT_MANAGER_FRAPPE_COOKIE)?.value?.trim(),
  );
  const hasDepartmentManagerSession =
    departmentManagerSessionIsValid(cookieVal) || hasDepartmentManagerFrappeSession;
  const hasHrPortalSession = hrPortalSessionIsValid(cookieVal);
  const hasUnifiedStaffSession = unifiedStaffSessionIsValid(cookieVal);
  const hasStaffSession =
    hasUnifiedStaffSession ||
    hasRecruiterSession ||
    hasDepartmentManagerSession ||
    hasHrPortalSession;
  const hasCookie = Boolean(cookieVal);

  const isRecruiterRegisterPath = pathname === "/recruiter/register";
  const isStaffLoginPath = pathname === "/staff/login";
  const isApplicantLoginPath = pathname === "/applicant/login";
  const isApplicantRegisterPath = pathname === "/applicant/register";
  const isApplicantPublicPath = isApplicantLoginPath || isApplicantRegisterPath;

  if (pathname.startsWith("/staff") && !isStaffLoginPath) {
    if (!hasStaffSession) {
      const login = new URL("/staff/login", request.url);
      login.searchParams.set("from", pathname);
      const companyQ = request.nextUrl.searchParams.get("company");
      const company =
        typeof companyQ === "string" && parseCompanyId(companyQ.trim()) ?
          companyQ.trim()
        : "aemg";
      login.searchParams.set("company", company);
      const res = NextResponse.redirect(login);
      if (hasCookie && !hasApplicantSession) res.cookies.delete(SESSION_COOKIE);
      res.cookies.delete(RECRUITER_FRAPPE_COOKIE);
      res.cookies.delete(RECRUITER_COMPANY_COOKIE);
      res.cookies.delete(DEPARTMENT_MANAGER_FRAPPE_COOKIE);
      res.cookies.delete(DEPARTMENT_MANAGER_COMPANY_COOKIE);
      return res;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/applicant") && !isApplicantPublicPath) {
    if (hasStaffSession && !hasApplicantSession) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    if (!hasApplicantSession) {
      const login = new URL("/applicant/login", request.url);
      login.searchParams.set("from", pathname);
      login.searchParams.set("intent", "applicant");
      const companyQ = request.nextUrl.searchParams.get("company");
      const company =
        typeof companyQ === "string" && parseCompanyId(companyQ.trim()) ?
          companyQ.trim()
        : "aemg";
      login.searchParams.set("company", company);
      const res = NextResponse.redirect(login);
      if (hasCookie) res.cookies.delete(SESSION_COOKIE);
      res.cookies.delete(APPLICANT_FRAPPE_COOKIE);
      res.cookies.delete(APPLICANT_COMPANY_COOKIE);
      return res;
    }
    return NextResponse.next();
  }

  if (isApplicantRegisterPath) {
    if (hasStaffSession && !hasApplicantSession) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    if (hasApplicantSession) {
      return NextResponse.redirect(new URL("/applicant/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isRecruiterRegisterPath) {
    if (hasDepartmentManagerSession && !hasRecruiterSession) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    if (hasHrPortalSession && !hasRecruiterSession) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    if (hasRecruiterSession) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isStaffLoginPath && request.nextUrl.searchParams.get("staleSession") === "1") {
    const res = NextResponse.next();
    res.cookies.delete(SESSION_COOKIE);
    res.cookies.delete(RECRUITER_FRAPPE_COOKIE);
    res.cookies.delete(RECRUITER_COMPANY_COOKIE);
    res.cookies.delete(DEPARTMENT_MANAGER_FRAPPE_COOKIE);
    res.cookies.delete(DEPARTMENT_MANAGER_COMPANY_COOKIE);
    return res;
  }

  if (isStaffLoginPath && hasUnifiedStaffSession) {
    return NextResponse.redirect(new URL("/staff/dashboard", request.url));
  }

  if (isApplicantLoginPath) {
    if (request.nextUrl.searchParams.get("staleSession") === "1") {
      const res = NextResponse.next();
      res.cookies.delete(APPLICANT_FRAPPE_COOKIE);
      res.cookies.delete(APPLICANT_COMPANY_COOKIE);
      return res;
    }
    const applicantSignInIntent =
      request.nextUrl.searchParams.get("intent") === "applicant";
    if (applicantSignInIntent) {
      return NextResponse.next();
    }
    if (hasRecruiterSession) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    if (hasDepartmentManagerSession) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    if (hasHrPortalSession) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    if (hasApplicantSession) {
      return NextResponse.redirect(new URL("/applicant/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    const applicantSignInIntent =
      request.nextUrl.searchParams.get("intent") === "applicant";
    if (applicantSignInIntent) {
      return NextResponse.next();
    }
    if (hasRecruiterSession) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    if (hasDepartmentManagerSession) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    if (hasHrPortalSession) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    if (hasApplicantSession) {
      return NextResponse.redirect(new URL("/applicant/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/jobs",
    "/jobs/:path*",
    "/login",
    "/applicant",
    "/applicant/:path*",
    "/staff",
    "/staff/:path*",
    "/recruiter",
    "/recruiter/:path*",
    "/department-manager",
    "/department-manager/:path*",
    "/hr-portal",
    "/hr-portal/:path*",
    "/hiring-manager",
    "/hiring-manager/:path*",
    "/hr",
    "/hr/:path*",
  ],
};
