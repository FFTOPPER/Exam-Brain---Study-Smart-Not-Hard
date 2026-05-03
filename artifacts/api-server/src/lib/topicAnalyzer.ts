interface RawTopic {
  topic: string;
  frequency: number;
  marksWeight: number;
  recentScore: number;
}

const STOP_WORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
  "from","is","are","was","were","be","been","being","have","has","had","do",
  "does","did","will","would","could","should","may","might","shall","must",
  "that","this","these","those","it","its","which","who","whom","what","when",
  "where","why","how","all","each","every","both","few","more","most","other",
  "some","such","no","nor","not","only","own","same","so","than","too","very",
  "just","because","as","until","while","about","against","between","through",
  "during","before","after","above","below","up","down","out","off","over",
  "under","again","then","once","here","there","any","they","their","them",
  "we","our","you","your","he","she","him","his","her","i","my","me","us",
  "question","questions","answer","answers","marks","mark","total","paper",
  "exam","examination","section","part","attempt","following","describe",
  "explain","define","calculate","find","solve","give","state","discuss",
  "write","note","draw","show","prove","determine","list","mention","example",
  "examples","fig","figure","table","unit","chapter","page","time","year",
  "years","use","using","used","uses","based","given","number","data","type",
  "types","method","methods","system","value","values","result","results",
  "following","following","form","forms","function","functions",
]);

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  "Algebra": ["algebra","polynomial","equation","quadratic","linear","matrix","determinant","eigenvalue","vector","factoring","binomial","logarithm","exponent","inequality","variable","coefficient"],
  "Calculus": ["calculus","differentiation","integration","derivative","integral","limit","differential","partial","gradient","chain rule","taylor","maclaurin","convergence","series","sequence"],
  "Geometry": ["geometry","triangle","circle","polygon","angle","coordinate","euclidean","congruent","similar","area","perimeter","volume","surface","transformation","rotation","reflection"],
  "Probability": ["probability","statistics","distribution","random","variance","standard deviation","mean","median","mode","sample","population","hypothesis","regression","correlation","bayes","normal"],
  "Thermodynamics": ["thermodynamics","heat","temperature","entropy","enthalpy","energy","work","pressure","volume","ideal gas","carnot","isothermal","adiabatic","specific heat","calorimetry"],
  "Mechanics": ["mechanics","force","velocity","acceleration","momentum","torque","friction","gravity","projectile","circular motion","newton","kinetic","potential","equilibrium","displacement"],
  "Electricity": ["electricity","electric","current","voltage","resistance","capacitor","inductor","circuit","power","ohm","kirchhoff","magnetic","flux","electromagnetic","charge","field"],
  "Waves & Optics": ["wave","optics","refraction","reflection","diffraction","interference","wavelength","frequency","amplitude","sound","light","spectrum","lens","mirror","polarization"],
  "Chemistry": ["chemistry","chemical","reaction","molecule","atom","compound","element","bond","acid","base","oxidation","reduction","equilibrium","catalyst","organic","inorganic","solution","solubility"],
  "Biology": ["biology","cell","dna","rna","protein","gene","genetics","evolution","ecosystem","photosynthesis","respiration","enzyme","membrane","organism","species","mutation","chromosome"],
  "Programming": ["algorithm","data structure","array","linked list","tree","graph","sorting","searching","recursion","complexity","pointer","stack","queue","hash","binary","complexity"],
  "Networking": ["network","protocol","tcp","ip","http","dns","routing","switching","bandwidth","latency","firewall","encryption","socket","packet","ethernet","wireless","subnet"],
  "Database": ["database","sql","query","table","join","index","transaction","normalization","relational","schema","primary key","foreign key","acid","nosql","mongodb"],
  "Operating Systems": ["operating system","process","thread","scheduling","memory","paging","semaphore","deadlock","file system","interrupt","virtual memory","cache","synchronization"],
  "Economics": ["economics","supply","demand","market","price","inflation","gdp","trade","fiscal","monetary","elasticity","utility","marginal","microeconomics","macroeconomics","cost","revenue"],
  "History": ["history","revolution","empire","war","treaty","civilization","colonial","independence","democracy","monarchy","reform","industrial","world war","ancient","medieval","modern"],
  "Literature": ["literature","poem","poetry","novel","drama","theme","character","plot","symbolism","metaphor","narrative","author","genre","prose","fiction","literary","analysis"],
  "Accounting": ["accounting","balance sheet","income statement","asset","liability","equity","debit","credit","journal","ledger","depreciation","revenue","expense","audit","financial","ratio"],
  "Marketing": ["marketing","brand","consumer","product","promotion","advertising","market","segmentation","positioning","pricing","strategy","customer","campaign","digital","social media"],
  "Management": ["management","leadership","organization","planning","control","strategy","decision","motivation","communication","human resource","operation","supply chain","project","quality"],
};

function extractKeywords(text: string): Map<string, number> {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ").filter(w => w.length > 3 && !STOP_WORDS.has(w));

  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return freq;
}

function detectMarksWeight(text: string, topic: string): number {
  const pattern = new RegExp(`${topic.toLowerCase()}[^.]{0,100}(\\d+)\\s*marks?`, "gi");
  const matches = [...text.matchAll(pattern)];
  if (matches.length === 0) return 5;
  const total = matches.reduce((sum, m) => sum + parseInt(m[1], 10), 0);
  return Math.min(20, Math.round(total / matches.length));
}

