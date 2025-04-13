import React, { useEffect, useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Loader2, RefreshCw, AlertCircle, Info, ExternalLink, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { DEFAULT_MODEL } from '../lib/constants';

// Interface for model information
interface ModelInfo {
  name: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
  temperature?: number;
  topP?: number;
  topK?: number;
  version?: string;
  modelFamily?: string;
}

export const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({});
  const [pageSize, setPageSize] = useState<number>(100); // Default large page size to get more models
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [showRawResponse, setShowRawResponse] = useState<boolean>(false);

  // Get API key from environment or use a placeholder for development
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';

  const toggleModelExpanded = (modelName: string) => {
    setExpandedModels(prev => ({
      ...prev,
      [modelName]: !prev[modelName]
    }));
  };

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    setRawResponse(null);

    try {
      // Use the fetch API directly to access the models endpoint with pagination
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}&pageSize=${pageSize}`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setRawResponse(data); // Store the raw response for debugging
      
      if (data && data.models) {
        // Process the model data to extract more information
        const modelList = data.models.map((model: any) => {
          // Extract version and family information from the model name
          const nameParts = model.name.split('/');
          const modelId = nameParts[nameParts.length - 1];
          
          // Parse model ID to extract family and version
          const modelParts = modelId.split('-');
          const modelFamily = modelParts[0] || '';
          
          return {
            name: model.name,
            displayName: model.displayName,
            description: model.description,
            inputTokenLimit: model.inputTokenLimit,
            outputTokenLimit: model.outputTokenLimit,
            supportedGenerationMethods: model.supportedGenerationMethods,
            temperature: model.temperature,
            topP: model.topP,
            topK: model.topK,
            version: modelId,
            modelFamily: modelFamily
          };
        });
        
        // Sort models by family and name for better organization
        modelList.sort((a: ModelInfo, b: ModelInfo) => {
          const familyA = a.modelFamily || '';
          const familyB = b.modelFamily || '';
          
          if (familyA !== familyB) {
            return familyA.localeCompare(familyB);
          }
          return a.name.localeCompare(b.name);
        });
        
        setModels(modelList);
        console.log(`Fetched ${modelList.length} models from Google AI API`);
      } else {
        throw new Error('Unexpected API response format');
      }
    } catch (err) {
      console.error('Error fetching models:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [apiKey, pageSize]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Google AI Models</h1>
            {models.length > 0 && (
              <p className="text-muted-foreground mt-1">
                Found {models.length} available models
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <select 
              className="bg-background border rounded px-3 py-2 text-sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value="20">20 models</option>
              <option value="50">50 models</option>
              <option value="100">100 models</option>
              <option value="200">200 models</option>
            </select>
            <Button
              onClick={fetchModels}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Error fetching models</h3>
              <p className="text-sm">{error}</p>
              {!apiKey && (
                <p className="text-sm mt-2">
                  No API key found. Make sure you have set the VITE_GOOGLE_API_KEY environment variable.
                </p>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading available models...</p>
          </div>
        ) : models.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model) => (
                <div
                  key={model.name}
                  className={`border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow ${model.version === DEFAULT_MODEL ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                >
                  <div 
                    className="p-4 border-b bg-muted/20 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleModelExpanded(model.name)}
                  >
                    <div className="flex items-center">
                      {model.version === DEFAULT_MODEL && (
                        <div className="mr-2 p-1 rounded-full bg-blue-100 dark:bg-blue-900">
                          <Check className="h-3 w-3 text-blue-500" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-semibold">
                          {model.displayName || model.name.split('/').pop()}
                        </h2>
                        <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                          {model.name}
                        </p>
                      </div>
                    </div>
                    {expandedModels[model.name] ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className={`overflow-hidden transition-all duration-300 ${expandedModels[model.name] ? 'max-h-[1000px]' : 'max-h-72'}`}>
                    <div className="p-4">
                      {model.description && (
                        <p className="text-sm text-muted-foreground mb-4">{model.description}</p>
                      )}

                      <div className="space-y-2">
                        {model.inputTokenLimit && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Input Token Limit:</span>
                            <span className="font-medium">{model.inputTokenLimit.toLocaleString()}</span>
                          </div>
                        )}
                        {model.outputTokenLimit && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Output Token Limit:</span>
                            <span className="font-medium">{model.outputTokenLimit.toLocaleString()}</span>
                          </div>
                        )}
                        
                        {model.supportedGenerationMethods && model.supportedGenerationMethods.length > 0 && (
                          <div className="text-sm mt-3">
                            <p className="text-muted-foreground mb-1">Supported Methods:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {model.supportedGenerationMethods.map((method) => (
                                <span
                                  key={method}
                                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                                >
                                  {method}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-3 mt-3 border-t border-border/50">
                          <a 
                            href={`https://ai.google.dev/gemini-api/docs/models/${model.version}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs flex items-center text-blue-500 hover:text-blue-700"
                          >
                            View documentation
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Raw API Response Toggle */}
            <div className="mt-8 border rounded-lg overflow-hidden">
              <div 
                className="p-4 border-b bg-muted/20 cursor-pointer flex items-center justify-between"
                onClick={() => setShowRawResponse(!showRawResponse)}
              >
                <h3 className="font-medium">Raw API Response</h3>
                {showRawResponse ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
              
              {showRawResponse && rawResponse && (
                <div className="p-4 bg-muted/10 overflow-auto max-h-96">
                  <pre className="text-xs">{JSON.stringify(rawResponse, null, 2)}</pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-lg border">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No models found</p>
            <p className="text-muted-foreground text-center max-w-md mt-2">
              We couldn't find any AI models available for your API key.
            </p>
            <div className="mt-4 text-sm text-center max-w-md">
              <p>Make sure your API key has access to the Gemini models.</p>
              <a 
                href="https://ai.google.dev/gemini-api/docs/models"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center justify-center mt-2"
              >
                Check documentation
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ModelsPage; 