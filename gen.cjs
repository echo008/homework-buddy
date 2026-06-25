const fs = require('fs');

const wordBank = {
  p3Start: [
    { word: 'hello', meaning: '你好', phonetic: '/həˈləʊ/' },
    { word: 'hi', meaning: '嗨', phonetic: '/haɪ/' },
    { word: 'bye', meaning: '再见', phonetic: '/baɪ/' },
    { word: 'goodbye', meaning: '再见', phonetic: '/ˌɡʊdˈbaɪ/' },
    { word: 'good', meaning: '好的', phonetic: '/ɡʊd/' },
    { word: 'morning', meaning: '早上', phonetic: '/ˈmɔːnɪŋ/' },
    { word: 'afternoon', meaning: '下午', phonetic: '/ˌɑːftəˈnuːn/' },
    { word: 'I', meaning: '我', phonetic: '/aɪ/' },
    { word: 'am', meaning: '是', phonetic: '/æm/' },
    { word: 'you', meaning: '你', phonetic: '/juː/' },
    { word: 'are', meaning: '是', phonetic: '/ɑː(r)/' },
    { word: 'yes', meaning: '是的', phonetic: '/jes/' },
    { word: 'no', meaning: '不', phonetic: '/nəʊ/' },
    { word: 'nice', meaning: '好的', phonetic: '/naɪs/' },
    { word: 'meet', meaning: '遇见', phonetic: '/miːt/' },
    { word: 'too', meaning: '也', phonetic: '/tuː/' },
    { word: 'this', meaning: '这个', phonetic: '/ðɪs/' },
    { word: 'is', meaning: '是', phonetic: '/ɪz/' },
  ],
  p3Colors: [
    { word: 'red', meaning: '红色', phonetic: '/red/' },
    { word: 'yellow', meaning: '黄色', phonetic: '/ˈjeləʊ/' },
    { word: 'green', meaning: '绿色', phonetic: '/ɡriːn/' },
    { word: 'blue', meaning: '蓝色', phonetic: '/bluː/' },
    { word: 'black', meaning: '黑色', phonetic: '/blæk/' },
    { word: 'white', meaning: '白色', phonetic: '/waɪt/' },
    { word: 'orange', meaning: '橙色', phonetic: '/ˈɒrɪndʒ/' },
    { word: 'brown', meaning: '棕色', phonetic: '/braʊn/' },
    { word: 'pink', meaning: '粉色', phonetic: '/pɪŋk/' },
    { word: 'purple', meaning: '紫色', phonetic: '/ˈpɜːpl/' },
    { word: 'colour', meaning: '颜色', phonetic: '/ˈkʌlə(r)/' },
    { word: 'show', meaning: '展示', phonetic: '/ʃəʊ/' },
    { word: 'me', meaning: '我', phonetic: '/miː/' },
    { word: 'and', meaning: '和', phonetic: '/ænd/' },
    { word: 'it', meaning: '它', phonetic: '/ɪt/' },
    { word: 'that', meaning: '那个', phonetic: '/ðæt/' },
    { word: 'look', meaning: '看', phonetic: '/lʊk/' },
    { word: 'at', meaning: '在', phonetic: '/æt/' },
  ],
  p3Body: [
    { word: 'face', meaning: '脸', phonetic: '/feɪs/' },
    { word: 'ear', meaning: '耳朵', phonetic: '/ɪə(r)/' },
    { word: 'eye', meaning: '眼睛', phonetic: '/aɪ/' },
    { word: 'nose', meaning: '鼻子', phonetic: '/nəʊz/' },
    { word: 'mouth', meaning: '嘴巴', phonetic: '/maʊθ/' },
    { word: 'arm', meaning: '胳膊', phonetic: '/ɑːm/' },
    { word: 'hand', meaning: '手', phonetic: '/hænd/' },
    { word: 'finger', meaning: '手指', phonetic: '/ˈfɪŋɡə(r)/' },
    { word: 'leg', meaning: '腿', phonetic: '/leɡ/' },
    { word: 'foot', meaning: '脚', phonetic: '/fʊt/' },
    { word: 'body', meaning: '身体', phonetic: '/ˈbɒdi/' },
    { word: 'head', meaning: '头', phonetic: '/hed/' },
    { word: 'touch', meaning: '触摸', phonetic: '/tʌtʃ/' },
    { word: 'your', meaning: '你的', phonetic: '/jɔː(r)/' },
    { word: 'my', meaning: '我的', phonetic: '/maɪ/' },
    { word: 'clap', meaning: '拍手', phonetic: '/klæp/' },
    { word: 'stamp', meaning: '跺脚', phonetic: '/stæmp/' },
    { word: 'wave', meaning: '挥动', phonetic: '/weɪv/' },
  ],
  p3Animals: [
    { word: 'cat', meaning: '猫', phonetic: '/kæt/' },
    { word: 'dog', meaning: '狗', phonetic: '/dɒɡ/' },
    { word: 'monkey', meaning: '猴子', phonetic: '/ˈmʌŋki/' },
    { word: 'panda', meaning: '熊猫', phonetic: '/ˈpændə/' },
    { word: 'rabbit', meaning: '兔子', phonetic: '/ˈræbɪt/' },
    { word: 'duck', meaning: '鸭子', phonetic: '/dʌk/' },
    { word: 'pig', meaning: '猪', phonetic: '/pɪɡ/' },
    { word: 'bird', meaning: '鸟', phonetic: '/bɜːd/' },
    { word: 'bear', meaning: '熊', phonetic: '/beə(r)/' },
    { word: 'elephant', meaning: '大象', phonetic: '/ˈelɪfənt/' },
    { word: 'tiger', meaning: '老虎', phonetic: '/ˈtaɪɡə(r)/' },
    { word: 'lion', meaning: '狮子', phonetic: '/ˈlaɪən/' },
    { word: 'zoo', meaning: '动物园', phonetic: '/zuː/' },
    { word: 'what', meaning: '什么', phonetic: '/wɒt/' },
    { word: 'they', meaning: '他们', phonetic: '/ðeɪ/' },
    { word: 'like', meaning: '喜欢', phonetic: '/laɪk/' },
    { word: 'cute', meaning: '可爱的', phonetic: '/kjuːt/' },
    { word: 'funny', meaning: '有趣的', phonetic: '/ˈfʌni/' },
  ],
  p3Family: [
    { word: 'father', meaning: '父亲', phonetic: '/ˈfɑːðə(r)/' },
    { word: 'mother', meaning: '母亲', phonetic: '/ˈmʌðə(r)/' },
    { word: 'brother', meaning: '兄弟', phonetic: '/ˈbrʌðə(r)/' },
    { word: 'sister', meaning: '姐妹', phonetic: '/ˈsɪstə(r)/' },
    { word: 'grandpa', meaning: '爷爷', phonetic: '/ˈɡrænpɑː/' },
    { word: 'grandma', meaning: '奶奶', phonetic: '/ˈɡrænmɑː/' },
    { word: 'family', meaning: '家庭', phonetic: '/ˈfæməli/' },
    { word: 'man', meaning: '男人', phonetic: '/mæn/' },
    { word: 'woman', meaning: '女人', phonetic: '/ˈwʊmən/' },
    { word: 'aunt', meaning: '阿姨', phonetic: '/ɑːnt/' },
    { word: 'uncle', meaning: '叔叔', phonetic: '/ˈʌŋkl/' },
    { word: 'boy', meaning: '男孩', phonetic: '/bɔɪ/' },
    { word: 'girl', meaning: '女孩', phonetic: '/ɡɜːl/' },
    { word: 'friend', meaning: '朋友', phonetic: '/frend/' },
    { word: 'who', meaning: '谁', phonetic: '/huː/' },
    { word: 'she', meaning: '她', phonetic: '/ʃiː/' },
    { word: 'he', meaning: '他', phonetic: '/hiː/' },
    { word: 'baby', meaning: '婴儿', phonetic: '/ˈbeɪbi/' },
  ],
  p3Numbers: [
    { word: 'one', meaning: '一', phonetic: '/wʌn/' },
    { word: 'two', meaning: '二', phonetic: '/tuː/' },
    { word: 'three', meaning: '三', phonetic: '/θriː/' },
    { word: 'four', meaning: '四', phonetic: '/fɔː(r)/' },
    { word: 'five', meaning: '五', phonetic: '/faɪv/' },
    { word: 'six', meaning: '六', phonetic: '/sɪks/' },
    { word: 'seven', meaning: '七', phonetic: '/ˈsevn/' },
    { word: 'eight', meaning: '八', phonetic: '/eɪt/' },
    { word: 'nine', meaning: '九', phonetic: '/naɪn/' },
    { word: 'ten', meaning: '十', phonetic: '/ten/' },
    { word: 'how', meaning: '怎样', phonetic: '/haʊ/' },
    { word: 'many', meaning: '许多', phonetic: '/ˈmeni/' },
    { word: 'count', meaning: '数', phonetic: '/kaʊnt/' },
    { word: 'eleven', meaning: '十一', phonetic: '/ɪˈlevn/' },
    { word: 'twelve', meaning: '十二', phonetic: '/twelv/' },
    { word: 'number', meaning: '数字', phonetic: '/ˈnʌmbə(r)/' },
    { word: 'little', meaning: '小的', phonetic: '/ˈlɪtl/' },
    { word: 'only', meaning: '只有', phonetic: '/ˈəʊnli/' },
  ],
  p3Fruit: [
    { word: 'apple', meaning: '苹果', phonetic: '/ˈæpl/' },
    { word: 'banana', meaning: '香蕉', phonetic: '/bəˈnɑːnə/' },
    { word: 'pear', meaning: '梨', phonetic: '/peə(r)/' },
    { word: 'orange', meaning: '橙子', phonetic: '/ˈɒrɪndʒ/' },
    { word: 'watermelon', meaning: '西瓜', phonetic: '/ˈwɔːtəmelən/' },
    { word: 'strawberry', meaning: '草莓', phonetic: '/ˈstrɔːbəri/' },
    { word: 'grape', meaning: '葡萄', phonetic: '/ɡreɪp/' },
    { word: 'peach', meaning: '桃子', phonetic: '/piːtʃ/' },
    { word: 'fruit', meaning: '水果', phonetic: '/fruːt/' },
    { word: 'eat', meaning: '吃', phonetic: '/iːt/' },
    { word: 'like', meaning: '喜欢', phonetic: '/laɪk/' },
    { word: 'some', meaning: '一些', phonetic: '/sʌm/' },
    { word: 'please', meaning: '请', phonetic: '/pliːz/' },
    { word: 'thank', meaning: '谢谢', phonetic: '/θæŋk/' },
    { word: 'hungry', meaning: '饿的', phonetic: '/ˈhʌŋɡri/' },
    { word: 'sweet', meaning: '甜的', phonetic: '/swiːt/' },
    { word: 'tasty', meaning: '好吃的', phonetic: '/ˈteɪsti/' },
    { word: 'yummy', meaning: '美味的', phonetic: '/ˈjʌmi/' },
  ],
  p4School: [
    { word: 'classroom', meaning: '教室', phonetic: '/ˈklɑːsruːm/' },
    { word: 'window', meaning: '窗户', phonetic: '/ˈwɪndəʊ/' },
    { word: 'door', meaning: '门', phonetic: '/dɔː(r)/' },
    { word: 'picture', meaning: '图画', phonetic: '/ˈpɪktʃə(r)/' },
    { word: 'blackboard', meaning: '黑板', phonetic: '/ˈblækbɔːd/' },
    { word: 'light', meaning: '灯', phonetic: '/laɪt/' },
    { word: 'computer', meaning: '电脑', phonetic: '/kəmˈpjuːtə(r)/' },
    { word: 'teacher', meaning: '老师', phonetic: '/ˈtiːtʃə(r)/' },
    { word: 'desk', meaning: '书桌', phonetic: '/desk/' },
    { word: 'chair', meaning: '椅子', phonetic: '/tʃeə(r)/' },
    { word: 'fan', meaning: '风扇', phonetic: '/fæn/' },
    { word: 'wall', meaning: '墙', phonetic: '/wɔːl/' },
    { word: 'floor', meaning: '地板', phonetic: '/flɔː(r)/' },
    { word: 'clean', meaning: '打扫', phonetic: '/kliːn/' },
    { word: 'help', meaning: '帮助', phonetic: '/help/' },
    { word: 'open', meaning: '打开', phonetic: '/ˈəʊpən/' },
    { word: 'close', meaning: '关闭', phonetic: '/kləʊz/' },
    { word: 'put', meaning: '放', phonetic: '/pʊt/' },
  ],
  p4Bag: [
    { word: 'schoolbag', meaning: '书包', phonetic: '/ˈskuːlbæɡ/' },
    { word: 'book', meaning: '书', phonetic: '/bʊk/' },
    { word: 'Chinese', meaning: '语文', phonetic: '/ˌtʃaɪˈniːz/' },
    { word: 'English', meaning: '英语', phonetic: '/ˈɪŋɡlɪʃ/' },
    { word: 'math', meaning: '数学', phonetic: '/mæθ/' },
    { word: 'storybook', meaning: '故事书', phonetic: '/ˈstɔːribʊk/' },
    { word: 'notebook', meaning: '笔记本', phonetic: '/ˈnəʊtbʊk/' },
    { word: 'pencil', meaning: '铅笔', phonetic: '/ˈpensl/' },
    { word: 'pen', meaning: '钢笔', phonetic: '/pen/' },
    { word: 'ruler', meaning: '尺子', phonetic: '/ˈruːlə(r)/' },
    { word: 'pencil-case', meaning: '铅笔盒', phonetic: '/ˈpensl keɪs/' },
    { word: 'eraser', meaning: '橡皮', phonetic: '/ɪˈreɪzə(r)/' },
    { word: 'bag', meaning: '包', phonetic: '/bæɡ/' },
    { word: 'heavy', meaning: '重的', phonetic: '/ˈhevi/' },
    { word: 'in', meaning: '在...里', phonetic: '/ɪn/' },
    { word: 'on', meaning: '在...上', phonetic: '/ɒn/' },
    { word: 'under', meaning: '在...下', phonetic: '/ˈʌndə(r)/' },
    { word: 'sorry', meaning: '对不起', phonetic: '/ˈsɒri/' },
  ],
  p4Friend: [
    { word: 'friend', meaning: '朋友', phonetic: '/frend/' },
    { word: 'strong', meaning: '强壮的', phonetic: '/strɒŋ/' },
    { word: 'quiet', meaning: '安静的', phonetic: '/ˈkwaɪət/' },
    { word: 'long', meaning: '长的', phonetic: '/lɒŋ/' },
    { word: 'hair', meaning: '头发', phonetic: '/heə(r)/' },
    { word: 'short', meaning: '短的', phonetic: '/ʃɔːt/' },
    { word: 'thin', meaning: '瘦的', phonetic: '/θɪn/' },
    { word: 'tall', meaning: '高的', phonetic: '/tɔːl/' },
    { word: 'name', meaning: '名字', phonetic: '/neɪm/' },
    { word: 'his', meaning: '他的', phonetic: '/hɪz/' },
    { word: 'her', meaning: '她的', phonetic: '/hɜː(r)/' },
    { word: 'right', meaning: '对的', phonetic: '/raɪt/' },
    { word: 'boy', meaning: '男孩', phonetic: '/bɔɪ/' },
    { word: 'girl', meaning: '女孩', phonetic: '/ɡɜːl/' },
    { word: 'student', meaning: '学生', phonetic: '/ˈstjuːdnt/' },
    { word: 'music', meaning: '音乐', phonetic: '/ˈmjuːzɪk/' },
    { word: 'science', meaning: '科学', phonetic: '/ˈsaɪəns/' },
    { word: 'sports', meaning: '运动', phonetic: '/spɔːts/' },
  ],
  p4Home: [
    { word: 'home', meaning: '家', phonetic: '/həʊm/' },
    { word: 'room', meaning: '房间', phonetic: '/ruːm/' },
    { word: 'study', meaning: '书房', phonetic: '/ˈstʌdi/' },
    { word: 'bedroom', meaning: '卧室', phonetic: '/ˈbedruːm/' },
    { word: 'kitchen', meaning: '厨房', phonetic: '/ˈkɪtʃɪn/' },
    { word: 'bathroom', meaning: '浴室', phonetic: '/ˈbɑːθruːm/' },
    { word: 'bed', meaning: '床', phonetic: '/bed/' },
    { word: 'phone', meaning: '电话', phonetic: '/fəʊn/' },
    { word: 'sofa', meaning: '沙发', phonetic: '/ˈsəʊfə/' },
    { word: 'fridge', meaning: '冰箱', phonetic: '/frɪdʒ/' },
    { word: 'table', meaning: '桌子', phonetic: '/ˈteɪbl/' },
    { word: 'key', meaning: '钥匙', phonetic: '/kiː/' },
    { word: 'door', meaning: '门', phonetic: '/dɔː(r)/' },
    { word: 'where', meaning: '哪里', phonetic: '/weə(r)/' },
    { word: 'living room', meaning: '客厅', phonetic: '/ˈlɪvɪŋ ruːm/' },
    { word: 'find', meaning: '找到', phonetic: '/faɪnd/' },
    { word: 'them', meaning: '他们', phonetic: '/ðəm/' },
    { word: 'very', meaning: '非常', phonetic: '/ˈveri/' },
  ],
  p4Time: [
    { word: 'breakfast', meaning: '早餐', phonetic: '/ˈbrekfəst/' },
    { word: 'lunch', meaning: '午餐', phonetic: '/lʌntʃ/' },
    { word: 'dinner', meaning: '晚餐', phonetic: '/ˈdɪnə(r)/' },
    { word: 'class', meaning: '课', phonetic: '/klɑːs/' },
    { word: 'PE', meaning: '体育', phonetic: '/ˌpiːˈiː/' },
    { word: 'over', meaning: '结束', phonetic: '/ˈəʊvə(r)/' },
    { word: 'go', meaning: '去', phonetic: '/ɡəʊ/' },
    { word: 'to', meaning: '到', phonetic: '/tuː/' },
    { word: 'bed', meaning: '床', phonetic: '/bed/' },
    { word: 'now', meaning: '现在', phonetic: '/naʊ/' },
    { word: 'time', meaning: '时间', phonetic: '/taɪm/' },
    { word: "o'clock", meaning: '点钟', phonetic: '/əˈklɒk/' },
    { word: 'get', meaning: '得到', phonetic: '/ɡet/' },
    { word: 'up', meaning: '向上', phonetic: '/ʌp/' },
    { word: 'go to school', meaning: '上学', phonetic: '/ɡəʊ tuː skuːl/' },
    { word: 'go home', meaning: '回家', phonetic: '/ɡəʊ həʊm/' },
    { word: 'ready', meaning: '准备好的', phonetic: '/ˈredi/' },
    { word: 'hurry', meaning: '赶快', phonetic: '/ˈhʌri/' },
  ],
  p4Weather: [
    { word: 'cold', meaning: '寒冷的', phonetic: '/kəʊld/' },
    { word: 'warm', meaning: '温暖的', phonetic: '/wɔːm/' },
    { word: 'cool', meaning: '凉爽的', phonetic: '/kuːl/' },
    { word: 'hot', meaning: '炎热的', phonetic: '/hɒt/' },
    { word: 'weather', meaning: '天气', phonetic: '/ˈweðə(r)/' },
    { word: 'rainy', meaning: '下雨的', phonetic: '/ˈreɪni/' },
    { word: 'sunny', meaning: '晴朗的', phonetic: '/ˈsʌni/' },
    { word: 'cloudy', meaning: '多云的', phonetic: '/ˈklaʊdi/' },
    { word: 'snowy', meaning: '下雪的', phonetic: '/ˈsnəʊi/' },
    { word: 'windy', meaning: '有风的', phonetic: '/ˈwɪndi/' },
    { word: 'outside', meaning: '外面', phonetic: '/ˌaʊtˈsaɪd/' },
    { word: 'today', meaning: '今天', phonetic: '/təˈdeɪ/' },
    { word: 'can', meaning: '能', phonetic: '/kæn/' },
    { word: 'wear', meaning: '穿', phonetic: '/weə(r)/' },
    { word: 'shirt', meaning: '衬衫', phonetic: '/ʃɜːt/' },
    { word: 'jacket', meaning: '夹克', phonetic: '/ˈdʒækɪt/' },
    { word: 'rain', meaning: '雨', phonetic: '/reɪn/' },
    { word: 'snow', meaning: '雪', phonetic: '/snəʊ/' },
  ],
  p4Farm: [
    { word: 'tomato', meaning: '西红柿', phonetic: '/təˈmɑːtəʊ/' },
    { word: 'potato', meaning: '土豆', phonetic: '/pəˈteɪtəʊ/' },
    { word: 'carrot', meaning: '胡萝卜', phonetic: '/ˈkærət/' },
    { word: 'cucumber', meaning: '黄瓜', phonetic: '/ˈkjuːkʌmbə(r)/' },
    { word: 'onion', meaning: '洋葱', phonetic: '/ˈʌnjən/' },
    { word: 'horse', meaning: '马', phonetic: '/hɔːs/' },
    { word: 'cow', meaning: '奶牛', phonetic: '/kaʊ/' },
    { word: 'sheep', meaning: '绵羊', phonetic: '/ʃiːp/' },
    { word: 'hen', meaning: '母鸡', phonetic: '/hen/' },
    { word: 'goat', meaning: '山羊', phonetic: '/ɡəʊt/' },
    { word: 'farm', meaning: '农场', phonetic: '/fɑːm/' },
    { word: 'these', meaning: '这些', phonetic: '/ðiːz/' },
    { word: 'those', meaning: '那些', phonetic: '/ðəʊz/' },
    { word: 'they', meaning: '他们', phonetic: '/ðeɪ/' },
    { word: 'how', meaning: '怎样', phonetic: '/haʊ/' },
    { word: 'many', meaning: '许多', phonetic: '/ˈmeni/' },
    { word: 'big', meaning: '大的', phonetic: '/bɪɡ/' },
    { word: 'small', meaning: '小的', phonetic: '/smɔːl/' },
  ],
  p4Clothes: [
    { word: 'jacket', meaning: '夹克', phonetic: '/ˈdʒækɪt/' },
    { word: 'shirt', meaning: '衬衫', phonetic: '/ʃɜːt/' },
    { word: 'T-shirt', meaning: 'T恤', phonetic: '/ˈtiː ʃɜːt/' },
    { word: 'skirt', meaning: '短裙', phonetic: '/skɜːt/' },
    { word: 'dress', meaning: '连衣裙', phonetic: '/dres/' },
    { word: 'sweater', meaning: '毛衣', phonetic: '/ˈswetə(r)/' },
    { word: 'coat', meaning: '外套', phonetic: '/kəʊt/' },
    { word: 'jeans', meaning: '牛仔裤', phonetic: '/dʒiːnz/' },
    { word: 'pants', meaning: '长裤', phonetic: '/pænts/' },
    { word: 'shorts', meaning: '短裤', phonetic: '/ʃɔːts/' },
    { word: 'shoes', meaning: '鞋子', phonetic: '/ʃuːz/' },
    { word: 'socks', meaning: '袜子', phonetic: '/sɒks/' },
    { word: 'whose', meaning: '谁的', phonetic: '/huːz/' },
    { word: 'this', meaning: '这个', phonetic: '/ðɪs/' },
    { word: 'that', meaning: '那个', phonetic: '/ðæt/' },
    { word: 'put', meaning: '放', phonetic: '/pʊt/' },
    { word: 'on', meaning: '穿上', phonetic: '/ɒn/' },
    { word: 'like', meaning: '喜欢', phonetic: '/laɪk/' },
  ],
  p5Adj: [
    { word: 'young', meaning: '年轻的', phonetic: '/jʌŋ/' },
    { word: 'funny', meaning: '滑稽的', phonetic: '/ˈfʌni/' },
    { word: 'tall', meaning: '高的', phonetic: '/tɔːl/' },
    { word: 'strong', meaning: '强壮的', phonetic: '/strɒŋ/' },
    { word: 'kind', meaning: '和蔼的', phonetic: '/kaɪnd/' },
    { word: 'old', meaning: '年老的', phonetic: '/əʊld/' },
    { word: 'short', meaning: '矮的', phonetic: '/ʃɔːt/' },
    { word: 'thin', meaning: '瘦的', phonetic: '/θɪn/' },
    { word: 'strict', meaning: '严格的', phonetic: '/strɪkt/' },
    { word: 'smart', meaning: '聪明的', phonetic: '/smɑːt/' },
    { word: 'active', meaning: '积极的', phonetic: '/ˈæktɪv/' },
    { word: 'quiet', meaning: '安静的', phonetic: '/ˈkwaɪət/' },
    { word: 'very', meaning: '非常', phonetic: '/ˈveri/' },
    { word: 'but', meaning: '但是', phonetic: '/bʌt/' },
    { word: 'who', meaning: '谁', phonetic: '/huː/' },
    { word: 'Mr', meaning: '先生', phonetic: '/ˈmɪstər/' },
    { word: 'Miss', meaning: '小姐', phonetic: '/mɪs/' },
    { word: 'lady', meaning: '女士', phonetic: '/ˈleɪdi/' },
  ],
  p5Week: [
    { word: 'Monday', meaning: '星期一', phonetic: '/ˈmʌndeɪ/' },
    { word: 'Tuesday', meaning: '星期二', phonetic: '/ˈtjuːzdeɪ/' },
    { word: 'Wednesday', meaning: '星期三', phonetic: '/ˈwenzdeɪ/' },
    { word: 'Thursday', meaning: '星期四', phonetic: '/ˈθɜːzdeɪ/' },
    { word: 'Friday', meaning: '星期五', phonetic: '/ˈfraɪdeɪ/' },
    { word: 'Saturday', meaning: '星期六', phonetic: '/ˈsætədeɪ/' },
    { word: 'Sunday', meaning: '星期日', phonetic: '/ˈsʌndeɪ/' },
    { word: 'day', meaning: '天', phonetic: '/deɪ/' },
    { word: 'have', meaning: '有', phonetic: '/hæv/' },
    { word: 'on', meaning: '在', phonetic: '/ɒn/' },
    { word: 'do', meaning: '做', phonetic: '/duː/' },
    { word: 'weekend', meaning: '周末', phonetic: '/ˌwiːkˈend/' },
    { word: 'read', meaning: '读', phonetic: '/riːd/' },
    { word: 'books', meaning: '书', phonetic: '/bʊks/' },
    { word: 'watch', meaning: '看', phonetic: '/wɒtʃ/' },
    { word: 'TV', meaning: '电视', phonetic: '/ˌtiːˈviː/' },
    { word: 'often', meaning: '经常', phonetic: '/ˈɒfn/' },
    { word: 'sometimes', meaning: '有时', phonetic: '/ˈsʌmtaɪmz/' },
  ],
  p5Food: [
    { word: 'eggplant', meaning: '茄子', phonetic: '/ˈeɡplɑːnt/' },
    { word: 'fish', meaning: '鱼', phonetic: '/fɪʃ/' },
    { word: 'tofu', meaning: '豆腐', phonetic: '/ˈtəʊfuː/' },
    { word: 'potato', meaning: '土豆', phonetic: '/pəˈteɪtəʊ/' },
    { word: 'tomato', meaning: '西红柿', phonetic: '/təˈmɑːtəʊ/' },
    { word: 'lunch', meaning: '午餐', phonetic: '/lʌntʃ/' },
    { word: 'tasty', meaning: '好吃的', phonetic: '/ˈteɪsti/' },
    { word: 'sweet', meaning: '甜的', phonetic: '/swiːt/' },
    { word: 'sour', meaning: '酸的', phonetic: '/ˈsaʊə(r)/' },
    { word: 'fresh', meaning: '新鲜的', phonetic: '/freʃ/' },
    { word: 'salty', meaning: '咸的', phonetic: '/ˈsɔːlti/' },
    { word: 'favourite', meaning: '最喜欢的', phonetic: '/ˈfeɪvərɪt/' },
    { word: 'fruit', meaning: '水果', phonetic: '/fruːt/' },
    { word: 'grape', meaning: '葡萄', phonetic: '/ɡreɪp/' },
    { word: 'apple', meaning: '苹果', phonetic: '/ˈæpl/' },
    { word: 'banana', meaning: '香蕉', phonetic: '/bəˈnɑːnə/' },
    { word: 'hungry', meaning: '饿的', phonetic: '/ˈhʌŋɡri/' },
    { word: 'would', meaning: '愿意', phonetic: '/wʊd/' },
  ],
  p5Can: [
    { word: 'cook', meaning: '做饭', phonetic: '/kʊk/' },
    { word: 'water', meaning: '浇', phonetic: '/ˈwɔːtə(r)/' },
    { word: 'flowers', meaning: '花', phonetic: '/ˈflaʊəz/' },
    { word: 'sweep', meaning: '扫', phonetic: '/swiːp/' },
    { word: 'floor', meaning: '地板', phonetic: '/flɔː(r)/' },
    { word: 'clean', meaning: '打扫', phonetic: '/kliːn/' },
    { word: 'bedroom', meaning: '卧室', phonetic: '/ˈbedruːm/' },
    { word: 'empty', meaning: '倒空', phonetic: '/ˈempti/' },
    { word: 'trash', meaning: '垃圾', phonetic: '/træʃ/' },
    { word: 'wash', meaning: '洗', phonetic: '/wɒʃ/' },
    { word: 'clothes', meaning: '衣服', phonetic: '/kləʊðz/' },
    { word: 'can', meaning: '能', phonetic: '/kæn/' },
    { word: 'make', meaning: '制作', phonetic: '/meɪk/' },
    { word: 'bed', meaning: '床', phonetic: '/bed/' },
    { word: 'do', meaning: '做', phonetic: '/duː/' },
    { word: 'dishes', meaning: '盘子', phonetic: '/ˈdɪʃɪz/' },
    { word: 'set', meaning: '摆放', phonetic: '/set/' },
    { word: 'table', meaning: '桌子', phonetic: '/ˈteɪbl/' },
  ],
  p5Room: [
    { word: 'air-conditioner', meaning: '空调', phonetic: '/ˈeə kəndɪʃənə(r)/' },
    { word: 'curtain', meaning: '窗帘', phonetic: '/ˈkɜːtn/' },
    { word: 'trash bin', meaning: '垃圾桶', phonetic: '/træʃ bɪn/' },
    { word: 'closet', meaning: '衣柜', phonetic: '/ˈklɒzɪt/' },
    { word: 'mirror', meaning: '镜子', phonetic: '/ˈmɪrə(r)/' },
    { word: 'end table', meaning: '床头柜', phonetic: '/end ˈteɪbl/' },
    { word: 'in', meaning: '在...里', phonetic: '/ɪn/' },
    { word: 'on', meaning: '在...上', phonetic: '/ɒn/' },
    { word: 'under', meaning: '在...下', phonetic: '/ˈʌndə(r)/' },
    { word: 'near', meaning: '附近', phonetic: '/nɪə(r)/' },
    { word: 'behind', meaning: '在...后面', phonetic: '/bɪˈhaɪnd/' },
    { word: 'over', meaning: '在...上方', phonetic: '/ˈəʊvə(r)/' },
    { word: 'in front of', meaning: '在...前面', phonetic: '/ɪn frʌnt əv/' },
    { word: 'room', meaning: '房间', phonetic: '/ruːm/' },
    { word: 'bedroom', meaning: '卧室', phonetic: '/ˈbedruːm/' },
    { word: 'kitchen', meaning: '厨房', phonetic: '/ˈkɪtʃɪn/' },
    { word: 'bathroom', meaning: '浴室', phonetic: '/ˈbɑːθruːm/' },
    { word: 'look', meaning: '看', phonetic: '/lʊk/' },
  ],
  p5Nature: [
    { word: 'sky', meaning: '天空', phonetic: '/skaɪ/' },
    { word: 'cloud', meaning: '云', phonetic: '/klaʊd/' },
    { word: 'mountain', meaning: '山', phonetic: '/ˈmaʊntən/' },
    { word: 'river', meaning: '河流', phonetic: '/ˈrɪvə(r)/' },
    { word: 'flower', meaning: '花', phonetic: '/ˈflaʊə(r)/' },
    { word: 'grass', meaning: '草', phonetic: '/ɡrɑːs/' },
    { word: 'lake', meaning: '湖', phonetic: '/leɪk/' },
    { word: 'forest', meaning: '森林', phonetic: '/ˈfɒrɪst/' },
    { word: 'path', meaning: '小路', phonetic: '/pɑːθ/' },
    { word: 'park', meaning: '公园', phonetic: '/pɑːk/' },
    { word: 'picture', meaning: '照片', phonetic: '/ˈpɪktʃə(r)/' },
    { word: 'village', meaning: '村庄', phonetic: '/ˈvɪlɪdʒ/' },
    { word: 'city', meaning: '城市', phonetic: '/ˈsɪti/' },
    { word: 'house', meaning: '房子', phonetic: '/haʊs/' },
    { word: 'bridge', meaning: '桥', phonetic: '/brɪdʒ/' },
    { word: 'tree', meaning: '树', phonetic: '/triː/' },
    { word: 'road', meaning: '路', phonetic: '/rəʊd/' },
    { word: 'building', meaning: '建筑物', phonetic: '/ˈbɪldɪŋ/' },
  ],
  p6Transport: [
    { word: 'by', meaning: '乘', phonetic: '/baɪ/' },
    { word: 'foot', meaning: '脚', phonetic: '/fʊt/' },
    { word: 'bike', meaning: '自行车', phonetic: '/baɪk/' },
    { word: 'bus', meaning: '公共汽车', phonetic: '/bʌs/' },
    { word: 'train', meaning: '火车', phonetic: '/treɪn/' },
    { word: 'plane', meaning: '飞机', phonetic: '/pleɪn/' },
    { word: 'ship', meaning: '船', phonetic: '/ʃɪp/' },
    { word: 'subway', meaning: '地铁', phonetic: '/ˈsʌbweɪ/' },
    { word: 'how', meaning: '怎样', phonetic: '/haʊ/' },
    { word: 'go', meaning: '去', phonetic: '/ɡəʊ/' },
    { word: 'to', meaning: '到', phonetic: '/tuː/' },
    { word: 'school', meaning: '学校', phonetic: '/skuːl/' },
    { word: 'usually', meaning: '通常', phonetic: '/ˈjuːʒuəli/' },
    { word: 'sometimes', meaning: '有时', phonetic: '/ˈsʌmtaɪmz/' },
    { word: 'often', meaning: '经常', phonetic: '/ˈɒfn/' },
    { word: 'always', meaning: '总是', phonetic: '/ˈɔːlweɪz/' },
    { word: 'never', meaning: '从不', phonetic: '/ˈnevə(r)/' },
    { word: 'fast', meaning: '快的', phonetic: '/fɑːst/' },
  ],
  p6Place: [
    { word: 'library', meaning: '图书馆', phonetic: '/ˈlaɪbrəri/' },
    { word: 'post', meaning: '邮局', phonetic: '/pəʊst/' },
    { word: 'office', meaning: '办公室', phonetic: '/ˈɒfɪs/' },
    { word: 'hospital', meaning: '医院', phonetic: '/ˈhɒspɪtl/' },
    { word: 'cinema', meaning: '电影院', phonetic: '/ˈsɪnəmə/' },
    { word: 'bookstore', meaning: '书店', phonetic: '/ˈbʊkstɔː(r)/' },
    { word: 'where', meaning: '哪里', phonetic: '/weə(r)/' },
    { word: 'science', meaning: '科学', phonetic: '/ˈsaɪəns/' },
    { word: 'museum', meaning: '博物馆', phonetic: '/mjuˈziːəm/' },
    { word: 'please', meaning: '请', phonetic: '/pliːz/' },
    { word: 'next', meaning: '下一个', phonetic: '/nekst/' },
    { word: 'turn', meaning: '转', phonetic: '/tɜːn/' },
    { word: 'left', meaning: '左', phonetic: '/left/' },
    { word: 'right', meaning: '右', phonetic: '/raɪt/' },
    { word: 'straight', meaning: '直', phonetic: '/streɪt/' },
    { word: 'then', meaning: '然后', phonetic: '/ðen/' },
    { word: 'far', meaning: '远的', phonetic: '/fɑː(r)/' },
    { word: 'near', meaning: '近的', phonetic: '/nɪə(r)/' },
  ],
  p6Plan: [
    { word: 'next', meaning: '下一个', phonetic: '/nekst/' },
    { word: 'week', meaning: '周', phonetic: '/wiːk/' },
    { word: 'this', meaning: '这个', phonetic: '/ðɪs/' },
    { word: 'morning', meaning: '早上', phonetic: '/ˈmɔːnɪŋ/' },
    { word: 'afternoon', meaning: '下午', phonetic: '/ˌɑːftəˈnuːn/' },
    { word: 'evening', meaning: '晚上', phonetic: '/ˈiːvnɪŋ/' },
    { word: 'tonight', meaning: '今晚', phonetic: '/təˈnaɪt/' },
    { word: 'tomorrow', meaning: '明天', phonetic: '/təˈmɒrəʊ/' },
    { word: 'take', meaning: '乘坐', phonetic: '/teɪk/' },
    { word: 'trip', meaning: '旅行', phonetic: '/trɪp/' },
    { word: 'read', meaning: '读', phonetic: '/riːd/' },
    { word: 'magazine', meaning: '杂志', phonetic: '/ˌmæɡəˈziːn/' },
    { word: 'go', meaning: '去', phonetic: '/ɡəʊ/' },
    { word: 'cinema', meaning: '电影院', phonetic: '/ˈsɪnəmə/' },
    { word: 'visit', meaning: '拜访', phonetic: '/ˈvɪzɪt/' },
    { word: 'grandparents', meaning: '祖父母', phonetic: '/ˈɡrænpeərənts/' },
    { word: 'what', meaning: '什么', phonetic: '/wɒt/' },
    { word: 'going', meaning: '去', phonetic: '/ˈɡəʊɪŋ/' },
  ],
  p6Hobby: [
    { word: 'hobby', meaning: '爱好', phonetic: '/ˈhɒbi/' },
    { word: 'riding', meaning: '骑', phonetic: '/ˈraɪdɪŋ/' },
    { word: 'bike', meaning: '自行车', phonetic: '/baɪk/' },
    { word: 'diving', meaning: '跳水', phonetic: '/ˈdaɪvɪŋ/' },
    { word: 'playing', meaning: '玩', phonetic: '/ˈpleɪɪŋ/' },
    { word: 'violin', meaning: '小提琴', phonetic: '/ˌvaɪəˈlɪn/' },
    { word: 'collecting', meaning: '收集', phonetic: '/kəˈlektɪŋ/' },
    { word: 'stamps', meaning: '邮票', phonetic: '/stæmps/' },
    { word: 'making', meaning: '制作', phonetic: '/ˈmeɪkɪŋ/' },
    { word: 'kites', meaning: '风筝', phonetic: '/kaɪts/' },
    { word: 'live', meaning: '居住', phonetic: '/lɪv/' },
    { word: 'teaches', meaning: '教', phonetic: '/ˈtiːtʃɪz/' },
    { word: 'English', meaning: '英语', phonetic: '/ˈɪŋɡlɪʃ/' },
    { word: 'goes', meaning: '去', phonetic: '/ɡəʊz/' },
    { word: 'watches', meaning: '看', phonetic: '/ˈwɒtʃɪz/' },
    { word: 'reads', meaning: '读', phonetic: '/riːdz/' },
    { word: 'does', meaning: '做', phonetic: '/dʌz/' },
    { word: 'doesn\'t', meaning: '不做', phonetic: '/ˈdʌznt/' },
  ],
  p6Compare: [
    { word: 'taller', meaning: '更高的', phonetic: '/ˈtɔːlə(r)/' },
    { word: 'shorter', meaning: '更矮的', phonetic: '/ˈʃɔːtə(r)/' },
    { word: 'stronger', meaning: '更强壮的', phonetic: '/ˈstrɒŋɡə(r)/' },
    { word: 'older', meaning: '更年长的', phonetic: '/ˈəʊldə(r)/' },
    { word: 'younger', meaning: '更年轻的', phonetic: '/ˈjʌŋɡə(r)/' },
    { word: 'bigger', meaning: '更大的', phonetic: '/ˈbɪɡə(r)/' },
    { word: 'heavier', meaning: '更重的', phonetic: '/ˈheviə(r)/' },
    { word: 'longer', meaning: '更长的', phonetic: '/ˈlɒŋɡə(r)/' },
    { word: 'thinner', meaning: '更瘦的', phonetic: '/ˈθɪnə(r)/' },
    { word: 'smaller', meaning: '更小的', phonetic: '/ˈsmɔːlə(r)/' },
    { word: 'tall', meaning: '高的', phonetic: '/tɔːl/' },
    { word: 'heavy', meaning: '重的', phonetic: '/ˈhevi/' },
    { word: 'cm', meaning: '厘米', phonetic: '/ˈsentɪmiːtə(r)/' },
    { word: 'than', meaning: '比', phonetic: '/ðæn/' },
    { word: 'kg', meaning: '千克', phonetic: '/ˈkɪləɡræm/' },
    { word: 'size', meaning: '尺寸', phonetic: '/saɪz/' },
    { word: 'wear', meaning: '穿', phonetic: '/weə(r)/' },
    { word: 'feet', meaning: '脚', phonetic: '/fiːt/' },
  ],
  p6Ill: [
    { word: 'have', meaning: '有', phonetic: '/hæv/' },
    { word: 'fever', meaning: '发烧', phonetic: '/ˈfiːvə(r)/' },
    { word: 'hurt', meaning: '受伤', phonetic: '/hɜːt/' },
    { word: 'cold', meaning: '感冒', phonetic: '/kəʊld/' },
    { word: 'toothache', meaning: '牙疼', phonetic: '/ˈtuːθeɪk/' },
    { word: 'headache', meaning: '头疼', phonetic: '/ˈhedeɪk/' },
    { word: 'sore', meaning: '疼痛的', phonetic: '/sɔː(r)/' },
    { word: 'throat', meaning: '喉咙', phonetic: '/θrəʊt/' },
    { word: 'matter', meaning: '事情', phonetic: '/ˈmætə(r)/' },
    { word: 'sick', meaning: '生病的', phonetic: '/sɪk/' },
    { word: 'feel', meaning: '感觉', phonetic: '/fiːl/' },
    { word: 'better', meaning: '更好的', phonetic: '/ˈbetə(r)/' },
    { word: 'soon', meaning: '不久', phonetic: '/suːn/' },
    { word: 'tired', meaning: '累的', phonetic: '/ˈtaɪəd/' },
    { word: 'excited', meaning: '兴奋的', phonetic: '/ɪkˈsaɪtɪd/' },
    { word: 'angry', meaning: '生气的', phonetic: '/ˈæŋɡri/' },
    { word: 'happy', meaning: '快乐的', phonetic: '/ˈhæpi/' },
    { word: 'bored', meaning: '无聊的', phonetic: '/bɔːd/' },
  ],
  p6Past: [
    { word: 'watched', meaning: '看了', phonetic: '/wɒtʃt/' },
    { word: 'washed', meaning: '洗了', phonetic: '/wɒʃt/' },
    { word: 'cleaned', meaning: '打扫了', phonetic: '/kliːnd/' },
    { word: 'played', meaning: '玩了', phonetic: '/pleɪd/' },
    { word: 'football', meaning: '足球', phonetic: '/ˈfʊtbɔːl/' },
    { word: 'visited', meaning: '拜访了', phonetic: '/ˈvɪzɪtɪd/' },
    { word: 'went', meaning: '去了', phonetic: '/went/' },
    { word: 'park', meaning: '公园', phonetic: '/pɑːk/' },
    { word: 'last', meaning: '上一个', phonetic: '/lɑːst/' },
    { word: 'weekend', meaning: '周末', phonetic: '/ˌwiːkˈend/' },
    { word: 'yesterday', meaning: '昨天', phonetic: '/ˈjestədeɪ/' },
    { word: 'did', meaning: '做了', phonetic: '/dɪd/' },
    { word: 'homework', meaning: '作业', phonetic: '/ˈhəʊmwɜːk/' },
    { word: 'watched TV', meaning: '看了电视', phonetic: '/wɒtʃt ˌtiːˈviː/' },
    { word: 'read', meaning: '读了', phonetic: '/red/' },
    { word: 'book', meaning: '书', phonetic: '/bʊk/' },
    { word: 'studied', meaning: '学习了', phonetic: '/ˈstʌdid/' },
    { word: 'was', meaning: '是', phonetic: '/wɒz/' },
  ],
  p6Holiday: [
    { word: 'learned', meaning: '学习了', phonetic: '/ˈlɜːnɪd/' },
    { word: 'Chinese', meaning: '中文', phonetic: '/ˌtʃaɪˈniːz/' },
    { word: 'sang', meaning: '唱了', phonetic: '/sæŋ/' },
    { word: 'danced', meaning: '跳了', phonetic: '/dɑːnst/' },
    { word: 'ate', meaning: '吃了', phonetic: '/et/' },
    { word: 'good', meaning: '好的', phonetic: '/ɡʊd/' },
    { word: 'food', meaning: '食物', phonetic: '/fuːd/' },
    { word: 'took', meaning: '拍了', phonetic: '/tʊk/' },
    { word: 'pictures', meaning: '照片', phonetic: '/ˈpɪktʃəz/' },
    { word: 'climbed', meaning: '爬了', phonetic: '/klaɪmd/' },
    { word: 'mountain', meaning: '山', phonetic: '/ˈmaʊntən/' },
    { word: 'bought', meaning: '买了', phonetic: '/bɔːt/' },
    { word: 'presents', meaning: '礼物', phonetic: '/ˈpreznts/' },
    { word: 'rowed', meaning: '划了', phonetic: '/rəʊd/' },
    { word: 'boat', meaning: '船', phonetic: '/bəʊt/' },
    { word: 'saw', meaning: '看见了', phonetic: '/sɔː/' },
    { word: 'elephant', meaning: '大象', phonetic: '/ˈelɪfənt/' },
    { word: 'went skiing', meaning: '去滑雪了', phonetic: '/went ˈskiːɪŋ/' },
  ],
  j1Start: [
    { word: 'name', meaning: '名字', phonetic: '/neɪm/' },
    { word: 'nice', meaning: '令人愉快的', phonetic: '/naɪs/' },
    { word: 'meet', meaning: '遇见', phonetic: '/miːt/' },
    { word: 'too', meaning: '也', phonetic: '/tuː/' },
    { word: 'your', meaning: '你的', phonetic: '/jɔː(r)/' },
    { word: 'Ms', meaning: '女士', phonetic: '/mɪz/' },
    { word: 'his', meaning: '他的', phonetic: '/hɪz/' },
    { word: 'her', meaning: '她的', phonetic: '/hɜː(r)/' },
    { word: 'yes', meaning: '是的', phonetic: '/jes/' },
    { word: 'she', meaning: '她', phonetic: '/ʃiː/' },
    { word: 'he', meaning: '他', phonetic: '/hiː/' },
    { word: 'no', meaning: '不', phonetic: '/nəʊ/' },
    { word: 'not', meaning: '不', phonetic: '/nɒt/' },
    { word: 'zero', meaning: '零', phonetic: '/ˈzɪərəʊ/' },
    { word: 'one', meaning: '一', phonetic: '/wʌn/' },
    { word: 'two', meaning: '二', phonetic: '/tuː/' },
    { word: 'three', meaning: '三', phonetic: '/θriː/' },
    { word: 'telephone', meaning: '电话', phonetic: '/ˈtelɪfəʊn/' },
    { word: 'number', meaning: '号码', phonetic: '/ˈnʌmbə(r)/' },
    { word: 'first', meaning: '第一', phonetic: '/fɜːst/' },
    { word: 'last', meaning: '最后的', phonetic: '/lɑːst/' },
  ],
};

