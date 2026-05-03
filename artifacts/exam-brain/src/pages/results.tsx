import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '@/hooks/use-app-state';
import { Student3D } from '@/components/Student3D';
import { ThoughtBubbles } from '@/components/ThoughtBubbles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Flame, Target, AlertTriangle, Moon, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TopicScore } from '@workspace/api-client-react';

export default function Results() {
  const [, setLocation] = useLocation();
  const { analysisData } = useAppState();
  const [lastNightMode, setLastNightMode] = useState(false);

  if (!analysisData) {
    // If user refreshes on this page, go back home
    setLocation('/');
    return null;
  }

  const displayTopics = lastNightMode 
    ? analysisData.topics.filter(t => analysisData.lastNightTopics.includes(t.topic))
    : analysisData.topics;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Target className="w-4 h-4 text-blue-400" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'skip': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'medium': return 'bg-blue-400/20 text-blue-400 border-blue-400/50';
      case 'low': return 'bg-green-400/20 text-green-400 border-green-400/50';
      case 'skip': return 'bg-red-400/20 text-red-400 border-red-400/50';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col md:flex-row bg-background overflow-hidden transition-colors duration-700 ${lastNightMode ? 'bg-[#05050a]' : ''}`}>
      
      {/* Left Pane - 3D & Thoughts */}
      <div className={`relative flex-1 hidden md:flex items-center justify-center transition-opacity duration-700 ${lastNightMode ? 'opacity-30' : 'opacity-100'}`}>
        <header className="absolute top-0 left-0 p-6 z-20">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </header>

        <div className="absolute inset-0 z-0">
          <Student3D isThinking={false} />
        </div>

        <ThoughtBubbles 
          bubbles={analysisData.thoughtBubbles.slice(0, 4)} 
          positions={[
            { x: '10%', y: '15%' },
            { x: '65%', y: '10%' },
            { x: '75%', y: '45%' },
            { x: '15%', y: '60%' },
          ]}
        />
      </div>

      {/* Right Pane - Results Panel */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full md:w-[600px] flex-shrink-0 bg-card border-l border-border flex flex-col h-screen z-20 relative"
      >
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Your Strategy</h2>
            <p className="text-sm text-muted-foreground">{analysisData.paperCount} papers analyzed</p>
          </div>
          <Button 
            variant={lastNightMode ? "default" : "outline"}
            className={`gap-2 ${lastNightMode ? 'bg-purple-600 hover:bg-purple-700 glow-purple text-white' : ''}`}
            onClick={() => setLastNightMode(!lastNightMode)}
          >
            <Moon className="w-4 h-4" />
            Last Night Mode
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8 pb-10">
            
            {/* Overall Status */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20 glow-blue">
              <div className="text-4xl font-bold text-primary">{analysisData.overallExamReadiness}%</div>
              <div>
                <p className="font-semibold text-lg">Exam Readiness</p>
                <p className="text-sm text-muted-foreground">Follow this plan to hit 100%</p>
              </div>
            </div>

            {/* Topics List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Topic Priorities
              </h3>
              
              <AnimatePresence>
                <div className="space-y-3">
                  {displayTopics.map((topic, i) => (
                    <motion.div
                      key={topic.topic}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-4 rounded-lg border bg-background/50 transition-all
                        ${lastNightMode ? 'border-purple-500/50 glow-purple' : 'border-border'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">{topic.topic}</h4>
                          <p className="text-xs text-muted-foreground">{topic.label}</p>
                        </div>
                        <Badge variant="outline" className={getPriorityColor(topic.priority)}>
                          {topic.priority === 'skip' ? 'Don\'t waste time' : `${topic.examChancePercent}% chance`}
                        </Badge>
                      </div>
                      
                      <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${topic.priority === 'skip' ? 'bg-red-500/50' : 'bg-primary glow-blue'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${topic.importancePercent}%` }}
                          transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </div>

            {/* Chart (Hidden in last night mode) */}
            {!lastNightMode && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary" />
                  Topic Frequencies
                </h3>
                <Card className="bg-background/50 border-border">
                  <CardContent className="p-6 h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysisData.topics.slice(0, 6)}>
                        <XAxis dataKey="topic" tick={{fontSize: 10}} interval={0} width={100} hide />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2a2a4a' }}
                          cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        />
                        <Bar dataKey="frequency" radius={[4, 4, 0, 0]}>
                          {analysisData.topics.slice(0, 6).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(217, 91%, ${60 - index * 5}%)`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Study Plan */}
            {!lastNightMode && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{analysisData.planDays} Days Left</h3>
                <div className="grid gap-3">
                  {analysisData.studyPlan.map((day) => (
                    <Card key={day.day} className="bg-background/50 border-border overflow-hidden relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50"></div>
                      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Day {day.day}</CardTitle>
                        <span className="text-xs text-muted-foreground">{day.timeHours} hrs</span>
                      </CardHeader>
                      <CardContent className="py-2 px-4 pb-4">
                        <p className="text-sm font-medium mb-2">{day.goal}</p>
                        <div className="flex flex-wrap gap-2">
                          {day.focus.map((f, i) => (
                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                              {f}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          </div>
        </ScrollArea>
      </motion.div>
    </div>
  );
}
