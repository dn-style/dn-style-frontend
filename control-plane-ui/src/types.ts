export interface Agent {
  tenant: string;
  site: string;
  token: string;
  lat?: number;
  lng?: number;
  status?: 'ONLINE' | 'OFFLINE';
  config?: string;
  tags?: string;
}

export interface UserSession {
  email: string;
  tenant: string;
  token: string;
  plan?: {
    max_agents: number;
    max_seats: number;
    name: string;
  };
}

export interface DBTemplate {
  id: number;
  tenant_id: string;
  name: string;
  html: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  max_agents: number;
  paypal_id: string;
  features: string;
}