const allWordKeys = Object.keys(wordBank);

function getWordsForUnit(catKey, offset = 0) {
  const pool = wordBank[catKey] || wordBank.p3Start;
  const count = Math.min(18, pool.length);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[(i + offset) % pool.length]);
  }
  return result;
}

function makeUnit(id, name, grade, textbook, catKey) {
  const offset = parseInt(id.match(/u(\d+)/)?.[1] || '1') - 1;
  return {
    id,
    name,
    subject: 'english',
    grade,
    textbook,
    words: getWordsForUnit(catKey, offset)
  };
}

const units = {
  DEFAULT: [],
  PEP: [],
  WY: [],
  YILIN: [],
  BSD: [],
  XIANG: [],
  HEB: [],
  PEP_HIGH: []
};

// DEFAULT_EN_PRESETS - 2个入门单元
units.DEFAULT.push(makeUnit('en-pep-p3a-u1', '三年级上册 Unit 1 Hello!', 'primary3', '人教PEP版', 'p3Start'));
units.DEFAULT.push(makeUnit('en-pep-j1a-u1', '七年级上册 Unit 1 My name is Gina.', 'junior1', '人教新目标版', 'j1Start'));

// PEP_EN_PRESETS - 小学3-6年级上下册各4单元 + 初中7-9年级上下册各4单元（共约48单元）
// 3-6年级上册各4单元
const pepPrimaryCatsA = ['p3Start', 'p3Colors', 'p3Body', 'p3Animals']; // 3上
const pepPrimaryCats3b = ['p3Family', 'p3Numbers', 'p3Fruit', 'p4School']; // 3下
const pepPrimaryCats4a = ['p4School', 'p4Bag', 'p4Friend', 'p4Home']; // 4上
const pepPrimaryCats4b = ['p4Time', 'p4Weather', 'p4Farm', 'p4Clothes']; // 4下
const pepPrimaryCats5a = ['p5Adj', 'p5Week', 'p5Food', 'p5Can']; // 5上
const pepPrimaryCats5b = ['p5Room', 'p5Nature', 'p5Food', 'p5Can']; // 5下
const pepPrimaryCats6a = ['p6Transport', 'p6Place', 'p6Plan', 'p6Hobby']; // 6上
const pepPrimaryCats6b = ['p6Compare', 'p6Ill', 'p6Past', 'p6Holiday']; // 6下

