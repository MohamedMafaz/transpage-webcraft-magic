import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogOut } from 'lucide-react';
import { useWordPress } from '@/hooks/useWordPress';
import { 
  extractTextFromHtml, 
  translateText, 
  replaceTextInHtml 
} from '@/services/translationService';
import { LANGUAGES } from '@/lib/constants';
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
      
      // 2. Extract text from HTML
      setTranslationStatus({
        status: 'extracting',
        message: 'Extracting content for translation...'
      });
      
      const textChunks = extractTextFromHtml(page.content.rendered);
      console.log(`Extracted ${textChunks.length} text chunks for translation`);
      
      if (textChunks.length === 0) {
        throw new Error('No translatable content found on the page');
      }
      
      // 3. Translate each chunk
      setTranslationStatus({
        status: 'translating',
        message: `Translating content to ${languageName}...`
      });
      
      const translatedChunks: string[] = [];
      
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        setTranslationStatus({
          status: 'translating',
          message: `Translating content to ${languageName} (${i + 1}/${textChunks.length})...`,
          progress: Math.round(((i + 1) / textChunks.length) * 60) + 20 // 20-80% progress
        });
        
        const translated = await translateText(chunk, languageName, modelId);
        translatedChunks.push(translated);
      }
      
      // 4. Replace text in HTML
      const translatedHtml = replaceTextInHtml(page.content.rendered, textChunks, translatedChunks);
      
      // 5. Create new page
      setTranslationStatus({
        status: 'creating',
        message: 'Creating translated page...',
        progress: 80
      });
      
      const newPageData = {
        title: {
          rendered: `${page.title.rendered} - ${languageName}`
        },
        content: translatedHtml,
        status: 'draft',
        template: page.template,
        parent: page.parent
      };
      
      const newPage = await createPage(newPageData);
      
      if (!newPage) {
        throw new Error('Failed to create translated page');
      }
      
      // 6. Success
      setTranslationStatus({
        status: 'completed',
        message: `Translation completed! New page "${newPage.title.rendered}" created as a draft.`,
        progress: 100
      });
      
      toast({
        title: "Translation Completed",
        description: `The page "${page.title.rendered}" has been translated to ${languageName}.`,
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
