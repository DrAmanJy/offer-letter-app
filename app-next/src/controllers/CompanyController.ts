import { NextRequest } from 'next/server';
import { CompanyService } from '../services/CompanyService';
import { companyCreateSchema, companyUpdateSchema, companySearchSchema, companyParamsSchema } from '../validators/company';
import { sendSuccess } from '../lib/response';
import { requireAdmin } from '../middleware/auth';

export class CompanyController {
  static async create(req: NextRequest) {
    const adminUser = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const data = companyCreateSchema.parse({ body }).body;
    const company = await CompanyService.create(data, adminUser.id);
    return sendSuccess('Company created successfully', company, undefined, 201);
  }

  static async list(req: NextRequest) {
    await requireAdmin(req);
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const query = companySearchSchema.parse({ query: searchParams }).query;
    const result = await CompanyService.list(query);
    return sendSuccess('Companies retrieved successfully', result);
  }

  static async getById(req: NextRequest, { params }: { params: { id: string } }) {
    await requireAdmin(req);
    const { id } = companyParamsSchema.parse({ params }).params;
    const company = await CompanyService.getById(id);
    return sendSuccess('Company retrieved successfully', company);
  }

  static async update(req: NextRequest, { params }: { params: { id: string } }) {
    const adminUser = await requireAdmin(req);
    const { id } = companyParamsSchema.parse({ params }).params;
    const body = await req.json().catch(() => ({}));
    const data = companyUpdateSchema.parse({ body }).body;
    
    const company = await CompanyService.update(id, data, adminUser.id);
    return sendSuccess('Company updated successfully', company);
  }

  static async delete(req: NextRequest, { params }: { params: { id: string } }) {
    const adminUser = await requireAdmin(req);
    const { id } = companyParamsSchema.parse({ params }).params;
    await CompanyService.delete(id, adminUser.id);
    return sendSuccess('Company deleted successfully');
  }
}
