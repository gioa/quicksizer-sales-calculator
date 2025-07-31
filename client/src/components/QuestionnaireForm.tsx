
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Database, Wrench, Shield, Zap } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateQuestionnaireInput, QuestionnaireResponse, industryEnum, dataSizeEnum, deploymentEnum, functionalityEnum } from '../../../server/src/schema';

interface QuestionnaireFormProps {
  sessionId: string;
  onSubmitSuccess: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
  initialData?: QuestionnaireResponse;
}

const FUNCTIONALITY_OPTIONS = [
  { value: 'etl' as const, label: 'ETL (Extract, Transform, Load)', icon: '🔄' },
  { value: 'data_warehousing' as const, label: 'Data Warehousing', icon: '🏢' },
  { value: 'ml' as const, label: 'Machine Learning', icon: '🤖' },
  { value: 'analytics' as const, label: 'Analytics & BI', icon: '📊' },
  { value: 'real_time' as const, label: 'Real-time Processing', icon: '⚡' }
];

const INDUSTRY_OPTIONS = [
  { value: 'finance' as const, label: 'Financial Services', icon: '💰' },
  { value: 'healthcare' as const, label: 'Healthcare', icon: '🏥' },
  { value: 'retail' as const, label: 'Retail & E-commerce', icon: '🛒' },
  { value: 'manufacturing' as const, label: 'Manufacturing', icon: '🏭' },
  { value: 'technology' as const, label: 'Technology', icon: '💻' },
  { value: 'other' as const, label: 'Other', icon: '🏢' }
];

