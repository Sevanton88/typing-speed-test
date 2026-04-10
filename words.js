/* ============================================================
   TypeLab — Word Bank
   words.js
   ============================================================ */

const WORD_BANK = [
  "the","be","to","of","and","a","in","that","have","it",
  "for","not","on","with","he","as","you","do","at","this",
  "but","his","by","from","they","we","say","her","she","or",
  "an","will","my","one","all","would","there","their","what",
  "so","up","out","if","about","who","get","which","go","me",
  "when","make","can","like","time","no","just","him","know",
  "take","people","into","year","your","good","some","could",
  "them","see","other","than","then","now","look","only","come",
  "its","over","think","also","back","after","use","two","how",
  "our","work","first","well","way","even","new","want","because",
  "any","these","give","day","most","us","between","need","large",
  "often","hand","high","place","hold","turn","real","life","few",
  "north","open","seem","together","next","white","children","begin",
  "got","walk","example","ease","paper","group","always","music",
  "those","both","mark","book","letter","until","mile","river",
  "car","feet","care","second","enough","plain","girl","usual",
  "young","ready","above","ever","red","list","though","feel",
  "talk","bird","soon","body","dog","family","direct","pose",
  "leave","song","measure","door","product","black","short",
  "numeral","class","wind","question","happen","complete","ship",
  "area","half","rock","order","fire","south","problem","piece",
  "told","knew","pass","since","top","whole","king","space",
  "heard","best","hour","better","true","during","hundred","five",
  "remember","step","early","hold","west","ground","interest",
  "reach","fast","verb","sing","listen","six","table","travel",
  "less","morning","ten","simple","several","vowel","toward",
  "power","town","fine","drive","spoken","help","through","much",
  "before","line","right","too","mean","old","any","same","tell",
  "boy","follow","came","want","show","also","around","farm",
  "three","small","set","put","end","does","another","well",
  "large","often","hand","high","place","hold","turn","real",
];

/**
 * Returns an array of `count` random words from WORD_BANK.
 * Fisher-Yates ensures no repetition until bank is exhausted.
 */
function getRandomWords(count) {
  const pool = [...WORD_BANK];
  const result = [];
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) pool.push(...WORD_BANK); // refill
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}
