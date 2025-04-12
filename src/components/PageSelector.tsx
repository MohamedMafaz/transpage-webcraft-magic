
import { useState } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText } from 'lucide-react';
import { WordPressPage } from '@/types/wordpress';
import { LANGUAGES, TRANSLATION_MODELS, DEFAULT_MODEL } from '@/lib/constants';

interface PageSelectorProps {
  pages: WordPressPage[];
  onSelectPageForTranslation: (pageId: number, targetLanguage: string, modelId: string) => void;
  loading: boolean;
}

const PageSelector = ({ pages, onSelectPageForTranslation, loading }: PageSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);

  const filteredPages = pages.filter(page => 
    page.title.rendered.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTranslate = () => {
    if (selectedPageId && selectedLanguage) {
      onSelectPageForTranslation(selectedPageId, selectedLanguage, selectedModel);
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-wp-darkBlue">Select Page to Translate</CardTitle>
        <CardDescription>
          Choose a page and target language for translation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Pages List */}
          <div className="border rounded-md max-h-64 overflow-y-auto">
            {filteredPages.length > 0 ? (
              <div className="divide-y">
                {filteredPages.map(page => (
                  <div 
                    key={page.id}
                    className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedPageId === page.id ? 'bg-blue-50 border-l-4 border-wp-blue' : ''
                    }`}
                    onClick={() => setSelectedPageId(page.id)}
                  >
                    <FileText className="h-5 w-5 text-wp-blue mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate" 
                         dangerouslySetInnerHTML={{ __html: page.title.rendered }} />
                      <p className="text-xs text-gray-500">ID: {page.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                {pages.length > 0 
                  ? 'No pages match your search' 
                  : 'No pages available'}
              </div>
            )}
          </div>
          
          {/* Language Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Language</label>
              <Select 
                value={selectedLanguage} 
                onValueChange={setSelectedLanguage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(language => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Translation Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Translation Model</label>
              <Select 
                value={selectedModel} 
                onValueChange={setSelectedModel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSLATION_MODELS.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleTranslate}
              disabled={!selectedPageId || !selectedLanguage || loading}
              className="w-full bg-wp-blue hover:bg-wp-darkBlue"
            >
              Translate Page
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PageSelector;
