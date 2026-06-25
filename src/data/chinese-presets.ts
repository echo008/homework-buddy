import type { PresetUnit } from './types'

export const DEFAULT_CN_PRESETS: PresetUnit[] = [
  {
    id: 'cn-default-p1-u1',
    name: '一年级上册 识字1 天地人',
    subject: 'chinese',
    grade: 'primary1',
    textbook: '基础识字',
    words: [
      { word: '天', meaning: '天空', phonetic: 'tiān' },
      { word: '地', meaning: '大地', phonetic: 'dì' },
      { word: '人', meaning: '人类', phonetic: 'rén' },
      { word: '你', meaning: '第二人称', phonetic: 'nǐ' },
      { word: '我', meaning: '第一人称', phonetic: 'wǒ' },
      { word: '他', meaning: '第三人称', phonetic: 'tā' },
      { word: '一', meaning: '数字', phonetic: 'yī' },
      { word: '二', meaning: '数字', phonetic: 'èr' },
      { word: '三', meaning: '数字', phonetic: 'sān' },
      { word: '四', meaning: '数字', phonetic: 'sì' },
      { word: '五', meaning: '数字', phonetic: 'wǔ' },
      { word: '六', meaning: '数字', phonetic: 'liù' },
      { word: '七', meaning: '数字', phonetic: 'qī' },
      { word: '八', meaning: '数字', phonetic: 'bā' },
      { word: '九', meaning: '数字', phonetic: 'jiǔ' },
      { word: '十', meaning: '数字', phonetic: 'shí' },
      { word: '口', meaning: '嘴巴', phonetic: 'kǒu' },
      { word: '耳', meaning: '耳朵', phonetic: 'ěr' },
      { word: '目', meaning: '眼睛', phonetic: 'mù' },
      { word: '手', meaning: '手掌', phonetic: 'shǒu' },
      { word: '足', meaning: '脚', phonetic: 'zú' },
      { word: '日', meaning: '太阳', phonetic: 'rì' },
      { word: '月', meaning: '月亮', phonetic: 'yuè' },
      { word: '水', meaning: '水流', phonetic: 'shuǐ' },
      { word: '火', meaning: '火焰', phonetic: 'huǒ' },
      { word: '山', meaning: '山峰', phonetic: 'shān' },
      { word: '石', meaning: '石头', phonetic: 'shí' }
    ]
  }
]

const createBubdPrimaryUnit = (grade: number, unit: number, name: string, words: { word: string; meaning: string; phonetic: string }[]): PresetUnit => ({
  id: `cn-bubd-p${grade}-u${unit}`,
  name: `${['一', '二', '三', '四', '五', '六'][grade - 1]}年级上册 ${name}`,
  subject: 'chinese',
  grade: `primary${grade}` as const,
  textbook: '人教部编版',
  words
})