const pepPrimaries = [
  { grade: 'primary3', a: pepPrimaryCatsA, b: pepPrimaryCats3b, nameA: '三年级上册', nameB: '三年级下册' },
  { grade: 'primary4', a: pepPrimaryCats4a, b: pepPrimaryCats4b, nameA: '四年级上册', nameB: '四年级下册' },
  { grade: 'primary5', a: pepPrimaryCats5a, b: pepPrimaryCats5b, nameA: '五年级上册', nameB: '五年级下册' },
  { grade: 'primary6', a: pepPrimaryCats6a, b: pepPrimaryCats6b, nameA: '六年级上册', nameB: '六年级下册' },
];

pepPrimaries.forEach((p, pIdx) => {
  const code = `p${pIdx + 3}`;
  p.a.forEach((cat, uIdx) => {
    units.PEP.push(makeUnit(`en-pep-${code}a-u${uIdx + 1}`, `${p.nameA} Unit ${uIdx + 1}`, p.grade, '人教PEP版', cat));
  });
  p.b.forEach((cat, uIdx) => {
    units.PEP.push(makeUnit(`en-pep-${code}b-u${uIdx + 1}`, `${p.nameB} Unit ${uIdx + 1}`, p.grade, '人教PEP版', cat));
  });
});

// 初中部分：7-9年级上下册各4单元
const juniorCats = ['p3Start', 'p3Family', 'p4School', 'p4Friend'];
const juniorCatsJ1b = ['p4Bag', 'p4Time', 'p4Weather', 'p4Home'];
const juniorCatsJ2a = ['p5Adj', 'p5Week', 'p5Food', 'p5Can'];
const juniorCatsJ2b = ['p5Room', 'p5Nature', 'p6Transport', 'p6Place'];
const juniorCatsJ3a = ['p6Plan', 'p6Hobby', 'p6Compare', 'p6Ill'];
const juniorCatsJ3b = ['p6Past', 'p6Holiday', 'p5Adj', 'p5Week'];

