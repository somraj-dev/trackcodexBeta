import { apiInstance } from '../infra/api';

export interface EnterpriseResponse {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  plan: string;
  status: string;
  avatar?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

class StrataService {
  /**
   * List all strata (enterprises) the current user belongs to
   */
  async listStrata(): Promise<EnterpriseResponse[]> {
    const response = await apiInstance.get('/enterprises');
    return response.data;
  }

  /**
   * Get strata (enterprise) details by slug
   */
  async getStrata(slug: string): Promise<EnterpriseResponse> {
    const response = await apiInstance.get(`/enterprises/${slug}`);
    return response.data;
  }

  /**
   * Create a new strata (enterprise)
   */
  async createStrata(data: { name: string; slug: string }): Promise<EnterpriseResponse> {
    const response = await apiInstance.post('/enterprises', data);
    return response.data;
  }
}

export const strataService = new StrataService();