export const BUBD_CN_PRESETS: PresetUnit[] = [
  createBubdPrimaryUnit(1, 1, '识字1 天地人', [
    { word: '天', meaning: '天空', phonetic: 'tiān' }, { word: '地', meaning: '大地', phonetic: 'dì' }, { word: '人', meaning: '人类', phonetic: 'rén' },
    { word: '你', meaning: '第二人称', phonetic: 'nǐ' }, { word: '我', meaning: '第一人称', phonetic: 'wǒ' }, { word: '他', meaning: '第三人称', phonetic: 'tā' },
    { word: '一', meaning: '数字', phonetic: 'yī' }, { word: '二', meaning: '数字', phonetic: 'èr' }, { word: '三', meaning: '数字', phonetic: 'sān' },
    { word: '四', meaning: '数字', phonetic: 'sì' }, { word: '五', meaning: '数字', phonetic: 'wǔ' }, { word: '口', meaning: '嘴巴', phonetic: 'kǒu' },
    { word: '耳', meaning: '耳朵', phonetic: 'ěr' }, { word: '目', meaning: '眼睛', phonetic: 'mù' }, { word: '手', meaning: '手掌', phonetic: 'shǒu' },
    { word: '足', meaning: '脚', phonetic: 'zú' }, { word: '日', meaning: '太阳', phonetic: 'rì' }, { word: '月', meaning: '月亮', phonetic: 'yuè' }
  ]),
  createBubdPrimaryUnit(1, 2, '识字2 金木水火土', [
    { word: '金', meaning: '金属', phonetic: 'jīn' }, { word: '木', meaning: '树木', phonetic: 'mù' }, { word: '水', meaning: '水流', phonetic: 'shuǐ' },
    { word: '火', meaning: '火焰', phonetic: 'huǒ' }, { word: '土', meaning: '泥土', phonetic: 'tǔ' }, { word: '上', meaning: '方位', phonetic: 'shàng' },
    { word: '下', meaning: '方位', phonetic: 'xià' }, { word: '日', meaning: '太阳', phonetic: 'rì' }, { word: '月', meaning: '月亮', phonetic: 'yuè' },
    { word: '山', meaning: '山峰', phonetic: 'shān' }, { word: '石', meaning: '石头', phonetic: 'shí' }, { word: '田', meaning: '田地', phonetic: 'tián' },
    { word: '禾', meaning: '禾苗', phonetic: 'hé' }, { word: '对', meaning: '正确', phonetic: 'duì' }, { word: '云', meaning: '云朵', phonetic: 'yún' },
    { word: '雨', meaning: '雨水', phonetic: 'yǔ' }, { word: '风', meaning: '刮风', phonetic: 'fēng' }, { word: '花', meaning: '花朵', phonetic: 'huā' }
  ]),
  createBubdPrimaryUnit(1, 3, '汉语拼音', [
    { word: '爸', meaning: '父亲', phonetic: 'bà' }, { word: '妈', meaning: '母亲', phonetic: 'mā' }, { word: '大', meaning: '大', phonetic: 'dà' },
    { word: '小', meaning: '小', phonetic: 'xiǎo' }, { word: '米', meaning: '大米', phonetic: 'mǐ' }, { word: '马', meaning: '马匹', phonetic: 'mǎ' },
    { word: '不', meaning: '否定', phonetic: 'bù' }, { word: '画', meaning: '绘画', phonetic: 'huà' }, { word: '打', meaning: '击打', phonetic: 'dǎ' },
    { word: '棋', meaning: '棋子', phonetic: 'qí' }, { word: '鸡', meaning: '小鸡', phonetic: 'jī' }, { word: '字', meaning: '文字', phonetic: 'zì' },
    { word: '词', meaning: '词语', phonetic: 'cí' }, { word: '语', meaning: '语言', phonetic: 'yǔ' }, { word: '句', meaning: '句子', phonetic: 'jù' },
    { word: '子', meaning: '助词', phonetic: 'zi' }, { word: '桌', meaning: '桌子', phonetic: 'zhuō' }, { word: '纸', meaning: '纸张', phonetic: 'zhǐ' }
  ]),
  createBubdPrimaryUnit(1, 4, '课文1 秋天', [
    { word: '秋', meaning: '秋天', phonetic: 'qiū' }, { word: '气', meaning: '天气', phonetic: 'qì' }, { word: '了', meaning: '助词', phonetic: 'le' },
    { word: '树', meaning: '树木', phonetic: 'shù' }, { word: '叶', meaning: '树叶', phonetic: 'yè' }, { word: '片', meaning: '一片', phonetic: 'piàn' },
    { word: '飞', meaning: '飞翔', phonetic: 'fēi' }, { word: '会', meaning: '能够', phonetic: 'huì' }, { word: '个', meaning: '量词', phonetic: 'gè' },
    { word: '的', meaning: '助词', phonetic: 'de' }, { word: '船', meaning: '小船', phonetic: 'chuán' }, { word: '两', meaning: '数字', phonetic: 'liǎng' },
    { word: '头', meaning: '头部', phonetic: 'tóu' }, { word: '在', meaning: '存在', phonetic: 'zài' }, { word: '里', meaning: '里面', phonetic: 'lǐ' },
    { word: '看', meaning: '看见', phonetic: 'kàn' }, { word: '见', meaning: '见到', phonetic: 'jiàn' }, { word: '闪', meaning: '闪亮', phonetic: 'shǎn' }
  ]),
  createBubdPrimaryUnit(1, 5, '课文2 小小的船', [
    { word: '弯', meaning: '弯曲', phonetic: 'wān' }, { word: '的', meaning: '助词', phonetic: 'de' }, { word: '儿', meaning: '儿化', phonetic: 'ér' },
    { word: '月', meaning: '月亮', phonetic: 'yuè' }, { word: '头', meaning: '头部', phonetic: 'tóu' }, { word: '上', meaning: '上面', phonetic: 'shàng' },
    { word: '我', meaning: '自己', phonetic: 'wǒ' }, { word: '在', meaning: '在', phonetic: 'zài' }, { word: '小', meaning: '小的', phonetic: 'xiǎo' },
    { word: '船', meaning: '船', phonetic: 'chuán' }, { word: '里', meaning: '里面', phonetic: 'lǐ' }, { word: '坐', meaning: '坐下', phonetic: 'zuò' },
    { word: '只', meaning: '只有', phonetic: 'zhǐ' }, { word: '看', meaning: '看见', phonetic: 'kàn' }, { word: '见', meaning: '见到', phonetic: 'jiàn' },
    { word: '闪', meaning: '闪烁', phonetic: 'shǎn' }, { word: '星', meaning: '星星', phonetic: 'xīng' }, { word: '蓝', meaning: '蓝色', phonetic: 'lán' }
  ]),
  createBubdPrimaryUnit(1, 6, '课文3 江南', [
    { word: '江', meaning: '江河', phonetic: 'jiāng' }, { word: '南', meaning: '南方', phonetic: 'nán' }, { word: '可', meaning: '可以', phonetic: 'kě' },
    { word: '采', meaning: '采摘', phonetic: 'cǎi' }, { word: '莲', meaning: '莲花', phonetic: 'lián' }, { word: '叶', meaning: '叶子', phonetic: 'yè' },
    { word: '何', meaning: '多么', phonetic: 'hé' }, { word: '田', meaning: '田地', phonetic: 'tián' }, { word: '鱼', meaning: '鱼儿', phonetic: 'yú' },
    { word: '戏', meaning: '游戏', phonetic: 'xì' }, { word: '间', meaning: '之间', phonetic: 'jiān' }, { word: '东', meaning: '东方', phonetic: 'dōng' },
    { word: '西', meaning: '西方', phonetic: 'xī' }, { word: '北', meaning: '北方', phonetic: 'běi' }, { word: '南', meaning: '南方', phonetic: 'nán' },
    { word: '北', meaning: '北方', phonetic: 'běi' }, { word: '湖', meaning: '湖泊', phonetic: 'hú' }, { word: '水', meaning: '水流', phonetic: 'shuǐ' }
  ]),
  createBubdPrimaryUnit(1, 7, '课文4 四季', [
    { word: '草', meaning: '小草', phonetic: 'cǎo' }, { word: '芽', meaning: '发芽', phonetic: 'yá' }, { word: '尖', meaning: '尖锐', phonetic: 'jiān' },
    { word: '他', meaning: '他', phonetic: 'tā' }, { word: '对', meaning: '对', phonetic: 'duì' }, { word: '小', meaning: '小', phonetic: 'xiǎo' },
    { word: '鸟', meaning: '小鸟', phonetic: 'niǎo' }, { word: '说', meaning: '说话', phonetic: 'shuō' }, { word: '我', meaning: '我', phonetic: 'wǒ' },
    { word: '是', meaning: '是', phonetic: 'shì' }, { word: '春', meaning: '春天', phonetic: 'chūn' }, { word: '天', meaning: '天', phonetic: 'tiān' },
    { word: '荷', meaning: '荷花', phonetic: 'hé' }, { word: '叶', meaning: '叶', phonetic: 'yè' }, { word: '圆', meaning: '圆形', phonetic: 'yuán' },
    { word: '青', meaning: '青色', phonetic: 'qīng' }, { word: '蛙', meaning: '青蛙', phonetic: 'wā' }, { word: '夏', meaning: '夏天', phonetic: 'xià' }
  ]),
  createBubdPrimaryUnit(1, 8, '课文5 影子', [
    { word: '影', meaning: '影子', phonetic: 'yǐng' }, { word: '子', meaning: '子', phonetic: 'zi' }, { word: '在', meaning: '在', phonetic: 'zài' },
    { word: '前', meaning: '前面', phonetic: 'qián' }, { word: '后', meaning: '后面', phonetic: 'hòu' }, { word: '常', meaning: '常常', phonetic: 'cháng' },
    { word: '跟', meaning: '跟着', phonetic: 'gēn' }, { word: '着', meaning: '着', phonetic: 'zhe' }, { word: '我', meaning: '我', phonetic: 'wǒ' },
    { word: '就', meaning: '就是', phonetic: 'jiù' }, { word: '像', meaning: '好像', phonetic: 'xiàng' }, { word: '一', meaning: '一', phonetic: 'yī' },
    { word: '条', meaning: '一条', phonetic: 'tiáo' }, { word: '小', meaning: '小', phonetic: 'xiǎo' }, { word: '黑', meaning: '黑色', phonetic: 'hēi' },
    { word: '狗', meaning: '小狗', phonetic: 'gǒu' }, { word: '它', meaning: '它', phonetic: 'tā' }, { word: '好', meaning: '好', phonetic: 'hǎo' }
  ]),
  ...[2, 3, 4, 5, 6].flatMap(grade =>
    Array.from({ length: 8 }, (_, i) => {
      const unit = i + 1
      const gradeNames = ['一', '二', '三', '四', '五', '六']
      const wordSets: Record<number, { word: string; meaning: string; phonetic: string }[]> = {
        2: [
          { word: '池塘', meaning: '水坑', phonetic: 'chí táng' }, { word: '脑袋', meaning: '头', phonetic: 'nǎo dai' }, { word: '灰色', meaning: '颜色', phonetic: 'huī sè' },
          { word: '捕捉', meaning: '抓', phonetic: 'bǔ zhuō' }, { word: '迎接', meaning: '接', phonetic: 'yíng jiē' }, { word: '阿姨', meaning: '称呼', phonetic: 'ā yí' },
          { word: '宽阔', meaning: '宽', phonetic: 'kuān kuò' }, { word: '乌龟', meaning: '动物', phonetic: 'wū guī' }, { word: '头顶', meaning: '头上方', phonetic: 'tóu dǐng' },
          { word: '披着', meaning: '盖着', phonetic: 'pī zhe' }, { word: '眼睛', meaning: '视觉器官', phonetic: 'yǎn jing' }, { word: '肚皮', meaning: '腹部', phonetic: 'dù pí' },
          { word: '雪白', meaning: '白色', phonetic: 'xuě bái' }, { word: '变化', meaning: '改变', phonetic: 'biàn huà' }, { word: '傍晚', meaning: '黄昏', phonetic: 'bàng wǎn' },
          { word: '海洋', meaning: '大海', phonetic: 'hǎi yáng' }, { word: '工作', meaning: '劳动', phonetic: 'gōng zuò' }, { word: '灾害', meaning: '灾难', phonetic: 'zāi hài' }
        ],
        3: [
          { word: '早晨', meaning: '清晨', phonetic: 'zǎo chén' }, { word: '绒毛', meaning: '软毛', phonetic: 'róng máo' }, { word: '汉族', meaning: '民族', phonetic: 'hàn zú' },
          { word: '鲜艳', meaning: '艳丽', phonetic: 'xiān yàn' }, { word: '服装', meaning: '衣服', phonetic: 'fú zhuāng' }, { word: '打扮', meaning: '装扮', phonetic: 'dǎ bàn' },
          { word: '读书', meaning: '阅读', phonetic: 'dú shū' }, { word: '安静', meaning: '寂静', phonetic: 'ān jìng' }, { word: '停止', meaning: '停下', phonetic: 'tíng zhǐ' },
          { word: '粗壮', meaning: '粗大', phonetic: 'cū zhuàng' }, { word: '影子', meaning: '阴影', phonetic: 'yǐng zi' }, { word: '坪坝', meaning: '平地', phonetic: 'píng bà' },
          { word: '飘扬', meaning: '飘动', phonetic: 'piāo yáng' }, { word: '摔跤', meaning: '运动', phonetic: 'shuāi jiāo' }, { word: '落下', meaning: '掉落', phonetic: 'luò xià' },
          { word: '荒野', meaning: '野外', phonetic: 'huāng yě' }, { word: '跳舞', meaning: '舞蹈', phonetic: 'tiào wǔ' }, { word: '狂欢', meaning: '欢乐', phonetic: 'kuáng huān' }
        ],
        4: [
          { word: '潮水', meaning: '潮汐', phonetic: 'cháo shuǐ' }, { word: '根据', meaning: '依据', phonetic: 'gēn jù' }, { word: '大堤', meaning: '堤坝', phonetic: 'dà dī' },
          { word: '宽阔', meaning: '广阔', phonetic: 'kuān kuò' }, { word: '盼望', meaning: '希望', phonetic: 'pàn wàng' }, { word: '滚动', meaning: '转动', phonetic: 'gǔn dòng' },
          { word: '顿时', meaning: '立刻', phonetic: 'dùn shí' }, { word: '逐渐', meaning: '渐渐', phonetic: 'zhú jiàn' }, { word: '犹如', meaning: '好像', phonetic: 'yóu rú' },
          { word: '崩塌', meaning: '倒塌', phonetic: 'bēng tā' }, { word: '震动', meaning: '颤动', phonetic: 'zhèn dòng' }, { word: '霎时', meaning: '瞬间', phonetic: 'shà shí' },
          { word: '剩余', meaning: '剩下', phonetic: 'shèng yú' }, { word: '淘气', meaning: '顽皮', phonetic: 'táo qì' }, { word: '白鹅', meaning: '鹅', phonetic: 'bái é' },
          { word: '鹅卵石', meaning: '小圆石', phonetic: 'é luǎn shí' }, { word: '庄稼', meaning: '农作物', phonetic: 'zhuāng jia' }, { word: '风俗', meaning: '习俗', phonetic: 'fēng sú' }
        ],
        5: [
          { word: '适宜', meaning: '合适', phonetic: 'shì yí' }, { word: '仙鹤', meaning: '鹤', phonetic: 'xiān hè' }, { word: '嫌弃', meaning: '厌恶', phonetic: 'xián qì' },
          { word: '朱红', meaning: '红色', phonetic: 'zhū hóng' }, { word: '镶嵌', meaning: '嵌入', phonetic: 'xiāng qiàn' }, { word: '镜框', meaning: '框', phonetic: 'jìng kuàng' },
          { word: '嗜好', meaning: '爱好', phonetic: 'shì hào' }, { word: '口哨', meaning: '哨子', phonetic: 'kǒu shào' }, { word: '恩惠', meaning: '恩泽', phonetic: 'ēn huì' },
          { word: '韵味', meaning: '情趣', phonetic: 'yùn wèi' }, { word: '精巧', meaning: '精致', phonetic: 'jīng qiǎo' }, { word: '配合', meaning: '搭配', phonetic: 'pèi hé' },
          { word: '汛期', meaning: '水期', phonetic: 'xùn qī' }, { word: '访问', meaning: '拜访', phonetic: 'fǎng wèn' }, { word: '鞋子', meaning: '鞋', phonetic: 'xié zi' },
          { word: '间隔', meaning: '距离', phonetic: 'jiàn gé' }, { word: '懒惰', meaning: '懒', phonetic: 'lǎn duò' }, { word: '平衡', meaning: '平稳', phonetic: 'píng héng' }
        ],
        6: [
          { word: '毛毯', meaning: '毯子', phonetic: 'máo tǎn' }, { word: '陈列', meaning: '摆放', phonetic: 'chén liè' }, { word: '衣裳', meaning: '衣服', phonetic: 'yī shang' },
          { word: '彩虹', meaning: '虹', phonetic: 'cǎi hóng' }, { word: '马蹄', meaning: '蹄', phonetic: 'mǎ tí' }, { word: '豆腐', meaning: '食品', phonetic: 'dòu fu' },
          { word: '稍微', meaning: '略微', phonetic: 'shāo wēi' }, { word: '微笑', meaning: '笑', phonetic: 'wēi xiào' }, { word: '悬崖', meaning: '崖', phonetic: 'xuán yá' },
          { word: '渡河', meaning: '过河', phonetic: 'dù hé' }, { word: '铁索', meaning: '铁链', phonetic: 'tiě suǒ' }, { word: '磅礴', meaning: '盛大', phonetic: 'páng bó' },
          { word: '逶迤', meaning: '曲折', phonetic: 'wēi yí' }, { word: '岷山', meaning: '山名', phonetic: 'mín shān' }, { word: '豁口', meaning: '缺口', phonetic: 'huō kǒu' },
          { word: '疙瘩', meaning: '硬块', phonetic: 'gē da' }, { word: '棍子', meaning: '棍', phonetic: 'gùn zi' }, { word: '咆哮', meaning: '怒吼', phonetic: 'páo xiào' }
        ]
      }
      return createBubdPrimaryUnit(grade, unit, `第${unit}单元`, wordSets[grade] || wordSets[2])
    })
  ),
  ...[1, 2, 3].flatMap(junior =>
    Array.from({ length: 6 }, (_, i) => {
      const unit = i + 1
      const gradeNum = junior + 6
      const juniorNames = ['初一', '初二', '初三']
      const wordsByGrade = [
        [
          { word: '朗润', meaning: '明亮滋润', phonetic: 'lǎng rùn' }, { word: '酝酿', meaning: '准备', phonetic: 'yùn niàng' }, { word: '卖弄', meaning: '炫耀', phonetic: 'mài nong' },
          { word: '婉转', meaning: '动听', phonetic: 'wǎn zhuǎn' }, { word: '嘹亮', meaning: '响亮', phonetic: 'liáo liàng' }, { word: '黄晕', meaning: '昏黄', phonetic: 'huáng yùn' },
          { word: '瘫痪', meaning: '不能动', phonetic: 'tān huàn' }, { word: '暴怒', meaning: '大怒', phonetic: 'bào nù' }, { word: '沉寂', meaning: '寂静', phonetic: 'chén jì' },
          { word: '侍弄', meaning: '照料', phonetic: 'shì nòng' }, { word: '憔悴', meaning: '瘦弱', phonetic: 'qiáo cuì' }, { word: '央求', meaning: '恳求', phonetic: 'yāng qiú' },
          { word: '温故知新', meaning: '温习旧知识', phonetic: 'wēn gù zhī xīn' }, { word: '派遣', meaning: '派去', phonetic: 'pài qiǎn' }, { word: '狭隘', meaning: '不宽广', phonetic: 'xiá ài' },
          { word: '热忱', meaning: '热情', phonetic: 'rè chén' }, { word: '狼', meaning: '动物', phonetic: 'láng' }, { word: '炫耀', meaning: '夸耀', phonetic: 'xuàn yào' }
        ],
        [
          { word: '溃退', meaning: '败退', phonetic: 'kuì tuì' }, { word: '泄气', meaning: '没信心', phonetic: 'xiè qì' }, { word: '督战', meaning: '监督作战', phonetic: 'dū zhàn' },
          { word: '要塞', meaning: '据点', phonetic: 'yào sài' }, { word: '业已', meaning: '已经', phonetic: 'yè yǐ' }, { word: '绯红', meaning: '鲜红', phonetic: 'fēi hóng' },
          { word: '不逊', meaning: '无礼', phonetic: 'bù xùn' }, { word: '诘责', meaning: '责问', phonetic: 'jié zé' }, { word: '匿名', meaning: '不署名', phonetic: 'nì míng' },
          { word: '曦', meaning: '日光', phonetic: 'xī' }, { word: '襄', meaning: '漫上', phonetic: 'xiāng' }, { word: '沿溯', meaning: '顺逆流', phonetic: 'yán sù' },
          { word: '交卸', meaning: '卸职', phonetic: 'jiāo xiè' }, { word: '狼藉', meaning: '杂乱', phonetic: 'láng jí' }, { word: '簌簌', meaning: '纷纷落下', phonetic: 'sù sù' },
          { word: '踌躇', meaning: '犹豫', phonetic: 'chóu chú' }, { word: '蹒跚', meaning: '走路不稳', phonetic: 'pán shān' }, { word: '雄跨', meaning: '跨越', phonetic: 'xióng kuà' }
        ],
        [
          { word: '妖娆', meaning: '娇艳', phonetic: 'yāo ráo' }, { word: '风骚', meaning: '文学', phonetic: 'fēng sāo' }, { word: '旁骛', meaning: '分心', phonetic: 'páng wù' },
          { word: '亵渎', meaning: '轻慢', phonetic: 'xiè dú' }, { word: '谪守', meaning: '贬官', phonetic: 'zhé shǒu' }, { word: '浩浩汤汤', meaning: '水大', phonetic: 'hào hào shāng shāng' },
          { word: '心旷神怡', meaning: '心情舒畅', phonetic: 'xīn kuàng shén yí' }, { word: '伛偻提携', meaning: '老少行人', phonetic: 'yǔ lǚ tí xié' },
          { word: '觥筹交错', meaning: '宴饮热闹', phonetic: 'gōng chóu jiāo cuò' }, { word: '嗔', meaning: '生气', phonetic: 'chēn' }, { word: '干系', meaning: '责任', phonetic: 'gān xì' },
          { word: '聒噪', meaning: '打扰', phonetic: 'guō zào' }, { word: '腆', meaning: '挺着', phonetic: 'tiǎn' }, { word: '桑梓', meaning: '家乡', phonetic: 'sāng zǐ' },
          { word: '侥幸', meaning: '幸运', phonetic: 'jiǎo xìng' }, { word: '不省人事', meaning: '昏迷', phonetic: 'bù xǐng rén shì' }, { word: '断章取义', meaning: '截取片段', phonetic: 'duàn zhāng qǔ yì' }
        ]
      ]
      return {
        id: `cn-bubd-j${junior}-u${unit}`,
        name: `${juniorNames[junior - 1]}（七年级）上册 第${unit}单元`,
        subject: 'chinese' as const,
        grade: `junior${junior}` as const,
        textbook: '人教部编版',
        words: wordsByGrade[junior - 1]
      }
    })
  )
]