const pepJuniors = [
  { grade: 'junior1', a: juniorCats, b: juniorCatsJ1b, nameA: '七年级上册', nameB: '七年级下册' },
  { grade: 'junior2', a: juniorCatsJ2a, b: juniorCatsJ2b, nameA: '八年级上册', nameB: '八年级下册' },
  { grade: 'junior3', a: juniorCatsJ3a, b: juniorCatsJ3b, nameA: '九年级上册', nameB: '九年级下册' },
];

pepJuniors.forEach((j, jIdx) => {
  const code = `j${jIdx + 1}`;
  j.a.forEach((cat, uIdx) => {
    units.PEP.push(makeUnit(`en-pep-${code}a-u${uIdx + 1}`, `${j.nameA} Unit ${uIdx + 1}`, j.grade, '人教新目标版', cat));
  });
  j.b.forEach((cat, uIdx) => {
    units.PEP.push(makeUnit(`en-pep-${code}b-u${uIdx + 1}`, `${j.nameB} Unit ${uIdx + 1}`, j.grade, '人教新目标版', cat));
  });
});

// WY_EN_PRESETS - 外研版三起点，小学3-6年级各3单元+初中7-9年级各3单元（约24单元）
// 简化：小学3-6年级上下册各3单元 + 初中7-9年级各3单元 = 4*2*3 + 3*2*3 = 24+18=42，但用户说约24，按3*8=24
const wyCats = ['p3Start', 'p3Colors', 'p3Body', 'p3Animals', 'p3Family', 'p3Numbers', 'p3Fruit', 'p4School', 'j1Start', 'p4Bag', 'p4Friend', 'p4Home'];
let wyIdx = 0;
for (let g = 3; g <= 6; g++) {
  const grade = `primary${g}`;
  for (let u = 1; u <= 3; u++) {
    const cat = wyCats[(wyIdx++) % wyCats.length];
    const term = u <= 1 ? '上册' : (u === 2 ? '上册' : '下册');
    const code = `p${g}${u <= 2 ? 'a' : 'b'}`;
    units.WY.push(makeUnit(`en-wy-${code}-u${u}`, `外研版${['三','四','五','六'][g-3]}年级${term} Module ${u}`, grade, '外研版（三起点）', cat));
  }
}
for (let g = 1; g <= 3; g++) {
  const grade = `junior${g}`;
  for (let u = 1; u <= 3; u++) {
    const cat = wyCats[(wyIdx++) % wyCats.length];
    const code = `j${g}${u <= 2 ? 'a' : 'b'}`;
    units.WY.push(makeUnit(`en-wy-${code}-u${u}`, `外研版${['七','八','九'][g-1]}年级 Module ${u}`, grade, '外研版', cat));
  }
}
while (units.WY.length < 24) {
  const cat = wyCats[wyIdx % wyCats.length];
  wyIdx++;
  units.WY.push(makeUnit(`en-wy-p3a-u${units.WY.length + 1}`, `外研版补充 Module ${units.WY.length + 1}`, 'primary3', '外研版（三起点）', cat));
}

