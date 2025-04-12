
import { useState } from 'react';
import { WordPressCredentials, WordPressPage } from '@/types/wordpress';

export const useWordPress = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState<WordPressCredentials | null>(null);
  const [pages, setPages] = useState<WordPressPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authenticate with WordPress site
  const authenticate = async (creds: WordPressCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      // Normalize the site URL (ensure it ends with a slash)
      const normalizedUrl = creds.siteUrl.endsWith('/')
        ? creds.siteUrl
        : `${creds.siteUrl}/`;
      
      const updatedCreds = {
        ...creds,
        siteUrl: normalizedUrl
      };
      
      // Test authentication by fetching users/me endpoint
      const authString = btoa(`${updatedCreds.username}:${updatedCreds.appPassword}`);
      
      const response = await fetch(`${updatedCreds.siteUrl}wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Basic ${authString}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }
      
      const userData = await response.json();
      console.log('Authentication successful:', userData);
      
      // Store credentials and set authenticated state
      setCredentials(updatedCreds);
      setIsAuthenticated(true);
      
      // Fetch pages after successful authentication
      await fetchPages(updatedCreds);
      
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Failed to authenticate with WordPress site');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pages from WordPress site
  const fetchPages = async (creds: WordPressCredentials = credentials!) => {
    if (!creds) {
      setError('No credentials available');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const authString = btoa(`${creds.username}:${creds.appPassword}`);
      
      const response = await fetch(`${creds.siteUrl}wp-json/wp/v2/pages?per_page=100`, {
        headers: {
          'Authorization': `Basic ${authString}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.status} ${response.statusText}`);
      }
      
      const pagesData = await response.json();
      setPages(pagesData);
      
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pages from WordPress site');
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single page by ID
  const fetchPage = async (pageId: number): Promise<WordPressPage | null> => {
    if (!credentials) {
      setError('No credentials available');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const authString = btoa(`${credentials.username}:${credentials.appPassword}`);
      
      const response = await fetch(`${credentials.siteUrl}wp-json/wp/v2/pages/${pageId}`, {
        headers: {
          'Authorization': `Basic ${authString}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (err) {
      console.error('Error fetching page:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch page from WordPress site');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new page on the WordPress site
  const createPage = async (pageData: Partial<WordPressPage>): Promise<WordPressPage | null> => {
    if (!credentials || !isAuthenticated) {
      setError('Not authenticated');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const authString = btoa(`${credentials.username}:${credentials.appPassword}`);
      
      // Format the page data for the WordPress API
      const formattedPageData = {
        ...pageData,
        title: pageData.title?.rendered || '',
        content: pageData.content?.rendered || ''
      };
      
      const response = await fetch(`${credentials.siteUrl}wp-json/wp/v2/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedPageData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to create page: ${response.status} ${response.statusText}. ${
            errorData.message || JSON.stringify(errorData)
          }`
        );
      }
      
      const newPage = await response.json();
      
      // Refresh the pages list
      await fetchPages();
      
      return newPage;
      
    } catch (err) {
      console.error('Error creating page:', err);
      setError(err instanceof Error ? err.message : 'Failed to create page on WordPress site');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Log out / clear credentials
  const logout = () => {
    setCredentials(null);
    setIsAuthenticated(false);
    setPages([]);
  };

  return {
    isAuthenticated,
    credentials,
    pages,
    loading,
    error,
    authenticate,
    fetchPages,
    fetchPage,
    createPage,
    logout
  };
};
