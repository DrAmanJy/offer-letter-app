import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/infrastructure/database/mongoose";
import { UserService } from "@/services/UserService";
import { CompanyService } from "@/services/CompanyService";
import { OfferService } from "@/services/OfferService";
import DashboardClient from "./DashboardClient";
import { verifyAccessToken } from "@/lib/jwt";
import { logger } from "@/infrastructure/logger";

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await connectDB();
  
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) redirect("/login");

  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch (err) {
    logger.warn('Failed to verify access token on dashboard load');
    redirect("/login");
  }

  try {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const q = typeof params.q === 'string' ? params.q : undefined;
    const status = typeof params.status === 'string' ? params.status : undefined;

    const [userDoc, companiesRes, offersRes, usersRes] = await Promise.all([
      UserService.getById(payload.sub),
      CompanyService.list({ page: 1, limit: 100 }), // Fetch all active companies for dropdowns
      OfferService.list({ page, limit: 10, q, status, sortBy: 'createdAt', sortOrder: 'desc' }),
      UserService.list({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }) // Admin can see users
    ]);

    const userObj = userDoc.toObject();
    delete userObj.password;

    const user = JSON.parse(JSON.stringify(userObj));
    const companiesData = JSON.parse(JSON.stringify(companiesRes.companies));
    const offersData = JSON.parse(JSON.stringify(offersRes));
    const usersData = JSON.parse(JSON.stringify(usersRes.items));

    return <DashboardClient 
      initialUser={user} 
      initialCompanies={companiesData} 
      initialOffers={offersData} 
      initialUsers={usersData}
    />;
  } catch (err) {
    logger.error({ err }, 'Failed to load dashboard data');
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-red-500">Failed to load dashboard data. Please try again.</p>
      </div>
    );
  }
}