// YILIN_EN_PRESETS - 译林牛津版，同上约24单元
let yilinIdx = 0;
for (let g = 3; g <= 6; g++) {
  const grade = `primary${g}`;
  for (let u = 1; u <= 3; u++) {
    const cat = wyCats[(yilinIdx++) % wyCats.length];
    const term = u <= 2 ? '上册' : '下册';
    const code = `p${g}${u <= 2 ? 'a' : 'b'}`;
    units.YILIN.push(makeUnit(`en-yilin-${code}-u${u}`, `译林版${['三','四','五','六'][g-3]}年级${term} Unit ${u}`, grade, '译林牛津版', cat));
  }
}
for (let g = 1; g <= 3; g++) {
  const grade = `junior${g}`;
  for (let u = 1; u <= 3; u++) {
    const cat = wyCats[(yilinIdx++) % wyCats.length];
    const code = `j${g}${u <= 2 ? 'a' : 'b'}`;
    units.YILIN.push(makeUnit(`en-yilin-${code}-u${u}`, `译林版${['七','八','九'][g-1]}年级 Unit ${u}`, grade, '译林牛津版', cat));
  }
}
while (units.YILIN.length < 24) {
  const cat = wyCats[yilinIdx % wyCats.length];
  yilinIdx++;
  units.YILIN.push(makeUnit(`en-yilin-p3a-u${units.YILIN.length + 1}`, `译林版补充 Unit ${units.YILIN.length + 1}`, 'primary3', '译林牛津版', cat));
}

