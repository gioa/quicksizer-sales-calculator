import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export function AnotherCalculator() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Wrench className="w-12 h-12 text-green-600 mr-3" />
              <CardTitle className="text-3xl">Another Calculator</CardTitle>
            </div>
            <CardDescription className="text-lg">
              This is a placeholder for another calculator tool
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <p className="text-xl text-gray-600">🚧 Under Construction 🚧</p>
              <p className="text-gray-500">
                This calculator will be available in a future release. Stay tuned for updates!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}