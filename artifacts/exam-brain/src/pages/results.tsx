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
import { ArrowLeft, Flame, Target, AlertTriangle, Moon, CheckCircle, ChevronDown, ChevronUp, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGenerateQuestions, useGeneratePaper } from '@workspace/api-client-react';
import type { TopicScore, PaperQuestion } from '@workspace/api-client-react';

export default function Results() {
  const [, setLocation] = useLocation();
  const { analysisData } = useAppState();
  const [lastNightMode, setLastNightMode] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [topicQuestions, setTopicQuestions] = useState<Record<string, string[]>>({});
  const [loadingTopics, setLoadingTopics] = useState<Set<string>>(new Set());
  const [showPaper, setShowPaper] = useState(false);
  const [paperData, setPaperData] = useState<{ title: string; questions: PaperQuestion[]; generatedAt: string } | null>(null);

  const generateQuestionsMutation = useGenerateQuestions();
  const generatePaperMutation = useGeneratePaper();

  if (!analysisData) {
    setLocation('/');
    return null;
  }

  const displayTopics = lastNightMode
    ? analysisData.topics.filter(t => analysisData.lastNightTopics.includes(t.topic)).slice(0, 5)
    : analysisData.topics;

  const canExpand = (priority: string) => priority === 'high' || priority === 'medium';

  const toggleTopic = async (topic: TopicScore) => {
    const key = topic.topic;
    const next = new Set(expandedTopics);
    if (next.has(key)) {
      next.delete(key);
      setExpandedTopics(next);
      return;
    }
    next.add(key);
    setExpandedTopics(next);

    if (!topicQuestions[key] && canExpand(topic.priority)) {
      setLoadingTopics(prev => new Set(prev).add(key));
      generateQuestionsMutation.mutate(
        { data: { topic: key, topicCode: topic.topicCode || '', count: 3 } },
        {
          onSuccess: (data) => {
            setTopicQuestions(prev => ({ ...prev, [key]: data.questions }));
            setLoadingTopics(prev => { const s = new Set(prev); s.delete(key); return s; });
          },
          onError: () => {
            setTopicQuestions(prev => ({ ...prev, [key]: ['Could not generate questions. Try again.'] }));
            setLoadingTopics(prev => { const s = new Set(prev); s.delete(key); return s; });
          },
        }
      );
    }
  };

  const handleGeneratePaper = () => {
    const topTopics = analysisData.topics
      .filter(t => t.priority === 'high' || t.priority === 'medium')
      .slice(0, 5)
      .map(t => t.topicCode ? `${t.topic} (${t.topicCode})` : t.topic);

    generatePaperMutation.mutate(
      { data: { topics: topTopics } },
      {
        onSuccess: (data) => {
          setPaperData(data);
          setShowPaper(true);
        },
      }
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'medium': return <Target className="w-4 h-4 text-blue-400" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'skip': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'medium': return 'bg-blue-400/20 text-blue-400 border-blue-400/40';
      case 'low': return 'bg-green-400/20 text-green-400 border-green-400/40';
      case 'skip': return 'bg-red-400/20 text-red-400 border-red-400/40';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col md:flex-row bg-background overflow-hidden transition-colors duration-700 ${lastNightMode ? 'bg-[#05050a]' : ''}`}>

      {/* Left Pane - Student + Bubbles */}
      <div className={`relative flex-1 hidden md:flex items-center justify-center transition-opacity duration-700 ${lastNightMode ? 'opacity-20' : 'opacity-100'}`}>
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
            { x: '62%', y: '8%' },
            { x: '72%', y: '45%' },
            { x: '12%', y: '60%' },
          ]}
        />
      </div>

      {/* Right Pane - Results Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full md:w-[620px] flex-shrink-0 bg-card border-l border-border flex flex-col h-screen z-20 relative"
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex justify-between items-center gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Your Strategy</h2>
            <p className="text-sm text-muted-foreground">{analysisData.paperCount} paper{analysisData.paperCount !== 1 ? 's' : ''} analyzed</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
              onClick={handleGeneratePaper}
              disabled={generatePaperMutation.isPending}
            >
              {generatePaperMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating (~30s)...</>
                : <><FileText className="w-4 h-4" /> Generate Question Paper</>
              }
            </Button>
            <Button
              variant={lastNightMode ? 'default' : 'outline'}
              size="sm"
              className={`gap-2 ${lastNightMode ? 'bg-purple-600 hover:bg-purple-700 glow-purple text-white' : ''}`}
              onClick={() => setLastNightMode(!lastNightMode)}
            >
              <Moon className="w-4 h-4" />
              Last Night Mode
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-5">
          <div className="space-y-7 pb-10">

            {/* Readiness */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20 glow-blue">
              <div className="text-4xl font-bold text-primary">{analysisData.overallExamReadiness}%</div>
              <div>
                <p className="font-semibold text-lg">Exam Readiness</p>
                <p className="text-sm text-muted-foreground">Follow this plan to hit 100%</p>
              </div>
            </div>

            {/* Topics List */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Topic Priorities
                <span className="text-xs text-muted-foreground font-normal ml-1">— tap HIGH / MEDIUM for practice Qs</span>
              </h3>

              <AnimatePresence>
                {displayTopics.map((topic, i) => (
                  <motion.div
                    key={topic.topic}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.06 }}
                    className={`rounded-lg border bg-background/50 overflow-hidden transition-all
                      ${lastNightMode ? 'border-purple-500/50 glow-purple' : 'border-border'}`}
                  >
                    {/* Topic Row */}
                    <div
                      className={`p-4 ${canExpand(topic.priority) ? 'cursor-pointer hover:bg-white/5' : ''}`}
                      onClick={() => canExpand(topic.priority) && toggleTopic(topic)}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getPriorityIcon(topic.priority)}
                            <h4 className="font-semibold text-foreground">{topic.topic}</h4>
                            {topic.topicCode && (
                              <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded font-mono">
                                {topic.topicCode}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {topic.label}
                            {' · '}
                            <span className="text-foreground/70 font-medium">
                              Asked {topic.timesAsked}× in past papers
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(topic.priority)}`}>
                            {topic.priority === 'skip' ? 'Skip it' : `${topic.examChancePercent}% chance`}
                          </Badge>
                          {canExpand(topic.priority) && (
                            expandedTopics.has(topic.topic)
                              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${topic.priority === 'skip' ? 'bg-red-500/50' : 'bg-primary glow-blue'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${topic.importancePercent}%` }}
                          transition={{ duration: 1, delay: 0.4 + i * 0.06 }}
                        />
                      </div>
                    </div>

                    {/* Practice Questions Drawer */}
                    <AnimatePresence>
                      {expandedTopics.has(topic.topic) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="border-t border-border/60 bg-primary/5"
                        >
                          <div className="p-4 space-y-3">
                            <p className="text-xs font-bold text-primary uppercase tracking-wider">
                              Practice Questions
                            </p>
                            {loadingTopics.has(topic.topic) ? (
                              <div className="space-y-1 py-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                                  Generating questions — this takes about 30 seconds...
                                </div>
                                <p className="text-xs text-muted-foreground/60 pl-6">AI is writing exam-style questions for you</p>
                              </div>
                            ) : topicQuestions[topic.topic] ? (
                              <ul className="space-y-2.5">
                                {topicQuestions[topic.topic].map((q, qi) => (
                                  <li key={qi} className="flex gap-2 text-sm text-foreground/90 leading-relaxed">
                                    <span className="text-primary font-bold flex-shrink-0">Q{qi + 1}.</span>
                                    <span>{q}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Chart */}
            {!lastNightMode && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary" />
                  Times Asked in Past Papers
                </h3>
                <Card className="bg-background/50 border-border">
                  <CardContent className="p-4 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysisData.topics.slice(0, 7)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <XAxis
                          dataKey={(d: TopicScore) => d.topicCode || d.topic.split(' ')[0]}
                          tick={{ fontSize: 10, fill: '#888' }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f0f1e', borderColor: '#2a2a4a', fontSize: 12 }}
                          formatter={(val: any, _name: any, props: any) => [`${val}×`, props.payload.topic]}
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        />
                        <Bar dataKey="timesAsked" radius={[4, 4, 0, 0]}>
                          {analysisData.topics.slice(0, 7).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.priority === 'high' ? '#f97316'
                                : entry.priority === 'medium' ? '#4f8ef7'
                                : '#6366f1'
                              }
                            />
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
              <div className="space-y-3">
                <h3 className="text-base font-semibold">{analysisData.planDays}-Day Study Plan</h3>
                <div className="grid gap-3">
                  {analysisData.studyPlan.map((day) => (
                    <Card key={day.day} className="bg-background/50 border-border overflow-hidden relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60" />
                      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-bold">Day {day.day}</CardTitle>
                        <span className="text-xs text-muted-foreground">{day.timeHours} hrs</span>
                      </CardHeader>
                      <CardContent className="py-1 px-4 pb-4">
                        <p className="text-sm font-medium mb-2 text-foreground/80">{day.goal}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {day.focus.map((f, i) => (
                            <span key={i} className="text-xs bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-md">
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

            {/* Skip Topics */}
            {!lastNightMode && analysisData.skipTopics.length > 0 && (
              <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                <p className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Don't waste time on these
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysisData.skipTopics.map((t) => (
                    <span key={t} className="text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </ScrollArea>
      </motion.div>

      {/* Question Paper Modal */}
      <AnimatePresence>
        {showPaper && paperData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowPaper(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-border flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Expected Question Paper</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">AI-generated from your top topics — study these questions!</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPaper(false)}>✕</Button>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {paperData.questions.map((q) => (
                    <div key={q.number} className="border-b border-border/50 pb-5 last:border-0">
                      <div className="flex gap-3">
                        <span className="text-xl font-bold text-primary flex-shrink-0">Q{q.number}.</span>
                        <div className="flex-1">
                          <p className="text-sm text-foreground leading-relaxed">{q.question}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{q.topic}</span>
                            <span className="text-xs font-bold text-primary">[{q.marks} marks]</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