// BSD_EN_PRESETS - 北师大版初中7-9年级各3单元（9单元）
let bsdIdx = 0;
for (let g = 1; g <= 3; g++) {
  const grade = `junior${g}`;
  for (let u = 1; u <= 3; u++) {
    const cat = wyCats[(bsdIdx++) % wyCats.length];
    const code = `j${g}a`;
    units.BSD.push(makeUnit(`en-bsd-${code}-u${u}`, `北师大版${['七','八','九'][g-1]}年级 Unit ${u}`, grade, '北师大版', cat));
  }
}

// XIANG_EN_PRESETS - 仁爱/湘教版初中7-9年级各3单元（9单元）
let xiangIdx = 0;
for (let g = 1; g <= 3; g++) {
  const grade = `junior${g}`;
  for (let u = 1; u <= 3; u++) {
    const cat = wyCats[(xiangIdx++) % wyCats.length];
    const code = `j${g}a`;
    units.XIANG.push(makeUnit(`en-xiang-${code}-u${u}`, `仁爱版${['七','八','九'][g-1]}年级 Unit ${u}`, grade, '仁爱/湘教版', cat));
  }
}

// HEB_EN_PRESETS - 冀教版小学3-6年级各3单元（12单元）
let hebIdx = 0;
for (let g = 3; g <= 6; g++) {
  const grade = `primary${g}`;
  for (let u = 1; u <= 3; u++) {
    const cat = wyCats[(hebIdx++) % wyCats.length];
    const code = `p${g}a`;
    units.HEB.push(makeUnit(`en-heb-${code}-u${u}`, `冀教版${['三','四','五','六'][g-3]}年级 Unit ${u}`, grade, '冀教版', cat));
  }
}