const createOtherVersionPrimaryUnit = (version: string, grade: number, unit: number, textbook: string, namePrefix: string, words: { word: string; meaning: string; phonetic: string }[]): PresetUnit => {
  const gradeNames = ['一', '二', '三', '四', '五', '六']
  return {
    id: `cn-${version}-p${grade}-u${unit}`,
    name: `${gradeNames[grade - 1]}年级 ${namePrefix}${unit}`,
    subject: 'chinese',
    grade: `primary${grade}` as const,
    textbook,
    words
  }
}

const generatePrimaryUnits = (version: string, textbook: string, unitsPerGrade: number, wordTemplate: (g: number, u: number) => { word: string; meaning: string; phonetic: string }[]): PresetUnit[] =>
  [1, 2, 3, 4, 5, 6].flatMap(grade =>
    Array.from({ length: unitsPerGrade }, (_, i) => {
      const unit = i + 1
      return createOtherVersionPrimaryUnit(version, grade, unit, textbook, '第', wordTemplate(grade, unit))
    })
  )

export const SU_CN_PRESETS: PresetUnit[] = generatePrimaryUnits('su', '苏教版', 6, (g, u) => [
  { word: '拼音', meaning: '音标', phonetic: 'pīn yīn' }, { word: '识字', meaning: '认字', phonetic: 'shí zì' }, { word: '课文', meaning: '文章', phonetic: 'kè wén' },
  { word: '练习', meaning: '训练', phonetic: 'liàn xí' }, { word: '学习', meaning: '学', phonetic: 'xué xí' }, { word: '同学', meaning: '同班同学', phonetic: 'tóng xué' },
  { word: '老师', meaning: '教师', phonetic: 'lǎo shī' }, { word: '学校', meaning: '校园', phonetic: 'xué xiào' }, { word: '语文', meaning: '学科', phonetic: 'yǔ wén' },
  { word: '数学', meaning: '学科', phonetic: 'shù xué' }, { word: '读书', meaning: '阅读', phonetic: 'dú shū' }, { word: '写字', meaning: '书写', phonetic: 'xiě zì' },
  { word: '说话', meaning: '讲话', phonetic: 'shuō huà' }, { word: '故事', meaning: '小故事', phonetic: 'gù shì' }, { word: '儿歌', meaning: '儿童歌曲', phonetic: 'ér gē' },
  { word: '春天', meaning: '春季', phonetic: 'chūn tiān' }, { word: '夏天', meaning: '夏季', phonetic: 'xià tiān' }, { word: '秋天', meaning: '秋季', phonetic: 'qiū tiān' }
])

