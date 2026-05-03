import React, { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '@/hooks/use-app-state';
import { Student3D } from '@/components/Student3D';
import { ThoughtBubbles } from '@/components/ThoughtBubbles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import {
  Flame, Target, AlertTriangle, Moon, CheckCircle,
  ChevronDown, ChevronUp, FileText, Loader2, RefreshCw,
  Upload, BookOpen, CheckCheck, XCircle, AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGenerateQuestions, useGeneratePaper } from '@workspace/api-client-react';
import type { TopicScore, PaperQuestion } from '@workspace/api-client-react';

/* ── Circular progress ────────────────────────────────────── */
function CircularProgress({ value }: { value: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="110" height="110" className="circular-progress flex-shrink-0">
      <circle cx="55" cy="55" r={r} stroke="rgba(79,142,247,0.12)" strokeWidth="8" fill="none" />
      <motion.circle
        cx="55" cy="55" r={r}
        stroke="url(#progressGrad)" strokeWidth="8" fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (value / 100) * circ }}
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

/* ── Priority helpers ─────────────────────────────────────── */
const PRIORITY_LABELS: Record<string, string> = { high: 'HIGH', medium: 'MEDIUM', low: 'LOW', skip: 'SKIP' };

function getPriorityIcon(p: string) {
  if (p === 'high')   return <Flame className="w-4 h-4 text-orange-400" />;
  if (p === 'medium') return <Target className="w-4 h-4 text-blue-400" />;
  if (p === 'low')    return <CheckCircle className="w-4 h-4 text-green-400" />;
  return <AlertTriangle className="w-4 h-4 text-red-400" />;
}
function getPriorityBadge(p: string) {
  if (p === 'high')   return 'bg-orange-500/20 text-orange-300 border-orange-500/40 glow-orange';
  if (p === 'medium') return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  if (p === 'low')    return 'bg-green-500/15 text-green-300 border-green-500/30';
  return 'bg-red-500/15 text-red-300 border-red-500/30';
}
function getCardHover(p: string) {
  if (p === 'high')   return 'topic-card topic-card-high';
  if (p === 'medium') return 'topic-card topic-card-medium';
  if (p === 'low')    return 'topic-card topic-card-low';
  return 'topic-card';
}
function getBarColor(p: string) {
  if (p === 'high')   return 'bg-gradient-to-r from-orange-500 to-orange-400';
  if (p === 'medium') return 'bg-gradient-to-r from-primary to-blue-400';
  if (p === 'low')    return 'bg-green-400';
  return 'bg-red-500/50';
}

/* ── Pie chart label ─────────────────────────────────────── */
const PIE_COLORS = ['#4f8ef7', '#8b5cf6', '#f97316', '#22d3ee'];
const PIE_RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  if (percent < 0.06) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * PIE_RADIAN);
  const y = cy + radius * Math.sin(-midAngle * PIE_RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/* ── Syllabus cross-ref helper ───────────────────────────── */
function tokenizeSyllabus(raw: string): string[] {
  return raw
    .split(/[\n,;•\-–—]+/)
    .map(l => l.trim().toLowerCase().replace(/^\d+[\.\)]\s*/, ''))
    .filter(l => l.length > 3 && l.split(' ').length <= 8);
}

function matchTopic(syllabusItem: string, topics: TopicScore[]): TopicScore | null {
  const sil = syllabusItem.toLowerCase();
  return topics.find(t =>
    t.topic.toLowerCase().includes(sil) ||
    sil.includes(t.topic.toLowerCase()) ||
    t.topic.toLowerCase().split(' ').some(word => word.length > 4 && sil.includes(word))
  ) ?? null;
}

