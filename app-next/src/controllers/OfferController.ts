import { NextRequest } from 'next/server';
import { OfferService } from '../services/OfferService';
import { offerCreateSchema, offerUpdateSchema, offerStatusUpdateSchema, offerSearchSchema, offerParamsSchema } from '../validators/offer';
import { sendSuccess } from '../lib/response';
import { authenticate } from '../middleware/auth';

export class OfferController {
  static async create(req: NextRequest) {
    const user = await authenticate(req);
    const body = await req.json().catch(() => ({}));
    const data = offerCreateSchema.parse({ body }).body;
    const offer = await OfferService.create(data as any, user.id);
    return sendSuccess('Offer created successfully', offer, undefined, 201);
  }

  static async list(req: NextRequest) {
    await authenticate(req);
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const query = offerSearchSchema.parse({ query: searchParams }).query;
    const result = await OfferService.list(query);
    return sendSuccess('Offers retrieved successfully', result);
  }

  static async getById(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    await authenticate(req);
    const resolvedParams = await params;
    const { id } = offerParamsSchema.parse({ params: resolvedParams }).params;
    const offer = await OfferService.getById(id);
    return sendSuccess('Offer retrieved successfully', offer);
  }

  static async getPublicOffer(req: NextRequest) {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const { companyId, reference } = searchParams;
    
    if (!companyId || !reference) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and reference are required' }), { status: 400 });
    }
    
    const offer = await OfferService.getPublicOffer(companyId, reference);
    return sendSuccess('Public offer retrieved successfully', offer);
  }

  static async update(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    const user = await authenticate(req);
    const resolvedParams = await params;
    const { id } = offerParamsSchema.parse({ params: resolvedParams }).params;
    const body = await req.json().catch(() => ({}));
    const data = offerUpdateSchema.parse({ body }).body;
    
    const offer = await OfferService.update(id, data as any, user.id);
    return sendSuccess('Offer updated successfully', offer);
  }
  
  static async updateStatus(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    const user = await authenticate(req);
    const resolvedParams = await params;
    const { id } = offerParamsSchema.parse({ params: resolvedParams }).params;
    const body = await req.json().catch(() => ({}));
    const { status } = offerStatusUpdateSchema.parse({ body }).body;
    
    const offer = await OfferService.updateStatus(id, status, user.id);
    return sendSuccess('Offer status updated successfully', offer);
  }

  static async delete(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    const user = await authenticate(req);
    const resolvedParams = await params;
    const { id } = offerParamsSchema.parse({ params: resolvedParams }).params;
    await OfferService.softDelete(id, user.id);
    return sendSuccess('Offer deleted successfully');
  }

  static async restore(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    const user = await authenticate(req);
    const resolvedParams = await params;
    const { id } = offerParamsSchema.parse({ params: resolvedParams }).params;
    await OfferService.restore(id, user.id);
    return sendSuccess('Offer restored successfully');
  }
}