export const BSD_CN_PRESETS: PresetUnit[] = generatePrimaryUnits('bsd', '北师大版', 5, (g, u) => [
  { word: '数字', meaning: '数', phonetic: 'shù zì' }, { word: '家园', meaning: '家', phonetic: 'jiā yuán' }, { word: '身体', meaning: '人体', phonetic: 'shēn tǐ' },
  { word: '动物', meaning: '生物', phonetic: 'dòng wù' }, { word: '植物', meaning: '生物', phonetic: 'zhí wù' }, { word: '颜色', meaning: '色彩', phonetic: 'yán sè' },
  { word: '大小', meaning: '尺寸', phonetic: 'dà xiǎo' }, { word: '多少', meaning: '数量', phonetic: 'duō shǎo' }, { word: '上下', meaning: '方位', phonetic: 'shàng xià' },
  { word: '前后', meaning: '方位', phonetic: 'qián hòu' }, { word: '左右', meaning: '方位', phonetic: 'zuǒ yòu' }, { word: '东西', meaning: '物品', phonetic: 'dōng xī' },
  { word: '南北', meaning: '方向', phonetic: 'nán běi' }, { word: '太阳', meaning: '日', phonetic: 'tài yáng' }, { word: '月亮', meaning: '月', phonetic: 'yuè liang' },
  { word: '星星', meaning: '星', phonetic: 'xīng xing' }, { word: '云朵', meaning: '云', phonetic: 'yún duǒ' }, { word: '风雨', meaning: '天气', phonetic: 'fēng yǔ' }
])

