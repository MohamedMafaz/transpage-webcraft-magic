
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogOut } from 'lucide-react';
import { useWordPress } from '@/hooks/useWordPress';
import { 
  translateHtmlContent 
} from '@/services/translationService';
import { LANGUAGES, TRANSLATION_MODELS, DEFAULT_MODEL } from '@/lib/constants';
import { TranslationStatus as TranslationStatusType } from '@/types/wordpress';
import AuthForm from './AuthForm';
import PageSelector from './PageSelector';
import TranslationStatus from './TranslationStatus';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { 
    isAuthenticated, 
    credentials, 
    pages, 
    loading, 
    error, 
    authenticate, 
    fetchPage, 
    createPage, 
    logout 
  } = useWordPress();
  
  const [translationStatus, setTranslationStatus] = useState<TranslationStatusType>({
    status: 'idle',
    message: ''
  });
  
  const { toast } = useToast();

  const handleTranslation = async (pageId: number, targetLanguage: string, modelId: string) => {
    try {
      // Update status to fetching
      setTranslationStatus({
        status: 'fetching',
        message: 'Fetching page content...'
      });
      
      // 1. Fetch the page content
      const page = await fetchPage(pageId);
      if (!page) {
        throw new Error('Failed to fetch page content');
      }
      
      // Get language name for display
      const languageName = LANGUAGES.find(lang => lang.code === targetLanguage)?.name || targetLanguage;
      
      // 2. Translate the entire HTML content
      setTranslationStatus({
        status: 'translating',
        message: `Analyzing and translating content to ${languageName}...`,
        progress: 20
      });
      
      console.log('Original HTML length:', page.content.rendered.length);
      
      const translatedHtml = await translateHtmlContent(
        page.content.rendered, 
        languageName,
        modelId,
        (progress, stage) => {
          setTranslationStatus({
            status: 'translating',
            message: stage,
            progress: progress
          });
        }
      );
      
      console.log('Translated HTML length:', translatedHtml.length);
      
      // 3. Create new page with exact same structure as original
      setTranslationStatus({
        status: 'creating',
        message: 'Creating translated page...',
        progress: 90
      });
      
      // Create a new page data object that maintains ALL Elementor specific fields and meta
      const newPageData = {
        // Base properties
        title: `${page.title.rendered} - ${languageName}`,
        content: translatedHtml,
        status: 'draft',
        template: page.template,
        parent: page.parent,
        menu_order: page.menu_order,
        comment_status: page.comment_status,
        ping_status: page.ping_status,
        meta: page.meta,
        slug: `${page.slug}-${targetLanguage.toLowerCase()}`,
        
        // Copy ALL Elementor-specific fields - these are critical for preserving structure
        _elementor_edit_mode: page._elementor_edit_mode,
        _elementor_template_type: page._elementor_template_type,
        _elementor_version: page._elementor_version,
        _elementor_data: page._elementor_data,
        _elementor_page_settings: page._elementor_page_settings
      };
      
      // Now add any other custom fields that might exist on the page object
      // This ensures we don't miss any important fields specific to this Elementor setup
      for (const key in page) {
        if (
          key.startsWith('_') && 
          !key.startsWith('_links') && 
          !newPageData.hasOwnProperty(key)
        ) {
          newPageData[key] = page[key];
        }
      }
      
      console.log('Creating new page with complete Elementor structure');
      
      const newPage = await createPage(newPageData);
      
      if (!newPage) {
        throw new Error('Failed to create translated page');
      }
      
      // 4. Success
      setTranslationStatus({
        status: 'completed',
        message: `Translation completed! New page "${newPage.title.rendered}" created as a draft with all Elementor structure preserved.`,
        progress: 100
      });
      
      toast({
        title: "Translation Completed",
        description: `The page "${page.title.rendered}" has been translated to ${languageName} with full Elementor structure.`,
      });
      
    } catch (err) {
      console.error('Translation process error:', err);
      setTranslationStatus({
        status: 'error',
        message: 'Translation failed',
        error: err instanceof Error ? err.message : 'An unknown error occurred'
      });
      
      toast({
        title: "Translation Failed",
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Reset status when logging out
    if (!isAuthenticated) {
      setTranslationStatus({
        status: 'idle',
        message: ''
      });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <AuthForm onAuthenticate={authenticate} error={error} loading={loading} />;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-wp-darkBlue">WordPress Translation</h1>
          {credentials && (
            <p className="text-sm text-gray-500">
              Connected to: {credentials.siteUrl}
            </p>
          )}
        </div>
        
        <Button 
          variant="outline" 
          onClick={logout} 
          className="text-gray-700"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </header>
      
      <Separator className="mb-8" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PageSelector 
          pages={pages} 
          onSelectPageForTranslation={handleTranslation}
          loading={loading || translationStatus.status !== 'idle' && translationStatus.status !== 'completed' && translationStatus.status !== 'error'}
        />
        
        <div className="space-y-6">
          <TranslationStatus status={translationStatus} />
          
          {translationStatus.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="font-medium text-green-800 mb-2">What's Next?</h3>
              <p className="text-sm text-green-700 mb-4">
                Your translated page has been created as a draft in WordPress. You can now:
              </p>
              <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                <li>Review the translation in your WordPress admin</li>
                <li>Make any necessary adjustments</li>
                <li>Publish the page when ready</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
