
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, FileText, BarChart3 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { QuestionnaireForm } from '@/components/QuestionnaireForm';
import { CostEstimationDisplay } from '@/components/CostEstimationDisplay';
import { AdminDashboard } from '@/components/AdminDashboard';
// Using type-only imports
import type { CostCalculationResult, QuestionnaireResponse } from '../../server/src/schema';

function App() {
  const [sessionId, setSessionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('questionnaire');
  const [costResult, setCostResult] = useState<CostCalculationResult | null>(null);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate session ID on mount
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
  }, []);

  const loadAllQuestionnaires = useCallback(async () => {
    try {
      const result = await trpc.getAllQuestionnaires.query();
      setQuestionnaires(result);
    } catch (error) {
      console.error('Failed to load questionnaires:', error);
    }
  }, []);

  useEffect(() => {
    loadAllQuestionnaires();
  }, [loadAllQuestionnaires]);

  const handleQuestionnaireSubmit = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const result = await trpc.getCostCalculationResult.query({ session_id: sessionId });
      if (result) {
        setCostResult(result);
        setActiveTab('results');
        // Reload questionnaires for admin view
        await loadAllQuestionnaires();
      }
    } catch (error) {
      console.error('Failed to get cost calculation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewCalculation = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    setCostResult(null);
    setActiveTab('questionnaire');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Quicksizer Calculator</h1>
          </div>
          <p className="text-xl text-gray-600">
            Internal tool for Sales & Field Engineering teams to provide instant customer cost estimates
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="questionnaire" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              New Assessment
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2" disabled={!costResult}>
              <Calculator className="w-4 h-4" />
              Cost Estimation
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Admin Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questionnaire">
            <Card className="max-w-4xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Customer Requirements Assessment</CardTitle>
                <CardDescription>
                  Complete this questionnaire to generate an instant cost estimate for your customer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionId && (
                  <QuestionnaireForm 
                    sessionId={sessionId}
                    onSubmitSuccess={handleQuestionnaireSubmit}
                    isLoading={isLoading}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            {costResult ? (
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">💰 Cost Estimation Results</h2>
                  <Button onClick={handleNewCalculation} variant="outline">
                    New Calculation
                  </Button>
                </div>
                <CostEstimationDisplay costResult={costResult} />
              </div>
            ) : (
              <Card className="max-w-2xl mx-auto">
                <CardContent className="text-center py-12">
                  <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Results Yet</h3>
                  <p className="text-gray-500">Complete the questionnaire to see cost estimation results</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="admin">
            <AdminDashboard 
              questionnaires={questionnaires}
              onRefresh={loadAllQuestionnaires}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
