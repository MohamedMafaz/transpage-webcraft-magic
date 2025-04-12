
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TranslationStatus as TranslationStatusType } from '@/types/wordpress';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

interface TranslationStatusProps {
  status: TranslationStatusType;
}

const TranslationStatus = ({ status }: TranslationStatusProps) => {
  if (status.status === 'idle') {
    return null;
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return <Check className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Loader2 className="h-6 w-6 text-wp-blue animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed':
        return 'bg-green-100 border-green-200';
      case 'error':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  const getProgressValue = () => {
    if (status.progress !== undefined) {
      return status.progress;
    }
    
    switch (status.status) {
      case 'fetching':
        return 20;
      case 'extracting':
        return 40;
      case 'translating':
        return 60;
      case 'creating':
        return 80;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <Card className={`w-full shadow-md ${getStatusColor()}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          {getStatusIcon()}
          <span className="ml-2">Translation {status.status === 'error' ? 'Error' : 'Status'}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm">{status.message}</p>
          
          {status.status !== 'completed' && status.status !== 'error' && (
            <Progress value={getProgressValue()} className="h-2" />
          )}
          
          {status.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {status.error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TranslationStatus;