function detectRecentScore(text: string, topic: string): number {
  const lines = text.split("\n");
  const total = lines.length;
  const topicLower = topic.toLowerCase();
  let latestLine = -1;
  lines.forEach((line, i) => {
    if (line.toLowerCase().includes(topicLower)) latestLine = i;
  });
  if (latestLine === -1) return 0;
  return latestLine / total;
}

export function analyzeText(text: string): RawTopic[] {
  const wordFreq = extractKeywords(text);
  const topicScores = new Map<string, RawTopic>();

  for (const [topicName, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    let totalFreq = 0;
    for (const kw of keywords) {
      totalFreq += wordFreq.get(kw) || 0;
      for (const [word, freq] of wordFreq.entries()) {
        if (word.includes(kw) || kw.includes(word)) {
          totalFreq += Math.floor(freq * 0.3);
        }
      }
    }
    if (totalFreq > 0) {
      const marksWeight = detectMarksWeight(text, topicName);
      const recentScore = detectRecentScore(text, keywords[0]);
      topicScores.set(topicName, { topic: topicName, frequency: totalFreq, marksWeight, recentScore });
    }
  }

  const unknown = Array.from(wordFreq.entries())
    .filter(([w, f]) => f >= 3 && w.length > 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w, f]) => ({
      topic: w.charAt(0).toUpperCase() + w.slice(1),
      frequency: f,
      marksWeight: 5,
      recentScore: 0.5,
    }));

  for (const t of unknown) {
    if (!topicScores.has(t.topic)) {
      topicScores.set(t.topic, t);
    }
  }

  return Array.from(topicScores.values()).sort((a, b) => b.frequency - a.frequency).slice(0, 15);
}

export function scoreTopics(raw: RawTopic[], paperCount: number): Array<{
  topic: string;
  frequency: number;
  importancePercent: number;
  examChancePercent: number;
  priority: "high" | "medium" | "low" | "skip";
  label: string;
  marksWeight: number;
}> {
  if (raw.length === 0) return [];

  const maxFreq = Math.max(...raw.map(t => t.frequency), 1);
  const maxMarks = Math.max(...raw.map(t => t.marksWeight), 1);

  const scored = raw.map(t => {
    const freqScore = t.frequency / maxFreq;
    const marksScore = t.marksWeight / maxMarks;
    const recencyScore = t.recentScore;
    const composite = freqScore * 0.5 + marksScore * 0.3 + recencyScore * 0.2;
    const importancePercent = Math.round(composite * 100);
    const examChancePercent = Math.min(95, Math.round(
      (freqScore * 0.6 + marksScore * 0.3 + (paperCount > 1 ? 0.1 : 0)) * 100
    ));

    let priority: "high" | "medium" | "low" | "skip";
    let label: string;
    if (importancePercent >= 70) {
      priority = "high";
      label = "Study this first";
    } else if (importancePercent >= 45) {
      priority = "medium";
      label = "High chance in exam";
    } else if (importancePercent >= 25) {
      priority = "low";
      label = "Good to know";
    } else {
      priority = "skip";
      label = "Don't waste time here";
    }

    return { topic: t.topic, frequency: t.frequency, importancePercent, examChancePercent, priority, label, marksWeight: t.marksWeight };
  });

  return scored.sort((a, b) => b.importancePercent - a.importancePercent);
}

export function generateStudyPlan(
  topics: ReturnType<typeof scoreTopics>,
  planDays: number
): Array<{ day: number; focus: string[]; goal: string; timeHours: number }> {
  const highPriority = topics.filter(t => t.priority === "high" || t.priority === "medium");
  const chunkSize = Math.ceil(highPriority.length / planDays);

  return Array.from({ length: planDays }, (_, i) => {
    const dayTopics = highPriority.slice(i * chunkSize, (i + 1) * chunkSize).map(t => t.topic);
    const isLastDay = i === planDays - 1;
    return {
      day: i + 1,
      focus: dayTopics.length > 0 ? dayTopics : ["Review previous topics"],
      goal: isLastDay ? "Revise all important topics and practice past questions" : `Master ${dayTopics.slice(0, 2).join(" and ")}`,
      timeHours: i === 0 ? 4 : isLastDay ? 3 : 4,
    };
  });
}

export function generateThoughtBubbles(
  topics: ReturnType<typeof scoreTopics>
): string[] {
  const top = topics.filter(t => t.priority === "high").slice(0, 2);
  const skip = topics.filter(t => t.priority === "skip").slice(0, 1);
  const overall = topics.length > 0
    ? Math.round(topics.slice(0, 3).reduce((s, t) => s + t.examChancePercent, 0) / 3)
    : 0;

  const bubbles: string[] = [];
  if (top[0]) bubbles.push(`🔥 Study THIS first → ${top[0].examChancePercent}% chance`);
  if (skip[0]) bubbles.push(`⚠️ Skip this → low marks impact`);
  if (top[0] && top[1]) bubbles.push(`🎯 Focus: ${top[0].topic} & ${top[1].topic}`);
  bubbles.push(`⏳ Your plan is ready`);
  if (overall > 0) bubbles.push(`📊 Overall readiness: ${overall}%`);
  return bubbles;
}
