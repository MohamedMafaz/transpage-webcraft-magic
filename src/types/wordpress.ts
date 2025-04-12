
// WordPress authentication credentials
export interface WordPressCredentials {
  siteUrl: string;
  username: string;
  appPassword: string;
}

// WordPress page interface
export interface WordPressPage {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  slug: string;
  status: string;
  parent: number;
  link: string;
  template: string;
  modified: string;
}

// Translation request interface
export interface TranslationRequest {
  pageId: number;
  targetLanguage: string;
  modelId: string;
}

// Translation status interface
export interface TranslationStatus {
  status: 'idle' | 'fetching' | 'extracting' | 'translating' | 'creating' | 'completed' | 'error';
  message: string;
  progress?: number;
  error?: string;
}