export const HEB_CN_PRESETS: PresetUnit[] = generatePrimaryUnits('heb', '冀教版', 4, (g, u) => [
  { word: '入学', meaning: '上学', phonetic: 'rù xué' }, { word: '教育', meaning: '教', phonetic: 'jiào yù' }, { word: '儿童', meaning: '孩子', phonetic: 'ér tóng' },
  { word: '成长', meaning: '长大', phonetic: 'chéng zhǎng' }, { word: '快乐', meaning: '开心', phonetic: 'kuài lè' }, { word: '幸福', meaning: '美好', phonetic: 'xìng fú' },
  { word: '温暖', meaning: '暖和', phonetic: 'wēn nuǎn' }, { word: '爱心', meaning: '爱', phonetic: 'ài xīn' }, { word: '朋友', meaning: '伙伴', phonetic: 'péng yǒu' },
  { word: '友谊', meaning: '友情', phonetic: 'yǒu yì' }, { word: '诚实', meaning: '老实', phonetic: 'chéng shí' }, { word: '勇敢', meaning: '胆大', phonetic: 'yǒng gǎn' },
  { word: '勤劳', meaning: '勤快', phonetic: 'qín láo' }, { word: '朴素', meaning: '朴实', phonetic: 'pǔ sù' }, { word: '自然', meaning: '大自然', phonetic: 'zì rán' },
  { word: '家乡', meaning: '故乡', phonetic: 'jiā xiāng' }, { word: '祖国', meaning: '国家', phonetic: 'zǔ guó' }, { word: '科学', meaning: '学科', phonetic: 'kē xué' }
])

