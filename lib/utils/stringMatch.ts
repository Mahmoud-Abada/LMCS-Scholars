// src/lib/utils/stringMatch.ts
export function isSimilar(a: string, b: string, threshold = 0.85): boolean {
    if (!a || !b) return false;
    
    // Basic normalization
    const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const str1 = normalize(a);
    const str2 = normalize(b);
  
    // Quick exact match check
    if (str1 === str2) return true;
  
    // Token-based similarity
    const tokens1 = new Set(str1.split(/\s+/));
    const tokens2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
    const union = new Set([...tokens1, ...tokens2]);
    const similarity = intersection.size / union.size;
  
    return similarity >= threshold;
  }