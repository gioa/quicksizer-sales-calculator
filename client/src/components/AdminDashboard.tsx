
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Search, Filter, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import type { QuestionnaireResponse } from '../../../server/src/schema';

interface AdminDashboardProps {
  questionnaires: QuestionnaireResponse[];
  onRefresh: () => void;
}

export function AdminDashboard({ questionnaires, onRefresh }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');

  const filteredQuestionnaires = useMemo(() => {
    return questionnaires.filter((questionnaire: QuestionnaireResponse) => {
      const matchesSearch = !searchTerm || 
        (questionnaire.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        questionnaire.industry.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesIndustry = industryFilter === 'all' || questionnaire.industry === industryFilter;
      const matchesSize = sizeFilter === 'all' || questionnaire.data_size === sizeFilter;
      
      return matchesSearch && matchesIndustry && matchesSize;
    });
  }, [questionnaires, searchTerm, industryFilter, sizeFilter]);

  const stats = useMemo(() => {
    const totalAssessments = questionnaires.length;
    const uniqueIndustries = new Set(questionnaires.map((q: QuestionnaireResponse) => q.industry)).size;
    const avgDevelopers = questionnaires.length > 0 
      ? Math.round(questionnaires.reduce((sum: number, q: QuestionnaireResponse) => sum + q.developer_count, 0) / questionnaires.length)
      : 0;
    const avgDataVolume = questionnaires.length > 0
      ? Math.round(questionnaires.reduce((sum: number, q: QuestionnaireResponse) => sum + q.monthly_data_volume_gb, 0) / questionnaires.length)
      : 0;

    return {
      totalAssessments,
      uniqueIndustries,
      avgDevelopers,
      avgDataVolume
    };
  }, [questionnaires]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getIndustryEmoji = (industry: string) => {
    const emojiMap: Record<string, string> = {
      finance: '💰',
      healthcare: '🏥',
      retail: '🛒',
      manufacturing: '🏭',
      technology: '💻',
      other: '🏢'
    };
    return emojiMap[industry] || '🏢';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Admin Dashboard</h2>
          <p className="text-gray-600">Overview of all customer assessments</p>
        </div>
        <Button onClick={onRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalAssessments}</p>
                <p className="text-sm text-gray-600">Total Assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.uniqueIndustries}</p>
                <p className="text-sm text-gray-600">Industries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.avgDevelopers}</p>
                <p className="text-sm text-gray-600">Avg Team Size</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.avgDataVolume}GB</p>
                <p className="text-sm text-gray-600">Avg Data Volume</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search company or industry..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="finance">💰 Finance</SelectItem>
                <SelectItem value="healthcare">🏥 Healthcare</SelectItem>
                <SelectItem value="retail">🛒 Retail</SelectItem>
                <SelectItem value="manufacturing">🏭 Manufacturing</SelectItem>
                <SelectItem value="technology">💻 Technology</SelectItem>
                <SelectItem value="other">🏢 Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by data size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="small">🔹 Small</SelectItem>
                <SelectItem value="medium">🔸 Medium</SelectItem>
                <SelectItem value="large">🔶 Large</SelectItem>
                <SelectItem value="enterprise">🔺 Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assessments</CardTitle>
          <CardDescription>
            Showing {filteredQuestionnaires.length} of {questionnaires.length} assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredQuestionnaires.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No assessments found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Data Size</TableHead>
                    <TableHead>Team Size</TableHead>
                    <TableHead>Functionalities</TableHead>
                    <TableHead>Requirements</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestionnaires.map((questionnaire: QuestionnaireResponse) => (
                    <TableRow key={questionnaire.id}>
                      <TableCell className="font-medium">
                        {questionnaire.company_name || (
                          <span className="text-gray-400 italic">Anonymous</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getIndustryEmoji(questionnaire.industry)}</span>
                          <span className="capitalize">{questionnaire.industry}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {questionnaire.data_size}
                        </Badge>
                      </TableCell>
                      <TableCell>{questionnaire.developer_count} devs</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-48">
                          {questionnaire.required_functionalities.slice(0, 2).map((func: string) => (
                            <Badge key={func} variant="secondary" className="text-xs">
                              {func.replace('_', ' ')}
                            </Badge>
                          ))}
                          {questionnaire.required_functionalities.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{questionnaire.required_functionalities.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {questionnaire.compliance_requirements && (
                            <Badge variant="destructive" className="text-xs">Compliance</Badge>
                          )}
                          {questionnaire.high_availability_needed && (
                            <Badge variant="secondary" className="text-xs">HA</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(questionnaire.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
