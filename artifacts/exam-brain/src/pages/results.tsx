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
import { ArrowLeft, Flame, Target, AlertTriangle, Moon, CheckCircle, ChevronDown, ChevronUp, FileText, Loader2, RefreshCw, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGenerateQuestions, useGeneratePaper } from '@workspace/api-client-react';
import type { TopicScore, PaperQuestion } from '@workspace/api-client-react';

/* ── Circular progress SVG ──────────────────────────────── */
function CircularProgress({ value }: { value: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width="110" height="110" className="circular-progress flex-shrink-0">
      <circle cx="55" cy="55" r={r} stroke="rgba(79,142,247,0.12)" strokeWidth="8" fill="none" />
      <motion.circle
        cx="55" cy="55" r={r}
        stroke="url(#progressGrad)" strokeWidth="8" fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
      />
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4f8ef7" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Priority helpers ───────────────────────────────────── */
const PRIORITY_LABELS: Record<string, string> = {
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
  skip: 'SKIP',
};

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'high':   return <Flame className="w-4 h-4 text-orange-400" />;
    case 'medium': return <Target className="w-4 h-4 text-blue-400" />;
    case 'low':    return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'skip':   return <AlertTriangle className="w-4 h-4 text-red-400" />;
    default:       return null;
  }
}

function getPriorityBadgeStyle(priority: string) {
  switch (priority) {
    case 'high':   return 'bg-orange-500/20 text-orange-300 border-orange-500/40 glow-orange';
    case 'medium': return 'bg-blue-500/20 text-blue-300 border-blue-500/40 glow-blue';
    case 'low':    return 'bg-green-500/15 text-green-300 border-green-500/30 glow-green';
    case 'skip':   return 'bg-red-500/15 text-red-300 border-red-500/30';
    default:       return 'bg-muted text-muted-foreground';
  }
}

function getCardHoverClass(priority: string) {
  switch (priority) {
    case 'high':   return 'topic-card topic-card-high';
    case 'medium': return 'topic-card topic-card-medium';
    case 'low':    return 'topic-card topic-card-low';
    default:       return 'topic-card';
  }
}