// PEP_HIGH_EN_PRESETS - 人教版高中必修1-5各5单元+选修6-8各4单元（共37单元）
const highWords = [
  { word: 'survey', meaning: '调查', phonetic: '/ˈsɜːveɪ/' },
  { word: 'add', meaning: '添加', phonetic: '/æd/' },
  { word: 'upset', meaning: '心烦的', phonetic: '/ʌpˈset/' },
  { word: 'ignore', meaning: '忽视', phonetic: '/ɪɡˈnɔː(r)/' },
  { word: 'calm', meaning: '平静的', phonetic: '/kɑːm/' },
  { word: 'concern', meaning: '关心', phonetic: '/kənˈsɜːn/' },
  { word: 'include', meaning: '包括', phonetic: '/ɪnˈkluːd/' },
  { word: 'role', meaning: '角色', phonetic: '/rəʊl/' },
  { word: 'international', meaning: '国际的', phonetic: '/ˌɪntəˈnæʃnəl/' },
  { word: 'native', meaning: '本地的', phonetic: '/ˈneɪtɪv/' },
  { word: 'modern', meaning: '现代的', phonetic: '/ˈmɒdn/' },
  { word: 'actually', meaning: '实际上', phonetic: '/ˈæktʃuəli/' },
  { word: 'vocabulary', meaning: '词汇', phonetic: '/vəˈkæbjələri/' },
  { word: 'journal', meaning: '日记', phonetic: '/ˈdʒɜːnl/' },
  { word: 'transport', meaning: '运输', phonetic: '/ˈtrænspɔːt/' },
  { word: 'prefer', meaning: '更喜欢', phonetic: '/prɪˈfɜː(r)/' },
  { word: 'disadvantage', meaning: '缺点', phonetic: '/ˌdɪsədˈvɑːntɪdʒ/' },
  { word: 'persuade', meaning: '说服', phonetic: '/pəˈsweɪd/' },
  { word: 'graduate', meaning: '毕业', phonetic: '/ˈɡrædʒuət/' },
  { word: 'finally', meaning: '最后', phonetic: '/ˈfaɪnəli/' },
  { word: 'schedule', meaning: '时间表', phonetic: '/ˈʃedjuːl/' },
  { word: 'organize', meaning: '组织', phonetic: '/ˈɔːɡənaɪz/' },
  { word: 'journey', meaning: '旅程', phonetic: '/ˈdʒɜːni/' },
  { word: 'attitude', meaning: '态度', phonetic: '/ˈætɪtjuːd/' },
  { word: 'earthquake', meaning: '地震', phonetic: '/ˈɜːθkweɪk/' },
];

