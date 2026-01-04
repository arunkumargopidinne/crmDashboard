export interface ITag {
  _id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tags: ITag[];
  notes?: string;
  createdBy: string;
  lastInteraction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tags?: string[]; // Tag IDs
  notes?: string;
}

export interface IContactsResponse {
  data: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface IDashboardStats {
  stats: {
    totalContacts: number;
    newThisWeek: number;
    tagStats: Array<{
      _id: string;
      tagName: string;
      tagColor: string;
      count: number;
    }>;
  };
  byCompany: Array<{
    company: string;
    count: number;
  }>;
  timeline: Array<{
    date: string;
    contacts: number;
  }>;
}