const createHighUnit = (id: string, name: string, grade: 'senior1' | 'senior2' | 'senior3', words: { word: string; meaning: string; phonetic: string }[]): PresetUnit => ({
  id,
  name,
  subject: 'chinese',
  grade,
  textbook: '人教统编版高中',
  words
})

export const BUBD_HIGH_CN_PRESETS: PresetUnit[] = [
  ...Array.from({ length: 8 }, (_, i) => createHighUnit(
    `cn-bubd-high-s1-u${i + 1}`,
    `必修上册 第${i + 1}单元`,
    'senior1',
    [
      { word: '沁园春·长沙', meaning: '词牌名', phonetic: 'qìn yuán chūn cháng shā' }, { word: '峥嵘岁月', meaning: '不平凡岁月', phonetic: 'zhēng róng suì yuè' },
      { word: '挥斥方遒', meaning: '热情奔放', phonetic: 'huī chì fāng qiú' }, { word: '诗经', meaning: '诗歌总集', phonetic: 'shī jīng' },
      { word: '楚辞', meaning: '楚辞', phonetic: 'chǔ cí' }, { word: '乐府', meaning: '诗体', phonetic: 'yuè fǔ' }, { word: '唐诗', meaning: '唐代诗歌', phonetic: 'táng shī' },
      { word: '宋词', meaning: '宋代词作', phonetic: 'sòng cí' }, { word: '元曲', meaning: '元代戏曲', phonetic: 'yuán qǔ' }, { word: '小说', meaning: '文学体裁', phonetic: 'xiǎo shuō' },
      { word: '散文', meaning: '文学体裁', phonetic: 'sǎn wén' }, { word: '诗歌', meaning: '文学体裁', phonetic: 'shī gē' }, { word: '戏剧', meaning: '文学体裁', phonetic: 'xì jù' },
      { word: '议论文', meaning: '文体', phonetic: 'yì lùn wén' }, { word: '记叙文', meaning: '文体', phonetic: 'jì xù wén' }, { word: '说明文', meaning: '文体', phonetic: 'shuō míng wén' },
      { word: '文言文', meaning: '古文', phonetic: 'wén yán wén' }, { word: '白话文', meaning: '现代文', phonetic: 'bái huà wén' }
    ]
  )),
  ...Array.from({ length: 8 }, (_, i) => createHighUnit(
    `cn-bubd-high-s2-u${i + 1}`,
    `必修下册 第${i + 1}单元`,
    'senior2',
    [
      { word: '论语', meaning: '儒家经典', phonetic: 'lún yǔ' }, { word: '孟子', meaning: '儒家经典', phonetic: 'mèng zǐ' }, { word: '庄子', meaning: '道家经典', phonetic: 'zhuāng zǐ' },
      { word: '史记', meaning: '史书', phonetic: 'shǐ jì' }, { word: '汉书', meaning: '史书', phonetic: 'hàn shū' }, { word: '后汉书', meaning: '史书', phonetic: 'hòu hàn shū' },
      { word: '三国志', meaning: '史书', phonetic: 'sān guó zhì' }, { word: '资治通鉴', meaning: '史书', phonetic: 'zī zhì tōng jiàn' }, { word: '红楼梦', meaning: '小说', phonetic: 'hóng lóu mèng' },
      { word: '水浒传', meaning: '小说', phonetic: 'shuǐ hǔ zhuàn' }, { word: '三国演义', meaning: '小说', phonetic: 'sān guó yǎn yì' }, { word: '西游记', meaning: '小说', phonetic: 'xī yóu jì' },
      { word: '呐喊', meaning: '小说集', phonetic: 'nà hǎn' }, { word: '彷徨', meaning: '小说集', phonetic: 'páng huáng' }, { word: '骆驼祥子', meaning: '小说', phonetic: 'luò tuo xiáng zi' },
      { word: '围城', meaning: '小说', phonetic: 'wéi chéng' }, { word: '家', meaning: '小说', phonetic: 'jiā' }, { word: '春', meaning: '小说', phonetic: 'chūn' }
    ]
  )),
  ...['上', '中', '下'].flatMap(book =>
    Array.from({ length: 6 }, (_, i) => createHighUnit(
      `cn-bubd-high-s3-u${book === '上' ? i + 1 : book === '中' ? i + 7 : i + 13}`,
      `选择性必修${book}册 第${i + 1}单元`,
      'senior3',
      [
        { word: '老子', meaning: '道家经典', phonetic: 'lǎo zǐ' }, { word: '韩非子', meaning: '法家经典', phonetic: 'hán fēi zǐ' }, { word: '墨子', meaning: '墨家经典', phonetic: 'mò zǐ' },
        { word: '荀子', meaning: '儒家经典', phonetic: 'xún zǐ' }, { word: '左传', meaning: '史书', phonetic: 'zuǒ zhuàn' }, { word: '战国策', meaning: '史书', phonetic: 'zhàn guó cè' },
        { word: '世说新语', meaning: '笔记小说', phonetic: 'shì shuō xīn yǔ' }, { word: '聊斋志异', meaning: '小说', phonetic: 'liáo zhāi zhì yì' }, { word: '儒林外史', meaning: '小说', phonetic: 'rú lín wài shǐ' },
        { word: '官场现形记', meaning: '小说', phonetic: 'guān chǎng xiàn xíng jì' }, { word: '老人与海', meaning: '外国小说', phonetic: 'lǎo rén yǔ hǎi' }, { word: '哈姆雷特', meaning: '戏剧', phonetic: 'hā mǔ léi tè' },
        { word: '窦娥冤', meaning: '戏剧', phonetic: 'dòu é yuān' }, { word: '西厢记', meaning: '戏剧', phonetic: 'xī xiāng jì' }, { word: '牡丹亭', meaning: '戏剧', phonetic: 'mǔ dān tíng' },
        { word: '桃花扇', meaning: '戏剧', phonetic: 'táo huā shàn' }, { word: '长生殿', meaning: '戏剧', phonetic: 'cháng shēng diàn' }, { word: '修辞', meaning: '修辞手法', phonetic: 'xiū cí' }
      ]
    ))
  )
]

export const CHINESE_ALL_PRESETS: PresetUnit[] = [
  ...DEFAULT_CN_PRESETS,
  ...BUBD_CN_PRESETS,
  ...SU_CN_PRESETS,
  ...BSD_CN_PRESETS,
  ...HEB_CN_PRESETS,
  ...BUBD_HIGH_CN_PRESETS
]
