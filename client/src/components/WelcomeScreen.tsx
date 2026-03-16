import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Mic, Shield, BarChart3, FileText, X } from 'lucide-react';

export function WelcomeScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 100);
    }
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  const features = [
    {
      icon: Mic,
      title: 'Live Coaching',
      description: 'Real-time guidance and suggestions during customer interactions',
    },
    {
      icon: Shield,
      title: 'Compliance',
      description: 'Ensure all interactions meet regulatory requirements and best practices',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Detailed performance insights and improvement recommendations',
    },
    {
      icon: FileText,
      title: 'Scripts',
      description: 'Access proven scripts and talking points for every situation',
    },
  ];

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
        "transition-opacity duration-300",
        isAnimating ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div 
        className={cn(
          "bg-card border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto",
          "transition-transform duration-300",
          isAnimating ? 'scale-100' : 'scale-95'
        )}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome to F&I Co-Pilot</h1>
            <p className="text-muted-foreground mt-2">
              Your intelligent assistant for better F&I performance
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button onClick={handleGetStarted} size="lg" className="px-8">
              Get Started
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              This screen won't show again unless you clear your browser data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
