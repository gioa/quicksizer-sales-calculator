
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, CheckCircle, AlertCircle, Lightbulb, Shield, Zap } from 'lucide-react';
import type { CostCalculationResult } from '../../../server/src/schema';

interface CostEstimationDisplayProps {
  costResult: CostCalculationResult;
}

export function CostEstimationDisplay({ costResult }: CostEstimationDisplayProps) {
  const { questionnaire, estimation } = costResult;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateSavings = () => {
    return estimation.total_monthly_cost * 12 - estimation.total_annual_cost;
  };

  return (
    <div className="space-y-6">
      {/* Customer Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Customer Overview
            {questionnaire.company_name && (
              <Badge variant="secondary">{questionnaire.company_name}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Industry:</span>
              <p className="font-medium capitalize">{questionnaire.industry.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-gray-500">Data Size:</span>
              <p className="font-medium capitalize">{questionnaire.data_size}</p>
            </div>
            <div>
              <span className="text-gray-500">Team Size:</span>
              <p className="font-medium">{questionnaire.developer_count} developers</p>
            </div>
            <div>
              <span className="text-gray-500">Deployment:</span>
              <p className="font-medium capitalize">{questionnaire.deployment_preference.replace('_', ' ')}</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <span className="text-gray-500 text-sm">Required Functionalities:</span>
            <div className="flex flex-wrap gap-2">
              {questionnaire.required_functionalities.map((func: string) => (
                <Badge key={func} variant="outline">
                  {func === 'etl' && '🔄 ETL'}
                  {func === 'data_warehousing' && '🏢 Data Warehousing'}
                  {func === 'ml' && '🤖 Machine Learning'}
                  {func === 'analytics' && '📊 Analytics'}
                  {func === 'real_time' && '⚡ Real-time'}
                </Badge>
              ))}
            </div>
          </div>

          {(questionnaire.compliance_requirements || questionnaire.high_availability_needed) && (
            <>
              <Separator className="my-4" />
              <div className="flex gap-4">
                {questionnaire.compliance_requirements && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Compliance Required
                  </Badge>
                )}
                {questionnaire.high_availability_needed && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    High Availability
                  </Badge>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-600">
              {formatCurrency(estimation.total_monthly_cost)}
            </CardTitle>
            <CardDescription>Monthly Cost</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-green-600">
              {formatCurrency(estimation.total_annual_cost)}
            </CardTitle>
            <CardDescription>Annual Cost (10% discount)</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-purple-600">
              {formatCurrency(calculateSavings())}
            </CardTitle>
            <CardDescription>Annual Savings</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Detailed Cost Breakdown
          </CardTitle>
          <CardDescription>Monthly cost components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(estimation.cost_breakdown).map(([category, cost]) => {
            const percentage = (cost / estimation.total_monthly_cost) * 100;
            return (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{category}</span>
                  <span className="text-lg font-bold">{formatCurrency(cost)}</span>
                </div>
                <Progress value={percentage} className="h-2" />
                <p className="text-sm text-gray-500">{percentage.toFixed(1)}% of total cost</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Recommendations
          </CardTitle>
          <CardDescription>Ways to optimize costs and improve value</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {estimation.recommendations.map((recommendation: string, index: number) => (
              <Alert key={index}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{recommendation}</AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Next Steps:</strong> Share this estimate with the customer and schedule a technical deep-dive call to discuss implementation details and finalize the proposal.
        </AlertDescription>
      </Alert>
    </div>
  );
}
