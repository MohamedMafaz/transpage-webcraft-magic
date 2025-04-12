
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { WordPressCredentials } from '@/types/wordpress';

interface AuthFormProps {
  onAuthenticate: (credentials: WordPressCredentials) => Promise<void>;
  error: string | null;
  loading: boolean;
}

const AuthForm = ({ onAuthenticate, error, loading }: AuthFormProps) => {
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!siteUrl) {
      errors.siteUrl = 'Site URL is required';
    } else if (!/^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+([\/?].*)?$/i.test(siteUrl)) {
      errors.siteUrl = 'Please enter a valid URL (e.g., https://yoursite.com)';
    }
    
    if (!username) {
      errors.username = 'Username is required';
    }
    
    if (!appPassword) {
      errors.appPassword = 'Application Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    await onAuthenticate({
      siteUrl,
      username,
      appPassword
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="bg-wp-blue text-white rounded-t-lg">
        <CardTitle className="text-2xl font-bold">WordPress Connection</CardTitle>
        <CardDescription className="text-gray-100">
          Connect to your WordPress site to begin translation
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="siteUrl">WordPress Site URL</Label>
            <Input 
              id="siteUrl"
              type="url"
              placeholder="https://yoursite.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              className={formErrors.siteUrl ? 'border-red-500' : ''}
            />
            {formErrors.siteUrl && (
              <p className="text-red-500 text-sm mt-1">{formErrors.siteUrl}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username"
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={formErrors.username ? 'border-red-500' : ''}
            />
            {formErrors.username && (
              <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="appPassword">Application Password</Label>
            <Input 
              id="appPassword"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              className={formErrors.appPassword ? 'border-red-500' : ''}
            />
            {formErrors.appPassword && (
              <p className="text-red-500 text-sm mt-1">{formErrors.appPassword}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Create an application password in WordPress Dashboard &gt; Users &gt; Profile
            </p>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" className="w-full bg-wp-blue hover:bg-wp-darkBlue" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect to WordPress'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AuthForm;