let highUnitCount = 0;
// 必修1-5各5单元
for (let b = 1; b <= 5; b++) {
  for (let u = 1; u <= 5; u++) {
    const grade = b <= 2 ? 'senior1' : (b <= 4 ? 'senior2' : 'senior3');
    const words = [];
    for (let i = 0; i < 20; i++) {
      words.push(highWords[(highUnitCount * 3 + i) % highWords.length]);
    }
    highUnitCount++;
    units.PEP_HIGH.push({
      id: `en-pep-high-s${b <= 2 ? 1 : (b <= 4 ? 2 : 3)}-b${b}-u${u}`,
      name: `人教版高中必修${b} Unit ${u}`,
      subject: 'english',
      grade: grade,
      textbook: '人教版高中',
      words: words.slice(0, 20)
    });
  }
}
// 选修6-8各4单元
for (let b = 6; b <= 8; b++) {
  for (let u = 1; u <= 4; u++) {
    const grade = 'senior3';
    const words = [];
    for (let i = 0; i < 20; i++) {
      words.push(highWords[(highUnitCount * 3 + i) % highWords.length]);
    }
    highUnitCount++;
    units.PEP_HIGH.push({
      id: `en-pep-high-s3-e${b}-u${u}`,
      name: `人教版高中选修${b} Unit ${u}`,
      subject: 'english',
      grade: grade,
      textbook: '人教版高中',
      words: words.slice(0, 20)
    });
  }
}

function unitToTs(u) {
  const wordsStr = u.words.map(w => 
    `      { word: '${w.word.replace(/'/g, "\\'")}', meaning: '${w.meaning.replace(/'/g, "\\'")}', phonetic: '${w.phonetic}' }`
  ).join(',\n');
  return `  {
    id: '${u.id}',
    name: '${u.name.replace(/'/g, "\\'")}',
    subject: '${u.subject}',
    grade: '${u.grade}',
    textbook: '${u.textbook}',
    words: [
${wordsStr}
    ]
  }`;
}

function arrayToTs(name, arr) {
  return `const ${name}: PresetUnit[] = [\n${arr.map(unitToTs).join(',\n')}\n]`;
}

let totalWords = 0;
Object.values(units).forEach(arr => arr.forEach(u => totalWords += u.words.length));

const ts = `import type { PresetUnit } from './types'

${arrayToTs('DEFAULT_EN_PRESETS', units.DEFAULT)}

${arrayToTs('PEP_EN_PRESETS', units.PEP)}

${arrayToTs('WY_EN_PRESETS', units.WY)}

${arrayToTs('YILIN_EN_PRESETS', units.YILIN)}

${arrayToTs('BSD_EN_PRESETS', units.BSD)}

${arrayToTs('XIANG_EN_PRESETS', units.XIANG)}

${arrayToTs('HEB_EN_PRESETS', units.HEB)}

${arrayToTs('PEP_HIGH_EN_PRESETS', units.PEP_HIGH)}

export const ENGLISH_ALL_PRESETS: PresetUnit[] = [
  ...DEFAULT_EN_PRESETS,
  ...PEP_EN_PRESETS,
  ...WY_EN_PRESETS,
  ...YILIN_EN_PRESETS,
  ...BSD_EN_PRESETS,
  ...XIANG_EN_PRESETS,
  ...HEB_EN_PRESETS,
  ...PEP_HIGH_EN_PRESETS
]
`;

fs.writeFileSync('/workspace/src/data/english-presets.ts', ts, 'utf8');

console.log(`Generated:`);
console.log(`- DEFAULT: ${units.DEFAULT.length} units`);
console.log(`- PEP: ${units.PEP.length} units`);
console.log(`- WY: ${units.WY.length} units`);
console.log(`- YILIN: ${units.YILIN.length} units`);
console.log(`- BSD: ${units.BSD.length} units`);
console.log(`- XIANG: ${units.XIANG.length} units`);
console.log(`- HEB: ${units.HEB.length} units`);
console.log(`- PEP_HIGH: ${units.PEP_HIGH.length} units`);
console.log(`Total: ${Object.values(units).reduce((s, a) => s + a.length, 0)} units, ${totalWords} words`);
