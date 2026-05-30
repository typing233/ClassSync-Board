const QUOTES = [
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '天行健，君子以自强不息。', author: '《周易》' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
  { text: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈' },
  { text: '少壮不努力，老大徒伤悲。', author: '《长歌行》' },
  { text: '读书破万卷，下笔如有神。', author: '杜甫' },
  { text: '不积跬步，无以至千里。', author: '荀子' },
  { text: '锲而不舍，金石可镂。', author: '荀子' },
  { text: '知之为知之，不知为不知，是知也。', author: '孔子' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '《警世贤文》' },
  { text: '志当存高远。', author: '诸葛亮' },
  { text: '天生我材必有用。', author: '李白' },
  { text: '非淡泊无以明志，非宁静无以致远。', author: '诸葛亮' },
  { text: '海纳百川，有容乃大。', author: '林则徐' },
  { text: '长风破浪会有时，直挂云帆济沧海。', author: '李白' },
  { text: '穷则独善其身，达则兼济天下。', author: '孟子' },
  { text: '人生自古谁无死，留取丹心照汗青。', author: '文天祥' },
  { text: '老骥伏枥，志在千里。', author: '曹操' },
  { text: '世上无难事，只怕有心人。', author: '谚语' },
  { text: '黑发不知勤学早，白首方悔读书迟。', author: '颜真卿' },
  { text: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游' },
  { text: '问渠那得清如许，为有源头活水来。', author: '朱熹' },
  { text: '博观而约取，厚积而薄发。', author: '苏轼' },
  { text: '生于忧患，死于安乐。', author: '孟子' },
  { text: '三人行，必有我师焉。', author: '孔子' },
  { text: '温故而知新，可以为师矣。', author: '孔子' },
  { text: '己所不欲，勿施于人。', author: '孔子' },
  { text: '吾生也有涯，而知也无涯。', author: '庄子' },
  { text: '合抱之木，生于毫末。', author: '老子' }
];

export default class DailyQuotePlugin {
  static id = 'daily-quote';
  static name = '每日一句';

  init() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    this._quote = QUOTES[dayOfYear % QUOTES.length];
  }

  render() {
    return `
      <div class="plugin-quote">
        <div class="plugin-quote__icon">💬</div>
        <div class="plugin-quote__text">${this._quote.text}</div>
        <div class="plugin-quote__author">—— ${this._quote.author}</div>
      </div>`;
  }

  onTick() {}
  destroy() {}
}