export function QuestionnaireForm({ sessionId, onSubmitSuccess, isLoading = false, readOnly = false, initialData }: QuestionnaireFormProps) {
  const [formData, setFormData] = useState<CreateQuestionnaireInput>(() => {
    if (readOnly && initialData) {
      return {
        session_id: initialData.session_id,
        company_name: initialData.company_name,
        industry: initialData.industry,
        data_size: initialData.data_size,
        developer_count: initialData.developer_count,
        required_functionalities: initialData.required_functionalities,
        deployment_preference: initialData.deployment_preference,
        monthly_data_volume_gb: initialData.monthly_data_volume_gb,
        concurrent_users: initialData.concurrent_users,
        compliance_requirements: initialData.compliance_requirements,
        high_availability_needed: initialData.high_availability_needed
      };
    }
    return {
      session_id: sessionId,
      company_name: null,
      industry: 'technology',
      data_size: 'medium',
      developer_count: 5,
      required_functionalities: ['analytics'],
      deployment_preference: 'cloud',
      monthly_data_volume_gb: 100,
      concurrent_users: 50,
      compliance_requirements: false,
      high_availability_needed: false
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trpc.createQuestionnaire.mutate(formData);
      onSubmitSuccess();
    } catch (error) {
      console.error('Failed to submit questionnaire:', error);
    }
  };

  const handleFunctionalityChange = (functionality: string, checked: boolean) => {
    setFormData((prev: CreateQuestionnaireInput) => ({
      ...prev,
      required_functionalities: checked
        ? [...prev.required_functionalities, functionality as typeof functionalityEnum._type]
        : prev.required_functionalities.filter(f => f !== functionality)
    }));
  };

  // Helper function to find display labels
  const getIndustryLabel = (value: string) => {
    const option = INDUSTRY_OPTIONS.find(opt => opt.value === value);
    return option ? `${option.icon} ${option.label}` : value;
  };

  const getDataSizeLabel = (value: string) => {
    const labels = {
      'small': '🔹 Small (<10TB)',
      'medium': '🔸 Medium (10-100TB)', 
      'large': '🔶 Large (100TB-1PB)',
      'enterprise': '🔺 Enterprise (>1PB)'
    };
    return labels[value as keyof typeof labels] || value;
  };

  const getDeploymentLabel = (value: string) => {
    const labels = {
      'cloud': '☁️ Cloud',
      'on_premise': '🏢 On-Premise',
      'hybrid': '🌐 Hybrid'
    };
    return labels[value as keyof typeof labels] || value;
  };

  const getFunctionalityLabel = (value: string) => {
    const option = FUNCTIONALITY_OPTIONS.find(opt => opt.value === value);
    return option ? `${option.icon} ${option.label}` : value;
  };

  // Read-only display version
  if (readOnly) {
    return (
      <div className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-600">Company Name</Label>
              <p className="text-gray-900 mt-1">{formData.company_name || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Industry</Label>
              <p className="text-gray-900 mt-1">{getIndustryLabel(formData.industry)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Technical Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-600" />
              Technical Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Data Size Category</Label>
                <p className="text-gray-900 mt-1">{getDataSizeLabel(formData.data_size)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Deployment Preference</Label>
                <p className="text-gray-900 mt-1">{getDeploymentLabel(formData.deployment_preference)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Developer Team Size</Label>
                <p className="text-gray-900 mt-1">{formData.developer_count} developers</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Concurrent Users</Label>
                <p className="text-gray-900 mt-1">{formData.concurrent_users} users</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Monthly Data Volume</Label>
              <p className="text-gray-900 mt-1">{formData.monthly_data_volume_gb} GB</p>
            </div>
          </CardContent>
        </Card>

        {/* Required Functionalities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-600" />
              Required Functionalities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-sm font-medium text-gray-600">Selected Functionalities</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.required_functionalities.map((functionality) => (
                  <Badge key={functionality} variant="secondary" className="text-sm">
                    {getFunctionalityLabel(functionality)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Additional Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              <Label className="text-sm font-medium text-gray-600">Compliance Requirements</Label>
              <Badge variant={formData.compliance_requirements ? "default" : "outline"} className="ml-auto">
                {formData.compliance_requirements ? 'Required' : 'Not Required'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <Label className="text-sm font-medium text-gray-600">High Availability</Label>
              <Badge variant={formData.high_availability_needed ? "default" : "outline"} className="ml-auto">
                {formData.high_availability_needed ? 'Required' : 'Not Required'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interactive form version
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Company Information
          </CardTitle>
          <CardDescription>Basic information about the customer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company_name">Company Name (Optional)</Label>
            <Input
              id="company_name"
              value={formData.company_name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateQuestionnaireInput) => ({
                  ...prev,
                  company_name: e.target.value || null
                }))
              }
              placeholder="Enter company name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="industry">Industry</Label>
            <Select 
              value={formData.industry || 'technology'} 
              onValueChange={(value: typeof industryEnum._type) => 
                setFormData((prev: CreateQuestionnaireInput) => ({ ...prev, industry: value }))
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Technical Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            Technical Requirements
          </CardTitle>
          <CardDescription>Data size, team size, and usage patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_size">Data Size Category</Label>
              <Select 
                value={formData.data_size || 'medium'} 
                onValueChange={(value: typeof dataSizeEnum._type) => 
                  setFormData((prev: CreateQuestionnaireInput) => ({ ...prev, data_size: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">🔹 Small (&lt;10TB)</SelectItem>
                  <SelectItem value="medium">🔸 Medium (10-100TB)</SelectItem>
                  <SelectItem value="large">🔶 Large (100TB-1PB)</SelectItem>
                  <SelectItem value="enterprise">🔺 Enterprise (&gt;1PB)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deployment_preference">Deployment Preference</Label>
              <Select 
                value={formData.deployment_preference || 'cloud'} 
                onValueChange={(value: typeof deploymentEnum._type) => 
                  setFormData((prev: CreateQuestionnaireInput) => ({ ...prev, deployment_preference: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cloud">☁️ Cloud</SelectItem>
                  <SelectItem value="on_premise">🏢 On-Premise</SelectItem>
                  <SelectItem value="hybrid">🌐 Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="developer_count">Developer Team Size</Label>
              <Input
                id="developer_count"
                type="number"
                value={formData.developer_count}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateQuestionnaireInput) => ({
                    ...prev,
                    developer_count: parseInt(e.target.value) || 1
                  }))
                }
                min="1"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="concurrent_users">Concurrent Users</Label>
              <Input
                id="concurrent_users"
                type="number"
                value={formData.concurrent_users}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateQuestionnaireInput) => ({
                    ...prev,
                    concurrent_users: parseInt(e.target.value) || 1
                  }))
                }
                min="1"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="monthly_data_volume_gb">Monthly Data Volume (GB)</Label>
            <Input
              id="monthly_data_volume_gb"
              type="number"
              value={formData.monthly_data_volume_gb}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateQuestionnaireInput) => ({
                  ...prev,
                  monthly_data_volume_gb: parseFloat(e.target.value) || 1
                }))
              }
              min="1"
              step="0.1"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Required Functionalities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-600" />
            Required Functionalities
          </CardTitle>
          <CardDescription>Select all functionalities that the customer needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FUNCTIONALITY_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={option.value}
                  checked={formData.required_functionalities.includes(option.value)}
                  onCheckedChange={(checked: boolean) => 
                    handleFunctionalityChange(option.value, checked)
                  }
                />
                <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
                  <span>{option.icon}</span>
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Additional Requirements
          </CardTitle>
          <CardDescription>Compliance and availability requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Checkbox
              id="compliance_requirements"
              checked={formData.compliance_requirements}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev: CreateQuestionnaireInput) => ({
                  ...prev,
                  compliance_requirements: checked
                }))
              }
            />
            <Label htmlFor="compliance_requirements" className="flex items-center gap-2 cursor-pointer">
              <Shield className="w-4 h-4 text-red-500" />
              Compliance Requirements (SOC 2, HIPAA, GDPR, etc.)
            </Label>
          </div>

          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Checkbox
              id="high_availability_needed"
              checked={formData.high_availability_needed}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev: CreateQuestionnaireInput) => ({
                  ...prev,
                  high_availability_needed: checked
                }))
              }
            />
            <Label htmlFor="high_availability_needed" className="flex items-center gap-2 cursor-pointer">
              <Zap className="w-4 h-4 text-yellow-500" />
              High Availability Required (99.9%+ uptime)
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-6">
        <Button 
          type="submit" 
          size="lg" 
          disabled={isLoading || formData.required_functionalities.length === 0}
          className="px-8 py-3 text-lg"
        >
          {isLoading ? 'Calculating...' : '🚀 Generate Cost Estimate'}
        </Button>
      </div>
    </form>
  );
}