/* ── Main component ─────────────────────────────────────── */
export default function Results() {
  const [, setLocation] = useLocation();
  const { analysisData } = useAppState();
  const [lastNightMode, setLastNightMode] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [topicQuestions, setTopicQuestions] = useState<Record<string, string[]>>({});
  const [failedTopics, setFailedTopics] = useState<Set<string>>(new Set());
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

  const fetchQuestions = (topic: TopicScore) => {
    const key = topic.topic;
    setLoadingTopics(prev => new Set(prev).add(key));
    const failed = new Set(failedTopics);
    failed.delete(key);
    setFailedTopics(failed);

    generateQuestionsMutation.mutate(
      { data: { topic: key, topicCode: topic.topicCode || '', count: 3 } },
      {
        onSuccess: (data) => {
          setTopicQuestions(prev => ({ ...prev, [key]: data.questions }));
          setLoadingTopics(prev => { const s = new Set(prev); s.delete(key); return s; });
        },
        onError: () => {
          setFailedTopics(prev => new Set(prev).add(key));
          setLoadingTopics(prev => { const s = new Set(prev); s.delete(key); return s; });
        },
      }
    );
  };

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
    if (!topicQuestions[key] && !failedTopics.has(key) && canExpand(topic.priority)) {
      fetchQuestions(topic);
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

  return (
    <div className={`min-h-screen w-full flex flex-col overflow-hidden transition-colors duration-700 ${lastNightMode ? 'bg-[#05050a]' : ''}`}>

      {/* ── Fixed Glass Navbar ── */}
      <header className="fixed top-0 left-0 w-full z-30 glass-navbar px-5 py-3 flex items-center justify-between gap-3">
        {/* Left brand */}
        <div className="flex flex-col min-w-0">
          <span className="text-base font-bold glow-text-blue leading-tight">Exam Brain</span>
          <span className="text-[10px] text-muted-foreground leading-tight tracking-wide hidden sm:block">Study Smart, Not Hard</span>
        </div>

        {/* Center AI pulse */}
        <div className="hidden md:flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary ai-pulse-dot" />
          <span className="text-xs text-muted-foreground">AI Active</span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground text-xs px-2"
            onClick={() => setLocation('/')}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Papers</span>
          </Button>

          <Button
            variant={lastNightMode ? 'default' : 'outline'}
            size="sm"
            className={`gap-1.5 text-xs px-3 ${lastNightMode ? 'bg-purple-600 hover:bg-purple-700 glow-purple text-white border-purple-500' : 'border-primary/30 text-primary hover:bg-primary/10'}`}
            onClick={() => setLastNightMode(!lastNightMode)}
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Last Night Mode</span>
          </Button>

          <Button
            size="sm"
            className="gap-1.5 text-xs px-3 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30"
            variant="outline"
            onClick={handleGeneratePaper}
            disabled={generatePaperMutation.isPending}
          >
            {generatePaperMutation.isPending
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="hidden sm:inline">Generating (~30s)…</span></>
              : <><FileText className="w-3.5 h-3.5" /><span className="hidden sm:inline">Generate Paper</span></>
            }
          </Button>
        </div>
      </header>

      {/* ── Body layout ── */}
      <div className="flex flex-col md:flex-row flex-1 pt-[56px]">

        {/* Left pane — student */}
        <div className={`relative flex-1 hidden md:flex flex-col items-center justify-center transition-opacity duration-700 ${lastNightMode ? 'opacity-20' : 'opacity-100'}`}>
          {/* Radial glow behind student */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(79,142,247,0.1) 0%, transparent 70%)' }}
          />
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
          {/* Student label */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 text-[11px] text-muted-foreground/50 tracking-widest uppercase">
            Your Study Assistant
          </div>
        </div>

        {/* Right pane — results */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full md:w-[620px] flex-shrink-0 bg-card border-l border-border flex flex-col h-[calc(100vh-56px)] z-20 relative"
        >
          {/* Panel header */}
          <div className="p-5 border-b border-border">
            <h2 className="text-2xl font-bold tracking-tight">Your Strategy</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Based on {analysisData.paperCount} paper{analysisData.paperCount !== 1 ? 's' : ''} — here's what to focus on</p>
          </div>

          <ScrollArea className="flex-1 p-5">
            <div className="space-y-7 pb-10">

              {/* ── Exam Readiness ── */}
              <div className="flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10 border border-primary/20 glow-blue">
                <CircularProgress value={analysisData.overallExamReadiness} />
                <div>
                  <p className="text-4xl font-extrabold text-primary leading-none mb-1">
                    {analysisData.overallExamReadiness}%
                  </p>
                  <p className="font-semibold text-lg">Exam Readiness</p>
                  <p className="text-sm text-muted-foreground mt-1">Follow this plan to hit 100%</p>
                </div>
              </div>

              {/* ── Topic Priorities ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Topic Priorities
                  </h3>
                  <span className="text-xs text-muted-foreground">tap HIGH / MEDIUM for practice Qs</span>
                </div>

                {displayTopics.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <Upload className="w-10 h-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">Upload your question papers to get started</p>
                    <motion.div
                      animate={{ y: [0, 8, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <span className="text-2xl">↑</span>
                    </motion.div>
                    <Button size="sm" variant="outline" onClick={() => setLocation('/')}>
                      Upload Papers
                    </Button>
                  </div>
                )}

                <AnimatePresence>
                  {displayTopics.map((topic, i) => (
                    <motion.div
                      key={topic.topic}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.06 }}
                      className={`rounded-xl border bg-background/50 overflow-hidden
                        ${getCardHoverClass(topic.priority)}
                        ${lastNightMode ? 'border-purple-500/40' : 'border-border'}`}
                    >
                      {/* Topic row */}
                      <div
                        className={`p-4 ${canExpand(topic.priority) ? 'cursor-pointer select-none' : ''}`}
                        onClick={() => canExpand(topic.priority) && toggleTopic(topic)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            {/* Name + code */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {getPriorityIcon(topic.priority)}
                              <h4 className="font-semibold text-foreground">{topic.topic}</h4>
                              {topic.topicCode && (
                                <span className="text-xs bg-primary/15 text-primary border border-primary/25 px-1.5 py-0.5 rounded font-mono">
                                  {topic.topicCode}
                                </span>
                              )}
                            </div>
                            {/* Meta */}
                            <p className="text-xs text-muted-foreground">
                              {topic.label}
                              {' · '}
                              <span className="text-foreground/70 font-medium">
                                Asked {topic.timesAsked}× in past papers
                              </span>
                            </p>
                          </div>

                          {/* Right badges */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              variant="outline"
                              className={`text-xs font-bold px-2.5 py-0.5 ${getPriorityBadgeStyle(topic.priority)}`}
                            >
                              {PRIORITY_LABELS[topic.priority] ?? topic.priority.toUpperCase()}
                            </Badge>
                            {canExpand(topic.priority) && (
                              expandedTopics.has(topic.topic)
                                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Chance badge + progress bar */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                topic.priority === 'high'   ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                                topic.priority === 'medium' ? 'bg-gradient-to-r from-primary to-blue-400' :
                                topic.priority === 'low'    ? 'bg-green-400' :
                                'bg-red-500/50'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${topic.importancePercent}%` }}
                              transition={{ duration: 1, delay: 0.4 + i * 0.06 }}
                            />
                          </div>
                          {topic.priority !== 'skip' && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {topic.examChancePercent}% chance
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Practice questions drawer */}
                      <AnimatePresence>
                        {expandedTopics.has(topic.topic) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="border-t border-border/50 bg-primary/5"
                          >
                            <div className="p-4 space-y-3">
                              <p className="text-xs font-bold text-primary uppercase tracking-wider">
                                Practice Questions
                              </p>

                              {loadingTopics.has(topic.topic) ? (
                                <div className="space-y-1 py-1">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                                    Generating questions — takes about 30 seconds…
                                  </div>
                                  <p className="text-xs text-muted-foreground/50 pl-6">AI is writing real exam questions</p>
                                </div>
                              ) : failedTopics.has(topic.topic) ? (
                                <div className="flex items-center gap-3 py-1">
                                  <p className="text-sm text-muted-foreground flex-1">Couldn't generate questions.</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                                    onClick={(e) => { e.stopPropagation(); fetchQuestions(topic); }}
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    Retry
                                  </Button>
                                </div>
                              ) : topicQuestions[topic.topic] ? (
                                <ul className="space-y-3">
                                  {topicQuestions[topic.topic].map((q, qi) => (
                                    <li key={qi} className="flex gap-2.5 text-sm text-foreground/90 leading-relaxed">
                                      <span className="text-primary font-bold flex-shrink-0 mt-0.5">Q{qi + 1}.</span>
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

              {/* ── Bar chart ── */}
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
                                  entry.priority === 'high'   ? '#f97316' :
                                  entry.priority === 'medium' ? '#4f8ef7' :
                                  '#6366f1'
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

              {/* ── Study Plan ── */}
              {!lastNightMode && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">{analysisData.planDays}-Day Study Plan</h3>
                  <div className="grid gap-3">
                    {analysisData.studyPlan.map((day) => (
                      <Card key={day.day} className="bg-background/50 border-border overflow-hidden relative group hover:border-primary/30 transition-colors duration-200">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary" />
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

              {/* ── Skip topics ── */}
              {!lastNightMode && analysisData.skipTopics.length > 0 && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                  <p className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Skip if you're short on time
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

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground/35 pb-4 tracking-wide">
              Built for students who want to study smart, not hard
            </p>
          </ScrollArea>
        </motion.div>
      </div>

      {/* ── Question Paper Modal ── */}
      <AnimatePresence>
        {showPaper && paperData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPaper(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 24 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-primary/25 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl glow-blue"
            >
              <div className="p-6 border-b border-border flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Expected Question Paper</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">AI-generated from your top topics — study these well!</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPaper(false)} className="text-muted-foreground hover:text-foreground">✕</Button>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {paperData.questions.map((q) => (
                    <div key={q.number} className="border-b border-border/40 pb-5 last:border-0">
                      <div className="flex gap-3">
                        <span className="text-xl font-bold text-primary flex-shrink-0">Q{q.number}.</span>
                        <div className="flex-1">
                          <p className="text-sm text-foreground leading-relaxed">{q.question}</p>
                          <div className="flex items-center gap-3 mt-2.5">
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
