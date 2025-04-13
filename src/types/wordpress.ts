export interface WordPressCredentials {
  siteUrl: string;
  username: string;
  appPassword: string;
}

// Update WordPressPage interface to include all the properties we need for Elementor pages
export interface WordPressPage {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  parent: number;
  menu_order: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: Record<string, any>;
  // Elementor-specific fields
  _elementor_edit_mode?: string;
  _elementor_template_type?: string;
  _elementor_version?: string;
  _elementor_data?: string; // This contains the Elementor structure JSON
  _elementor_page_settings?: string;
  // Other ACF or custom fields might be here
  [key: string]: any;
}

export interface TranslationStatus {
  status: 'idle' | 'fetching' | 'translating' | 'creating' | 'completed' | 'error';
  message: string;
  progress?: number;
  error?: string;
}
