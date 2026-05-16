import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

let sensitiveWordsCache: { word: string; replacement: string }[] = [];

// 加载敏感词列表
async function loadSensitiveWords() {
  try {
    const [rows] = await pool.execute(
      'SELECT word, replacement FROM sensitive_words WHERE is_active = TRUE'
    );
    sensitiveWordsCache = (rows as any[]).map(row => ({
      word: row.word,
      replacement: row.replacement || '***'
    }));
  } catch (error) {
    console.error('Failed to load sensitive words:', error);
  }
}

// 定期刷新敏感词列表
setInterval(loadSensitiveWords, 60000); // 每分钟刷新
loadSensitiveWords(); // 启动时加载

export function sensitiveWordFilter(text: string): string {
  if (!text) return text;
  
  let filteredText = text;
  
  for (const { word, replacement } of sensitiveWordsCache) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    filteredText = filteredText.replace(regex, replacement);
  }
  
  return filteredText;
}

export function checkSensitiveWords(text: string): { hasSensitive: boolean; words: string[] } {
  if (!text) return { hasSensitive: false, words: [] };
  
  const foundWords: string[] = [];
  
  for (const { word } of sensitiveWordsCache) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (regex.test(text)) {
      foundWords.push(word);
    }
  }
  
  return {
    hasSensitive: foundWords.length > 0,
    words: foundWords
  };
}

export function sensitiveWordMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body.content) {
    req.body.content = sensitiveWordFilter(req.body.content);
  }
  if (req.body.title) {
    req.body.title = sensitiveWordFilter(req.body.title);
  }
  next();
}
