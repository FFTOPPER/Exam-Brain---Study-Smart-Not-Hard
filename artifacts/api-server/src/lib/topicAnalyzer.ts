interface RawTopic {
  topic: string;
  topicCode: string;
  frequency: number;
  timesAsked: number;
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
  "form","forms","function","functions",
]);

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  "Algebra": ["algebra","polynomial","equation","quadratic","linear","matrix","determinant","eigenvalue","vector","factoring","binomial","logarithm","exponent","inequality","variable","coefficient"],
  "Calculus": ["calculus","differentiation","integration","derivative","integral","limit","differential","partial","gradient","taylor","maclaurin","convergence","series","sequence"],
  "Geometry": ["geometry","triangle","circle","polygon","angle","coordinate","euclidean","congruent","similar","area","perimeter","volume","surface","transformation","rotation","reflection"],
  "Probability & Statistics": ["probability","statistics","distribution","random","variance","standard deviation","mean","median","mode","sample","population","hypothesis","regression","correlation","bayes","normal"],
  "Thermodynamics": ["thermodynamics","heat","temperature","entropy","enthalpy","energy","work","pressure","carnot","isothermal","adiabatic","specific heat","calorimetry"],
  "Mechanics": ["mechanics","force","velocity","acceleration","momentum","torque","friction","gravity","projectile","circular motion","newton","kinetic","potential","equilibrium","displacement"],
  "Electricity & Magnetism": ["electricity","electric","current","voltage","resistance","capacitor","inductor","circuit","power","ohm","kirchhoff","magnetic","flux","electromagnetic","charge"],
  "Waves & Optics": ["wave","optics","refraction","reflection","diffraction","interference","wavelength","amplitude","sound","spectrum","lens","mirror","polarization"],
  "Chemistry": ["chemistry","chemical","reaction","molecule","atom","compound","element","bond","acid","base","oxidation","reduction","equilibrium","catalyst","organic","inorganic","solution"],
  "Biology": ["biology","cell","dna","rna","protein","gene","genetics","evolution","ecosystem","photosynthesis","respiration","enzyme","membrane","organism","species","mutation"],
  "Data Structures & Algorithms": ["algorithm","data structure","array","linked list","tree","graph","sorting","searching","recursion","complexity","pointer","stack","queue","hash","binary"],
  "Computer Networks": ["network","protocol","tcp","ip","http","dns","routing","switching","bandwidth","latency","firewall","socket","packet","ethernet","wireless","subnet","osi"],
  "Database Systems": ["database","sql","query","table","join","index","transaction","normalization","relational","schema","primary key","foreign key","acid","nosql"],
  "Operating Systems": ["operating system","process","thread","scheduling","memory","paging","semaphore","deadlock","file system","interrupt","virtual memory","cache","synchronization"],
  "Cybersecurity": ["security","threat","vulnerability","attack","malware","virus","encryption","authentication","firewall","intrusion","policy","risk","penetration","exploit","phishing","ransomware","cyber"],
  "Software Engineering": ["software","requirement","design","testing","agile","scrum","sdlc","uml","object oriented","class","inheritance","polymorphism","abstraction","encapsulation"],
  "Artificial Intelligence": ["artificial intelligence","machine learning","neural","deep learning","classification","regression","clustering","supervised","unsupervised","training","decision tree"],
  "Economics": ["economics","supply","demand","market","price","inflation","gdp","trade","fiscal","monetary","elasticity","utility","marginal","microeconomics","macroeconomics","cost","revenue"],
  "Accounting": ["accounting","balance sheet","income statement","asset","liability","equity","debit","credit","journal","ledger","depreciation","revenue","expense","audit","financial"],
  "Marketing": ["marketing","brand","consumer","product","promotion","advertising","market","segmentation","positioning","pricing","strategy","customer","campaign"],
  "Management": ["management","leadership","organization","planning","control","strategy","decision","motivation","communication","human resource","operation","supply chain","project"],
};

/**
 * Extract structured topics from text that follow patterns like:
 * "Security Policy Implementation Concepts – T1"
 * "T1 - Network Security" / "Topic 1: Calculus"
 */
