import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  APPLICANT_COMPANY_COOKIE,
  APPLICANT_FRAPPE_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth-constants";
import { parseCompanyId } from "@/lib/companies";
import {
  isApplicantPortal,
  isDepartmentManagerPortal,
  isHrPortal,
  isRecruiterPortal,
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
    url.pathname = `/recruiter${pathname.slice(3)}`;
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/hiring-manager" || pathname.startsWith("/hiring-manager/")) {
    const url = request.nextUrl.clone();
    url.pathname = `/hr-portal${pathname.slice("/hiring-manager".length)}`;
    return NextResponse.redirect(url, 308);
  }

  const cookieVal = request.cookies.get(SESSION_COOKIE)?.value;
  const hasApplicantFrappeSession = Boolean(
    request.cookies.get(APPLICANT_FRAPPE_COOKIE)?.value?.trim(),
  );
  const hasApplicantSession =
    hasApplicantFrappeSession || applicantSessionIsValid(cookieVal);
  const hasRecruiterSession = recruiterSessionIsValid(cookieVal);
  const hasDepartmentManagerSession = departmentManagerSessionIsValid(cookieVal);
  const hasHrPortalSession = hrPortalSessionIsValid(cookieVal);
  const hasCookie = Boolean(cookieVal);

  const isRecruiterLoginPath = pathname === "/recruiter/login";
  const isDepartmentManagerLoginPath = pathname === "/department-manager/login";
  const isHrPortalLoginPath = pathname === "/hr-portal/login";
  const isApplicantLoginPath = pathname === "/applicant/login";
  const isApplicantRegisterPath = pathname === "/applicant/register";
  const isApplicantPublicPath = isApplicantLoginPath || isApplicantRegisterPath;

  if (pathname.startsWith("/recruiter") && !isRecruiterLoginPath) {
    if (!hasRecruiterSession) {
      const login = new URL("/recruiter/login", request.url);
      login.searchParams.set("from", pathname);
      const companyQ = request.nextUrl.searchParams.get("company");
      const company =
        typeof companyQ === "string" && parseCompanyId(companyQ.trim()) ?
          companyQ.trim()
        : "aemg";
      login.searchParams.set("company", company);
      const res = NextResponse.redirect(login);
      if (hasCookie && !hasApplicantSession) res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/department-manager") && !isDepartmentManagerLoginPath) {
    if (!hasDepartmentManagerSession) {
      const login = new URL("/department-manager/login", request.url);
      login.searchParams.set("from", pathname);
      const companyQ = request.nextUrl.searchParams.get("company");
      const company =
        typeof companyQ === "string" && parseCompanyId(companyQ.trim()) ?
          companyQ.trim()
        : "aemg";
      login.searchParams.set("company", company);
      const res = NextResponse.redirect(login);
      if (hasCookie && !hasApplicantSession) res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/hr-portal") && !isHrPortalLoginPath) {
    if (!hasHrPortalSession) {
      const login = new URL("/hr-portal/login", request.url);
      login.searchParams.set("from", pathname);
      const companyQ = request.nextUrl.searchParams.get("company");
      const company =
        typeof companyQ === "string" && parseCompanyId(companyQ.trim()) ?
          companyQ.trim()
        : "aemg";
      login.searchParams.set("company", company);
      const res = NextResponse.redirect(login);
      if (hasCookie && !hasApplicantSession) res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/applicant") && !isApplicantPublicPath) {
    if (hasRecruiterSession && !hasApplicantSession) {
      return NextResponse.redirect(new URL("/recruiter/dashboard", request.url));
    }
    if (hasDepartmentManagerSession && !hasApplicantSession) {
      return NextResponse.redirect(new URL("/department-manager/dashboard", request.url));
    }
    if (hasHrPortalSession && !hasApplicantSession) {
      return NextResponse.redirect(new URL("/hr-portal/dashboard", request.url));
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
    if (hasRecruiterSession && !hasApplicantSession) {
      return NextResponse.redirect(new URL("/recruiter/dashboard", request.url));
    }
    if (hasDepartmentManagerSession && !hasApplicantSession) {
      return NextResponse.redirect(new URL("/department-manager/dashboard", request.url));
    }
    if (hasHrPortalSession && !hasApplicantSession) {
      return NextResponse.redirect(new URL("/hr-portal/dashboard", request.url));
    }
    if (hasApplicantSession) {
      return NextResponse.redirect(new URL("/applicant/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isRecruiterLoginPath && hasRecruiterSession) {
    return NextResponse.redirect(new URL("/recruiter/dashboard", request.url));
  }

  if (isDepartmentManagerLoginPath && hasDepartmentManagerSession) {
    return NextResponse.redirect(new URL("/department-manager/dashboard", request.url));
  }

  if (isHrPortalLoginPath && hasHrPortalSession) {
    return NextResponse.redirect(new URL("/hr-portal/dashboard", request.url));
  }

  if (isApplicantLoginPath) {
    const applicantSignInIntent =
      request.nextUrl.searchParams.get("intent") === "applicant";
    if (applicantSignInIntent) {
      return NextResponse.next();
    }
    if (hasRecruiterSession) {
      return NextResponse.redirect(new URL("/recruiter/dashboard", request.url));
    }
    if (hasDepartmentManagerSession) {
      return NextResponse.redirect(new URL("/department-manager/dashboard", request.url));
    }
    if (hasHrPortalSession) {
      return NextResponse.redirect(new URL("/hr-portal/dashboard", request.url));
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
      return NextResponse.redirect(new URL("/recruiter/dashboard", request.url));
    }
    if (hasDepartmentManagerSession) {
      return NextResponse.redirect(new URL("/department-manager/dashboard", request.url));
    }
    if (hasHrPortalSession) {
      return NextResponse.redirect(new URL("/hr-portal/dashboard", request.url));
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
