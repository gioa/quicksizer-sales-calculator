import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, BarChart3, Menu, X, Wrench } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { QuestionnaireForm } from '@/components/QuestionnaireForm';
import { CostEstimationDisplay } from '@/components/CostEstimationDisplay';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AnotherCalculator } from '@/components/AnotherCalculator';
// Using type-only imports
import type { CostCalculationResult, QuestionnaireResponse } from '../../server/src/schema';

type ActiveCalculator = 'quicksizer' | 'another' | 'admin';

function App() {
  const [sessionId, setSessionId] = useState<string>('');
  const [activeCalculator, setActiveCalculator] = useState<ActiveCalculator>('quicksizer');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
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
  };

  const handleCalculatorSwitch = (calculator: ActiveCalculator) => {
    setActiveCalculator(calculator);
    // Reset state when switching calculators
    if (calculator === 'quicksizer') {
      handleNewCalculation();
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderQuicksizer = () => (
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
          {costResult && (
            <div className="mt-4">
              <Button onClick={handleNewCalculation} variant="outline" size="lg">
                New Calculation
              </Button>
            </div>
          )}
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Left Column */}
          <div className="space-y-4">
            {costResult ? (
              <>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">📋 Assessment Inputs</h3>
                <QuestionnaireForm 
                  sessionId={costResult.questionnaire.session_id}
                  onSubmitSuccess={() => {}}
                  isLoading={false}
                  readOnly={true}
                  initialData={costResult.questionnaire}
                />
              </>
            ) : (
              <Card className="max-w-4xl">
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
            )}
          </div>
          
          {/* Right Column */}
          <div className="space-y-4">
            {costResult ? (
              <>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">💰 Cost Estimation Breakdown</h3>
                <CostEstimationDisplay costResult={costResult} />
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Your Estimated Costs</h3>
                  <p className="text-gray-500">Your estimated costs will appear here after you fill out the questionnaire and click 'Generate Cost Estimate'.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-64' : 'w-16'
      } flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h2 className="text-lg font-semibold text-gray-800">Calculators</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="p-1 hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {/* Quicksizer Calculator */}
            <button
              onClick={() => handleCalculatorSwitch('quicksizer')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeCalculator === 'quicksizer'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calculator className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="font-medium">Quicksizer Calculator</span>
              )}
            </button>

            {/* Another Calculator */}
            <button
              onClick={() => handleCalculatorSwitch('another')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeCalculator === 'another'
                  ? 'bg-green-100 text-green-700 border-2 border-green-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Wrench className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="font-medium">Another Calculator</span>
              )}
            </button>

            {/* Admin Dashboard */}
            <button
              onClick={() => handleCalculatorSwitch('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeCalculator === 'admin'
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="font-medium">Admin Dashboard</span>
              )}
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Sales & Engineering Tools
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {activeCalculator === 'quicksizer' && renderQuicksizer()}
          {activeCalculator === 'another' && <AnotherCalculator />}
          {activeCalculator === 'admin' && (
            <div className="min-h-screen bg-gray-50">
              <div className="container mx-auto px-4 py-8">
                <AdminDashboard 
                  questionnaires={questionnaires}
                  onRefresh={loadAllQuestionnaires}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;