function extractTopicCodes(text: string): Map<string, string> {
  const codeToName = new Map<string, string>();

  const patterns: RegExp[] = [
    /([A-Za-z][A-Za-z0-9 ,&/'\-]{3,80})\s*[–\-—]\s*(T\d{1,2})\b/gi,
    /([A-Za-z][A-Za-z0-9 ,&/'\-]{3,80})\s*\(\s*(T\d{1,2})\s*\)/gi,
    /(T\d{1,2})\s*[–\-—:]\s*([A-Za-z][A-Za-z0-9 ,&/'\- ]{3,80})/gi,
    /(T\d{1,2})\.\s+([A-Za-z][A-Za-z0-9 ,&/'\- ]{3,80})/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      const part1 = match[1]?.trim() ?? "";
      const part2 = match[2]?.trim() ?? "";
      let code: string, name: string;
      if (/^T\d+$/i.test(part1)) {
        code = part1.toUpperCase();
        name = part2;
      } else {
        code = part2.toUpperCase();
        name = part1;
      }
      if (!codeToName.has(code) && name.length > 3 && name.length < 120) {
        codeToName.set(code, name);
      }
    }
  }

  return codeToName;
}

function countTopicCodeMentions(text: string, codes: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const code of codes) {
    const pattern = new RegExp(`\\b${code}\\b`, "gi");
    const matches = text.match(pattern);
    counts.set(code, matches ? matches.length : 1);
  }
  return counts;
}

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
  const escaped = topic.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escaped}[^.]{0,100}(\\d+)\\s*marks?`, "gi");
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
  const codeToName = extractTopicCodes(text);
  const codeMentions = countTopicCodeMentions(text, Array.from(codeToName.keys()));
  const topicScores = new Map<string, RawTopic>();

  if (codeToName.size > 0) {
    for (const [code, name] of codeToName.entries()) {
      const timesAsked = codeMentions.get(code) || 1;
      const marksWeight = detectMarksWeight(text, name);
      const recentScore = detectRecentScore(text, name);
      topicScores.set(name, {
        topic: name,
        topicCode: code,
        frequency: timesAsked,
        timesAsked,
        marksWeight,
        recentScore,
      });
    }
  }

  const wordFreq = extractKeywords(text);
  for (const [topicName, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (topicScores.has(topicName)) continue;
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
      topicScores.set(topicName, {
        topic: topicName,
        topicCode: "",
        frequency: totalFreq,
        timesAsked: totalFreq,
        marksWeight,
        recentScore,
      });
    }
  }

  if (topicScores.size < 3) {
    const unknown = Array.from(wordFreq.entries())
      .filter(([w, f]) => f >= 3 && w.length > 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w, f]) => ({
        topic: w.charAt(0).toUpperCase() + w.slice(1),
        topicCode: "",
        frequency: f,
        timesAsked: f,
        marksWeight: 5,
        recentScore: 0.5,
      }));

    for (const t of unknown) {
      if (!topicScores.has(t.topic)) {
        topicScores.set(t.topic, t);
      }
    }
  }

  return Array.from(topicScores.values()).sort((a, b) => b.frequency - a.frequency).slice(0, 15);
}

export function scoreTopics(raw: RawTopic[], paperCount: number): Array<{
  topic: string;
  topicCode: string;
  frequency: number;
  timesAsked: number;
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
      label = "Skip if short on time";
    }

    return {
      topic: t.topic,
      topicCode: t.topicCode,
      frequency: t.frequency,
      timesAsked: t.timesAsked,
      importancePercent,
      examChancePercent,
      priority,
      label,
      marksWeight: t.marksWeight,
    };
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
    const dayTopics = highPriority.slice(i * chunkSize, (i + 1) * chunkSize).map(t =>
      t.topicCode ? `${t.topic} (${t.topicCode})` : t.topic
    );
    const isLastDay = i === planDays - 1;
    return {
      day: i + 1,
      focus: dayTopics.length > 0 ? dayTopics : ["Review previous topics"],
      goal: isLastDay
        ? "Revise all important topics and practice past questions"
        : `Master ${dayTopics.slice(0, 2).join(" and ")}`,
      timeHours: i === 0 ? 4 : isLastDay ? 3 : 4,
    };
  });
}

export function detectQuestionTypes(text: string): {
  short: number;
  long: number;
  mcq: number;
  numerical: number;
} {
  const lower = text.toLowerCase();

  // MCQ patterns
  const mcqMatches = (lower.match(/\b(a\)|b\)|c\)|d\)|\(a\)|\(b\)|\(c\)|\(d\)|option [abcd]|choose the correct|which of the following|select the)/g) || []).length;

  // Numerical/calculation patterns
  const numericalMatches = (lower.match(/\b(calculate|compute|find the value|determine the|evaluate|solve for|how many|what is the value|derive|show that[\s\S]{0,20}\d|\d+\s*(marks|m)\b)/g) || []).length;

  // Long/essay patterns
  const longMatches = (lower.match(/\b(discuss|critically analyze|explain in detail|elaborate|write an essay|describe the role|assess|compare and contrast|evaluate the impact|to what extent|justify your|what are the implications|examine)/g) || []).length;

  // Short answer patterns  
  const shortMatches = (lower.match(/\b(define|state|list|mention|what is|who is|when did|write a note|briefly explain|give an example|what are the|name the|identify)/g) || []).length;

  // Normalize so they sum to something reasonable
  const total = mcqMatches + numericalMatches + longMatches + shortMatches;
  if (total === 0) {
    return { short: 4, long: 3, mcq: 2, numerical: 1 };
  }

  return {
    short: Math.max(1, shortMatches),
    long: Math.max(1, longMatches),
    mcq: Math.max(0, mcqMatches),
    numerical: Math.max(0, numericalMatches),
  };
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
  if (top[0]) {
    const label = top[0].topicCode
      ? `${top[0].topic} (${top[0].topicCode})`
      : top[0].topic;
    bubbles.push(`🔥 Study THIS first → ${label} asked ${top[0].timesAsked}× times`);
  }
  if (skip[0]) bubbles.push(`⚠️ Skip "${skip[0].topic}" → low marks impact`);
  if (top[0] && top[1]) {
    const t1 = top[0].topicCode || top[0].topic.split(" ")[0];
    const t2 = top[1].topicCode || top[1].topic.split(" ")[0];
    bubbles.push(`🎯 Focus on ${t1} & ${t2}`);
  }
  bubbles.push(`⏳ Your ${topics.length > 0 ? "" : ""}plan is ready`);
  if (overall > 0) bubbles.push(`📊 Exam readiness: ${overall}%`);
  return bubbles;
}
