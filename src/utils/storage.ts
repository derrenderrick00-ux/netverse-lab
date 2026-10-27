import {createTwoPcLab, validateProject} from '../engine/model';
import type {NetworkProject} from '../engine/model';

const PROJECT_KEY = 'netverse.v1.project';
const LESSON_KEY = 'netverse.v1.lessonProgress';
export type Progress = Record<string, {step: number; completed: boolean; quizCorrect?: boolean}>;
export function loadProject(): NetworkProject {
  try { const raw = localStorage.getItem(PROJECT_KEY); if (raw) {const data: unknown = JSON.parse(raw); if (validateProject(data)) return data;}} catch { /* corrupted saves are ignored */ }
  return createTwoPcLab();
}
export function saveProject(p: NetworkProject): boolean {
  try {localStorage.setItem(PROJECT_KEY, JSON.stringify(p)); return true;} catch {return false;}
}
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(LESSON_KEY);
    const value: unknown = raw ? JSON.parse(raw) : {};
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Progress;
  } catch { /* ignored */ }
  return {};
}
export function saveProgress(progress: Progress): boolean {
  try {localStorage.setItem(LESSON_KEY, JSON.stringify(progress)); return true;} catch {return false;}
}
export function exportJson(p: NetworkProject): string {return JSON.stringify(p, null, 2);}
export function importJson(text: string): NetworkProject {
  let obj: unknown;
  try {obj = JSON.parse(text);} catch {throw Error('Invalid JSON.');}
  if (!validateProject(obj)) throw Error('Invalid NETVERSE project schema (v1).');
  return obj;
}