/* ── Main component ──────────────────────────────────────── */
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
  const [syllabusText, setSyllabusText] = useState('');
  const [showSyllabus, setShowSyllabus] = useState(false);

  const generateQuestionsMutation = useGenerateQuestions();
  const generatePaperMutation = useGeneratePaper();

  if (!analysisData) { setLocation('/'); return null; }

  const displayTopics = lastNightMode
    ? analysisData.topics.filter(t => analysisData.lastNightTopics.includes(t.topic)).slice(0, 5)
    : analysisData.topics;

  const canExpand = (p: string) => p === 'high' || p === 'medium';

  const fetchQuestions = (topic: TopicScore) => {
    const key = topic.topic;
    setLoadingTopics(prev => new Set(prev).add(key));
    setFailedTopics(prev => { const s = new Set(prev); s.delete(key); return s; });
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

  const toggleTopic = (topic: TopicScore) => {
    const key = topic.topic;
    const next = new Set(expandedTopics);
    if (next.has(key)) { next.delete(key); setExpandedTopics(next); return; }
    next.add(key);
    setExpandedTopics(next);
    if (!topicQuestions[key] && !failedTopics.has(key) && canExpand(topic.priority)) fetchQuestions(topic);
  };

  const handleGeneratePaper = () => {
    const topTopics = analysisData.topics
      .filter(t => t.priority === 'high' || t.priority === 'medium')
      .slice(0, 5)
      .map(t => t.topicCode ? `${t.topic} (${t.topicCode})` : t.topic);
    generatePaperMutation.mutate(
      { data: { topics: topTopics } },
      { onSuccess: (data) => { setPaperData(data); setShowPaper(true); } }
    );
  };

  // Question type pie data
  const qtd = analysisData.questionTypeDistribution;
  const pieData = qtd ? [
    { name: 'Short Answer', value: qtd.short },
    { name: 'Essay / Long', value: qtd.long },
    { name: 'MCQ', value: qtd.mcq },
    { name: 'Numerical', value: qtd.numerical },
  ].filter(d => d.value > 0) : [];

  // Syllabus cross-reference
  const syllabusItems = useMemo(() => tokenizeSyllabus(syllabusText), [syllabusText]);
  const syllabusAnalysis = useMemo(() => {
    if (!syllabusItems.length) return null;
    return syllabusItems.map(item => ({
      item,
      matched: matchTopic(item, analysisData.topics),
    }));
  }, [syllabusItems, analysisData.topics]);

  const covered = syllabusAnalysis?.filter(s => s.matched) ?? [];
  const gaps = syllabusAnalysis?.filter(s => !s.matched) ?? [];
  const coveragePct = syllabusAnalysis?.length
    ? Math.round((covered.length / syllabusAnalysis.length) * 100)
    : 0;

  return (
    <div className={`min-h-screen w-full flex flex-col overflow-hidden transition-colors duration-700 ${lastNightMode ? 'bg-[#05050a]' : ''}`}>

      {/* ── Fixed Glass Navbar ── */}
      <header className="fixed top-0 left-0 w-full z-30 glass-navbar px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-base font-bold glow-text-blue leading-tight">Exam Brain</span>
          <span className="text-[10px] text-muted-foreground leading-tight tracking-wide hidden sm:block">Study Smart, Not Hard</span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary ai-pulse-dot" />
          <span className="text-xs text-muted-foreground">AI Active</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground text-xs px-2" onClick={() => setLocation('/')}>
            <Upload className="w-3.5 h-3.5" /><span className="hidden sm:inline">Upload Papers</span>
          </Button>
          <Button
            variant={lastNightMode ? 'default' : 'outline'} size="sm"
            className={`gap-1.5 text-xs px-3 ${lastNightMode ? 'bg-purple-600 hover:bg-purple-700 glow-purple text-white border-purple-500' : 'border-primary/30 text-primary hover:bg-primary/10'}`}
            onClick={() => setLastNightMode(!lastNightMode)}
          >
            <Moon className="w-3.5 h-3.5" /><span className="hidden sm:inline">Last Night Mode</span>
          </Button>
          <Button size="sm" className="gap-1.5 text-xs px-3 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30" variant="outline"
            onClick={handleGeneratePaper} disabled={generatePaperMutation.isPending}
          >
            {generatePaperMutation.isPending
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="hidden sm:inline">Generating (~30s)…</span></>
              : <><FileText className="w-3.5 h-3.5" /><span className="hidden sm:inline">Generate Paper</span></>}
          </Button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-col md:flex-row flex-1 pt-[56px]">

        {/* Left — student */}
        <div className={`relative flex-1 hidden md:flex flex-col items-center justify-center transition-opacity duration-700 ${lastNightMode ? 'opacity-20' : 'opacity-100'}`}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(79,142,247,0.1) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 z-0"><Student3D isThinking={false} /></div>
          <ThoughtBubbles
            bubbles={analysisData.thoughtBubbles.slice(0, 4)}
            positions={[{ x: '10%', y: '15%' }, { x: '62%', y: '8%' }, { x: '72%', y: '45%' }, { x: '12%', y: '60%' }]}
          />
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 text-[11px] text-muted-foreground/50 tracking-widest uppercase">Your Study Assistant</div>
        </div>

        {/* Right — results panel */}
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full md:w-[640px] flex-shrink-0 bg-card border-l border-border flex flex-col h-[calc(100vh-56px)] z-20 relative"
        >
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
                  <p className="text-4xl font-extrabold text-primary leading-none mb-1">{analysisData.overallExamReadiness}%</p>
                  <p className="font-semibold text-lg">Exam Readiness</p>
                  <p className="text-sm text-muted-foreground mt-1">Follow this plan to hit 100%</p>
                </div>
              </div>

              {/* ── Question Type Distribution (NEW) ── */}
              {pieData.length > 0 && !lastNightMode && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Question Type Distribution
                    <span className="text-xs text-muted-foreground font-normal ml-1">— what style of questions to expect</span>
                  </h3>
                  <Card className="bg-background/50 border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <ResponsiveContainer width={200} height={180}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%" cy="50%"
                              innerRadius={45} outerRadius={80}
                              dataKey="value"
                              labelLine={false}
                              label={PieLabel}
                            >
                              {pieData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-2 flex-1">
                          {pieData.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <span className="text-sm text-foreground/80 flex-1">{d.name}</span>
                              <span className="text-sm font-bold text-foreground">{d.value}</span>
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground mt-1">
                            Detected from question phrasing patterns in your papers
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── Topic Priorities ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Flame className="w-5 h-5 text-primary" />
                    Topic Priorities
                  </h3>
                  <span className="text-xs text-muted-foreground">tap HIGH/MEDIUM for practice Qs</span>
                </div>
                <AnimatePresence>
                  {displayTopics.map((topic, i) => (
                    <motion.div
                      key={topic.topic}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.06 }}
                      className={`rounded-xl border bg-background/50 overflow-hidden ${getCardHover(topic.priority)} ${lastNightMode ? 'border-purple-500/40' : 'border-border'}`}
                    >
                      <div
                        className={`p-4 ${canExpand(topic.priority) ? 'cursor-pointer select-none' : ''}`}
                        onClick={() => canExpand(topic.priority) && toggleTopic(topic)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {getPriorityIcon(topic.priority)}
                              <h4 className="font-semibold text-foreground">{topic.topic}</h4>
                              {topic.topicCode && (
                                <span className="text-xs bg-primary/15 text-primary border border-primary/25 px-1.5 py-0.5 rounded font-mono">{topic.topicCode}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {topic.label} · <span className="text-foreground/70 font-medium">Asked {topic.timesAsked}× in past papers</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className={`text-xs font-bold px-2.5 py-0.5 ${getPriorityBadge(topic.priority)}`}>
                              {PRIORITY_LABELS[topic.priority] ?? topic.priority.toUpperCase()}
                            </Badge>
                            {canExpand(topic.priority) && (
                              expandedTopics.has(topic.topic)
                                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${getBarColor(topic.priority)}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${topic.importancePercent}%` }}
                              transition={{ duration: 1, delay: 0.4 + i * 0.06 }}
                            />
                          </div>
                          {topic.priority !== 'skip' && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">{topic.examChancePercent}% chance</span>
                          )}
                        </div>
                      </div>

                      {/* Practice questions drawer */}
                      <AnimatePresence>
                        {expandedTopics.has(topic.topic) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                            className="border-t border-border/50 bg-primary/5"
                          >
                            <div className="p-4 space-y-3">
                              <p className="text-xs font-bold text-primary uppercase tracking-wider">Practice Questions</p>
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
                                  <Button variant="outline" size="sm" className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                                    onClick={(e) => { e.stopPropagation(); fetchQuestions(topic); }}>
                                    <RefreshCw className="w-3 h-3" /> Retry
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

              {/* ── Syllabus Cross-Reference (NEW) ── */}
              {!lastNightMode && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Syllabus Cross-Reference
                    </h3>
                    <Button
                      variant="ghost" size="sm"
                      className="text-xs text-primary hover:bg-primary/10 gap-1"
                      onClick={() => setShowSyllabus(s => !s)}
                    >
                      {showSyllabus ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {showSyllabus ? 'Hide' : 'Paste Syllabus'}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {showSyllabus && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                        className="space-y-3"
                      >
                        <textarea
                          className="w-full h-28 rounded-lg border border-border bg-background/60 text-sm text-foreground px-3 py-2 resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                          placeholder={"Paste your official syllabus here — one topic per line.\nExample:\n  1. Data Structures\n  2. Operating Systems\n  3. Computer Networks"}
                          value={syllabusText}
                          onChange={e => setSyllabusText(e.target.value)}
                        />
                        {syllabusText.trim().length > 5 && !syllabusAnalysis?.length && (
                          <p className="text-xs text-muted-foreground/60">Keep typing — topics will appear once parsed…</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Coverage heatmap */}
                  {syllabusAnalysis && syllabusAnalysis.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      {/* Summary bar */}
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/40">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{covered.length} of {syllabusAnalysis.length} topics covered</span>
                            <span className={`font-bold ${coveragePct >= 70 ? 'text-green-400' : coveragePct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{coveragePct}% covered</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${coveragePct >= 70 ? 'bg-green-400' : coveragePct >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${coveragePct}%` }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Coverage heatmap grid */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Coverage Heatmap</p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {syllabusAnalysis.map(({ item, matched }, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm border transition-all
                                ${matched
                                  ? matched.priority === 'high'
                                    ? 'bg-orange-500/10 border-orange-500/25 text-orange-200'
                                    : matched.priority === 'medium'
                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                                    : 'bg-green-500/8 border-green-500/20 text-green-200'
                                  : 'bg-red-500/8 border-red-500/15 text-red-300/70'
                                }`}
                            >
                              {matched
                                ? <CheckCheck className="w-3.5 h-3.5 flex-shrink-0 text-green-400" />
                                : <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400/60" />
                              }
                              <span className="flex-1 capitalize truncate">{item}</span>
                              {matched ? (
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getPriorityBadge(matched.priority)}`}>
                                  {PRIORITY_LABELS[matched.priority]}
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-red-400/60 flex-shrink-0">Not in papers</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {gaps.length > 0 && (
                          <div className="mt-3 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                            <p className="text-xs font-semibold text-yellow-400 flex items-center gap-1.5 mb-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Coverage Gaps — study these too!
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {gaps.length} syllabus topic{gaps.length !== 1 ? 's' : ''} haven't appeared in past papers yet — they could still appear on your exam.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {!syllabusAnalysis && (
                    <p className="text-xs text-muted-foreground/50 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Paste your official syllabus above to see which topics are covered vs missing
                    </p>
                  )}
                </div>
              )}

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
                          <XAxis dataKey={(d: TopicScore) => d.topicCode || d.topic.split(' ')[0]} tick={{ fontSize: 10, fill: '#888' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f0f1e', borderColor: '#2a2a4a', fontSize: 12 }}
                            formatter={(val: any, _: any, props: any) => [`${val}×`, props.payload.topic]}
                            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          />
                          <Bar dataKey="timesAsked" radius={[4, 4, 0, 0]}>
                            {analysisData.topics.slice(0, 7).map((entry, idx) => (
                              <Cell key={idx} fill={entry.priority === 'high' ? '#f97316' : entry.priority === 'medium' ? '#4f8ef7' : '#6366f1'} />
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
                              <span key={i} className="text-xs bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-md">{f}</span>
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
                    <AlertTriangle className="w-4 h-4" /> Skip if you're short on time
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.skipTopics.map((t) => (
                      <span key={t} className="text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              )}

            </div>
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPaper(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
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
