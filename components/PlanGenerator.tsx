"use client";
import { useMemo, useState } from 'react';

type Level = 'beginner' | 'intermediate' | 'advanced';

type GeneratedDay = {
  dayIndex: number;
  focus: string;
  minutes: number;
  reps: string[];
  reviewNotes?: string;
};

type GeneratedPlan = {
  overview: { topic: string; days: number; minutesPerDay: number; level: Level };
  days: GeneratedDay[];
  spacedReviews: { dayOffset: number; intent: string }[];
};

const defaultSubskills: Record<Level, string[]> = {
  beginner: ['Foundations', 'Core concepts', 'Basic exercises', 'Common mistakes', 'Light projects'],
  intermediate: ['Patterns', 'Edge cases', 'Performance', 'Projects', 'Retrospectives'],
  advanced: ['Architecture', 'Trade-offs', 'System limits', 'Original work', 'Teaching others'],
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function distributeFocus(subskills: string[], totalDays: number): string[] {
  const plan: string[] = [];
  for (let d = 0; d < totalDays; d++) {
    plan.push(subskills[d % subskills.length]);
  }
  return plan;
}

function suggestReps(level: Level, minutes: number): string[] {
  const unit = Math.max(1, Math.floor(minutes / 10));
  if (level === 'beginner') return [`${unit}x read + highlight`, `${unit}x recall from memory`, `${unit}x 10-min drills`];
  if (level === 'intermediate') return [`${unit}x targeted drills`, `${unit}x build mini-feature`, `${unit}x error review`];
  return [`${unit}x design doc sketch`, `${unit}x implement+benchmark`, `${unit}x post-mortem notes`];
}

function generatePlan(topic: string, level: Level, minutesPerDay: number, days: number, customSubskills?: string[]): GeneratedPlan {
  const subskills = (customSubskills && customSubskills.length > 0 ? customSubskills : defaultSubskills[level]).map(s => s.trim()).filter(Boolean);
  const focusByDay = distributeFocus(subskills, days);

  const daysPlan: GeneratedDay[] = focusByDay.map((focus, idx) => ({
    dayIndex: idx + 1,
    focus,
    minutes: minutesPerDay,
    reps: suggestReps(level, minutesPerDay),
    reviewNotes: (idx % 2 === 0) ? 'End with 5-min self-quiz.' : 'End with 5-min error log.'
  }));

  const spacedReviews = [1, 3, 7, 14].filter(o => o <= days).map(o => ({ dayOffset: o, intent: `Review weak spots at +${o} days` }));

  return {
    overview: { topic, days, minutesPerDay, level },
    days: daysPlan,
    spacedReviews,
  };
}

export default function PlanGenerator() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<Level>('beginner');
  const [minutesPerDay, setMinutesPerDay] = useState(45);
  const [days, setDays] = useState(14);
  const [subskillsText, setSubskillsText] = useState('');
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [copied, setCopied] = useState(false);

  const customSubskills = useMemo(() => subskillsText.split('\n').map(s => s.trim()).filter(Boolean), [subskillsText]);

  function onGenerate() {
    const topicSafe = topic.trim() || 'Your Topic';
    setPlan(generatePlan(topicSafe, level, minutesPerDay, days, customSubskills));
    setCopied(false);
  }

  function exportText(p: GeneratedPlan): string {
    const header = `Plan: ${p.overview.topic} (Level: ${p.overview.level})\nDays: ${p.overview.days} | ${p.overview.minutesPerDay} min/day`;
    const lines = [header, ''.padEnd(32, '-')];
    for (const d of p.days) {
      lines.push(`Day ${d.dayIndex}: ${d.focus} ? ${d.minutes} min`);
      for (const r of d.reps) lines.push(`  - ${r}`);
      if (d.reviewNotes) lines.push(`  Note: ${d.reviewNotes}`);
    }
    if (p.spacedReviews.length) {
      lines.push('\nSpaced Reviews:');
      for (const r of p.spacedReviews) lines.push(`  +${r.dayOffset}d ? ${r.intent}`);
    }
    return lines.join('\n');
  }

  async function copyPlan() {
    if (!plan) return;
    const text = exportText(plan);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadPlan() {
    if (!plan) return;
    const blob = new Blob([exportText(plan)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-${plan.overview.topic.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="panel">
      <h2 style={{marginTop: 0}}>Personalized Plan Generator</h2>
      <div className="grid">
        <div>
          <div className="label">Topic</div>
          <input className="input" placeholder="e.g., TypeScript, Piano, Statistics" value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <div>
          <div className="label">Level</div>
          <select className="select" value={level} onChange={e => setLevel(e.target.value as Level)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <div className="label">Minutes per day</div>
          <input className="input" type="number" min={15} max={180} step={5} value={minutesPerDay} onChange={e => setMinutesPerDay(parseInt(e.target.value || '0', 10))} />
        </div>
        <div>
          <div className="label">Total days</div>
          <input className="input" type="number" min={3} max={60} step={1} value={days} onChange={e => setDays(parseInt(e.target.value || '0', 10))} />
        </div>
      </div>

      <div style={{marginTop:12}}>
        <div className="label">Optional: Custom sub-skills (one per line)</div>
        <textarea className="input" rows={5} placeholder={'e.g.\nFoundations\nCore concepts\nProjects'} value={subskillsText} onChange={e => setSubskillsText(e.target.value)} />
        <div className="small">If left empty, sensible defaults are used for each level.</div>
      </div>

      <div className="row" style={{marginTop: 14}}>
        <button className="button" onClick={onGenerate}>Generate plan</button>
        <button className="button secondary" onClick={() => { setTopic('TypeScript'); setLevel('beginner'); setMinutesPerDay(45); setDays(14); setSubskillsText('Foundations\nTypes\nFunctions\nGenerics\nProjects'); }}>Use example</button>
      </div>

      {plan && (
        <div className="plan">
          <div className="kv">
            <div>
              <strong>{plan.overview.topic}</strong>
              <div className="small">{plan.overview.days} days ? {plan.overview.minutesPerDay} min/day ? {plan.overview.level}</div>
            </div>
            <div className="row">
              <button className="button secondary" onClick={copyPlan}>{copied ? 'Copied!' : 'Copy'}</button>
              <button className="button" onClick={downloadPlan}>Download</button>
            </div>
          </div>

          <ol style={{marginTop:12, paddingLeft: 18}}>
            {plan.days.map(d => (
              <li key={d.dayIndex} style={{marginBottom:10}}>
                <div><strong>Day {d.dayIndex}</strong>: {d.focus} <span className="badge">{d.minutes} min</span></div>
                <ul style={{margin: '6px 0 0 18px'}}>
                  {d.reps.map((r, i) => (<li key={i}>{r}</li>))}
                </ul>
                {d.reviewNotes && <div className="small" style={{marginTop:6}}>{d.reviewNotes}</div>}
              </li>
            ))}
          </ol>

          {plan.spacedReviews.length > 0 && (
            <div className="card" style={{marginTop:12}}>
              <h3 style={{marginTop:0}}>Spaced Review Schedule</h3>
              <div className="small">Add quick reviews on these days to lock in memory:</div>
              <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
                {plan.spacedReviews.map(r => (
                  <span key={r.dayOffset} className="badge" style={{background:'#60a5fa', color:'#041018'}}>+{r.dayOffset}d</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
