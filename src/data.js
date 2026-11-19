'use strict';
/* ===== 色盤 ===== */
const SKIN=['#ffe3d2','#fdd1b2','#f3b68f','#dca06f','#c3875a','#a56a40','#7c4a2b','#573321'];
const HAIRCOL=['#2b1b17','#4a2c1c','#7a4a2a','#a8672e','#d9a441','#f1d27a','#c44a2b','#8a2b2b','#e86a8c','#f4a6c0','#7b4bb8','#3f6fd1','#3bb3c9','#3fae6a','#d8d8d8','#ffffff'];
const EYECOL=['#3a2a24','#6b4226','#3d6fb5','#3f9a5f','#8a6bc4','#c9892b','#6a7a86','#c4476b'];
const LIPCOL=['#c4605a','#e88a8a','#b84a5a','#d98a6a','#8a3b3b','#f2a6b8','#a8584a','#e0605a'];
const CLOTHCOL=['#e8505b','#f59a3c','#f7d44a','#9bd45a','#3fae6a','#3bb3c9','#6bb6f2','#3f6fd1','#2a3a78','#8e5bc9','#f48fb1','#fafafa','#9aa0a6','#2b2b30','#8a5a3a','#f0dcb4'];

/* ===== 臉部 ===== */
// sx/sy 頭型縮放, es 眼距倍率, ey 五官上下位移(rad)
const FACES=[
 {sx:1.00,sy:0.95,es:1.00,ey:0.00},{sx:1.06,sy:0.92,es:1.08,ey:0.02},
 {sx:0.96,sy:1.00,es:0.94,ey:-0.03},{sx:1.10,sy:0.96,es:1.12,ey:0.03},
 {sx:1.02,sy:0.88,es:1.00,ey:0.05},{sx:0.94,sy:1.00,es:0.90,ey:0.00},
 {sx:1.04,sy:1.04,es:1.04,ey:-0.05},{sx:1.12,sy:0.90,es:1.15,ey:0.04}];
const FACE_N=FACES.map((_,i)=>'臉型 '+(i+1));
const EYE_N=['圓圓眼','直長眼','豆豆眼','瞇瞇眼','貓眼','閃亮眼','笑眼','銳利眼'];
const BROW_N=['平眉','彎眉','粗眉','細長眉','上揚眉','八字眉','圓點眉','短斜眉'];
const NOSE_N=['小圓點','小勾','小三角','橢圓','雙孔','小線'];
const MOUTH_N=['微笑','小圓嘴','大笑','一字嘴','貓嘴','嘟嘴','露齒笑','壞笑'];
const CHEEK_N=['無','柔和腮紅','圓圓腮紅','斜線腮紅'];
const FRECK_N=['無','少許雀斑','滿臉雀斑'];

/* ===== 髮型 =====
 fr 瀏海  sd 兩側長度(0~3)  bk 後面長度(0~3)  ex 額外造型  vol 蓬度  cap 頭頂覆蓋 */
const HAIR={
 m:[
  {n:'清爽短髮',fr:'short',sd:0,bk:0,ex:[]},
  {n:'旁分',fr:'side',sd:0,bk:0,ex:[]},
  {n:'蘑菇頭',fr:'straight',sd:1,bk:1,ex:[]},
  {n:'刺蝟頭',fr:'none',sd:0,bk:0,ex:['spikes']},
  {n:'飛機頭',fr:'short',sd:0,bk:0,ex:['pomp']},
  {n:'平頭',fr:'none',sd:0,bk:0,ex:[],vol:0.97,cap:0.8},
  {n:'爆炸頭',fr:'none',sd:0,bk:0,ex:['afro'],cap:0.5},
  {n:'中長髮',fr:'curtain',sd:2,bk:2,ex:[]},
  {n:'小馬尾',fr:'side',sd:0,bk:0,ex:['pony']},
  {n:'武士髻',fr:'none',sd:0,bk:0,ex:['knot']},
  {n:'龐克雞冠',fr:'none',sd:0,bk:0,ex:['mohawk'],cap:0.5,vol:0.97},
  {n:'呆毛男孩',fr:'short',sd:0,bk:0,ex:['ahoge']}],
 f:[
  {n:'鮑伯頭',fr:'straight',sd:2,bk:2,ex:[]},
  {n:'長直髮',fr:'straight',sd:3,bk:3,ex:[]},
  {n:'雙馬尾',fr:'straight',sd:0,bk:0,ex:['twin']},
  {n:'高馬尾',fr:'side',sd:0,bk:0,ex:['pony']},
  {n:'丸子頭',fr:'center',sd:0,bk:0,ex:['bun']},
  {n:'雙丸子',fr:'center',sd:0,bk:0,ex:['twinbun']},
  {n:'側邊馬尾',fr:'side',sd:1,bk:0,ex:['sidepony']},
  {n:'公主捲髮',fr:'curtain',sd:3,bk:3,ex:['curl']},
  {n:'麻花辮',fr:'center',sd:1,bk:1,ex:['braid']},
  {n:'俏麗短髮',fr:'side',sd:1,bk:1,ex:[]},
  {n:'姬髮式',fr:'straight',sd:3,bk:3,ex:['sidelocks']},
  {n:'蓬鬆大捲',fr:'curtain',sd:2,bk:2,ex:['fluff'],cap:0.6}]
};

/* ===== 預設 ===== */
const DEFAULT_CFG={sex:'f',skin:1,face:0,hair:0,hairCol:1,brow:1,browCol:-1,eye:0,eyeCol:1,nose:0,mouth:0,lipCol:0,cheek:1,freckle:0,headSize:1,faceW:1,faceH:1,featY:0,featS:1,height:1,chest:1,waist:1,legs:1};

/* ===== 衣物 ===== */
// c1 主色  c2 副色(可選)
const TOPS=[
 {id:'tee',n:'短袖T恤',c1:'#f7d44a',def:{sl:'short',neck:'round'}},
 {id:'longtee',n:'長袖T恤',c1:'#6bb6f2',def:{sl:'long',neck:'round'}},
 {id:'tank',n:'無袖背心',c1:'#fafafa',def:{sl:'none',neck:'round'}},
 {id:'stripe',n:'條紋衫',c1:'#fafafa',c2:'#3f6fd1',def:{sl:'long',neck:'round',pat:'stripe'}},
 {id:'hoodie',n:'連帽衫',c1:'#f48fb1',c2:'#fafafa',def:{sl:'long',neck:'hood',hem:0.4,ex:['pocket']}},
 {id:'shirt',n:'襯衫',c1:'#fafafa',c2:'#e8e8e8',def:{sl:'long',neck:'collar',ex:['buttons']}},
 {id:'sweater',n:'高領毛衣',c1:'#f59a3c',c2:'#f0dcb4',def:{sl:'long',neck:'turtle',pat:'border',hem:0.44}},
 {id:'sailor',n:'水手服',c1:'#fafafa',c2:'#2a3a78',def:{sl:'short',neck:'sailor'}},
 {id:'track',n:'運動外套',c1:'#e8505b',c2:'#fafafa',def:{sl:'long',neck:'turtle',ex:['zip','cuff']}},
 {id:'dots',n:'點點衫',c1:'#f48fb1',c2:'#fafafa',def:{sl:'short',neck:'round',pat:'dots'}},
 {id:'heart',n:'愛心T恤',c1:'#fafafa',c2:'#e8505b',def:{sl:'short',neck:'round',pat:'heart'}},
 {id:'starlong',n:'星星長袖',c1:'#2a3a78',c2:'#f7d44a',def:{sl:'long',neck:'round',pat:'star'}},
 {id:'plaid',n:'格紋襯衫',c1:'#e8505b',c2:'#2b2b30',def:{sl:'long',neck:'collar',pat:'check',ex:['buttons']}},
 {id:'puff',n:'蓬袖蝴蝶結衫',c1:'#fafafa',c2:'#f48fb1',def:{sl:'puff',neck:'bow'}},
 {id:'apron',n:'工作圍裙',c1:'#fafafa',c2:'#e8505b',def:{sl:'short',neck:'round',ex:['apron']}},
 {id:'coat',n:'格紋大衣',c1:'#6b3a2e',c2:'#2b1b17',def:{sl:'long',neck:'collar',pat:'check',hem:0.3,ex:['buttons']}},
 {id:'gradient',n:'漸層上衣',c1:'#f48fb1',c2:'#6bb6f2',def:{sl:'short',neck:'round',pat:'gradient'}}
];
const BOTTOMS=[
 {id:'jeans',n:'長褲',c1:'#3f6fd1',def:{t:'pants',len:'long'}},
 {id:'shorts',n:'短褲',c1:'#f0dcb4',def:{t:'pants',len:'short'}},
 {id:'capri',n:'七分褲',c1:'#9aa0a6',def:{t:'pants',len:'mid'}},
 {id:'overall',n:'吊帶褲',c1:'#3f6fd1',c2:'#f7d44a',def:{t:'pants',len:'long',ex:['bib']}},
 {id:'wide',n:'寬管褲',c1:'#8a5a3a',def:{t:'pants',len:'long',wide:1}},
 {id:'bloomer',n:'燈籠褲',c1:'#8e5bc9',c2:'#f7d44a',def:{t:'pants',len:'mid',wide:2}},
 {id:'mini',n:'迷你裙',c1:'#e8505b',def:{t:'skirt',len:'short',flare:0.05}},
 {id:'pleat',n:'百褶格裙',c1:'#2a3a78',c2:'#3f6fd1',def:{t:'skirt',len:'mid',flare:0.07,pat:'check'}},
 {id:'aline',n:'A字長裙',c1:'#f7d44a',def:{t:'skirt',len:'long',flare:0.10}},
 {id:'tutu',n:'蓬蓬裙',c1:'#f48fb1',def:{t:'skirt',len:'mid',flare:0.20}},
 {id:'sport',n:'運動短褲',c1:'#3f6fd1',c2:'#fafafa',def:{t:'pants',len:'short',pat:'border'}},
 {id:'dotskirt',n:'點點裙',c1:'#6bb6f2',c2:'#fafafa',def:{t:'skirt',len:'mid',flare:0.09,pat:'dots'}}
];
const DRESSES=[
 {id:'sundress',n:'夏日連身裙',c1:'#f48fb1',c2:'#fafafa',def:{top:{sl:'short',neck:'round'},bot:{t:'skirt',len:'mid',flare:0.09},pat:'solid'}},
 {id:'strap',n:'吊帶洋裝',c1:'#6bb6f2',c2:'#fafafa',def:{top:{sl:'none',neck:'round'},bot:{t:'skirt',len:'mid',flare:0.09},pat:'dots'}},
 {id:'gown',n:'華麗禮服',c1:'#8e5bc9',c2:'#f7d44a',def:{top:{sl:'none',neck:'round'},bot:{t:'skirt',len:'long',flare:0.17},pat:'border'}},
 {id:'princess',n:'公主洋裝',c1:'#f48fb1',c2:'#fafafa',def:{top:{sl:'puff',neck:'bow'},bot:{t:'skirt',len:'mid',flare:0.22},pat:'solid'}},
 {id:'yukata',n:'浴衣',c1:'#2a3a78',c2:'#f48fb1',def:{top:{sl:'long',neck:'round'},bot:{t:'skirt',len:'long',flare:0.0,ex:['obi']},pat:'star'}},
 {id:'jumpsuit',n:'連身褲',c1:'#f59a3c',c2:'#fafafa',def:{top:{sl:'short',neck:'collar'},bot:{t:'pants',len:'long'},pat:'solid'}},
 {id:'swim',n:'泳衣',c1:'#3bb3c9',c2:'#fafafa',def:{top:{sl:'none',neck:'round'},bot:{t:'pants',len:'tiny'},pat:'stripe'}},
 {id:'maid',n:'女僕裝',c1:'#2b2b30',c2:'#fafafa',def:{top:{sl:'puff',neck:'bow',ex:['apron']},bot:{t:'skirt',len:'mid',flare:0.10},pat:'solid'}},
 {id:'pajama',n:'連身睡衣',c1:'#6bb6f2',c2:'#fafafa',def:{top:{sl:'long',neck:'round'},bot:{t:'pants',len:'long',wide:1},pat:'star'}},
 {id:'check',n:'格紋洋裝',c1:'#e8505b',c2:'#fafafa',def:{top:{sl:'short',neck:'collar'},bot:{t:'skirt',len:'mid',flare:0.11},pat:'check'}}
];
const SOCKS=[
 {id:'ankle',n:'短襪',c1:'#fafafa',def:{len:'ankle'}},
 {id:'crew',n:'中筒襪',c1:'#9aa0a6',def:{len:'crew'}},
 {id:'knee',n:'及膝襪',c1:'#2a3a78',def:{len:'knee'}},
 {id:'over',n:'過膝襪',c1:'#2b2b30',def:{len:'over'}},
 {id:'stripeknee',n:'條紋長襪',c1:'#fafafa',c2:'#f48fb1',def:{len:'knee',pat:'stripe'}},
 {id:'dotcrew',n:'點點襪',c1:'#6bb6f2',c2:'#fafafa',def:{len:'crew',pat:'dots'}},
 {id:'tights',n:'褲襪',c1:'#2b2b30',def:{len:'tights'}},
 {id:'starknee',n:'星星長襪',c1:'#8e5bc9',c2:'#f7d44a',def:{len:'knee',pat:'star'}}
];
const SHOES=[
 {id:'sneaker',n:'運動鞋',c1:'#e8505b',c2:'#fafafa',def:{sh:'sneaker'}},
 {id:'loafer',n:'皮鞋',c1:'#2b2b30',c2:'#4a4a50',def:{sh:'loafer'}},
 {id:'boot',n:'短靴',c1:'#8a5a3a',c2:'#4a2c1c',def:{sh:'boot'}},
 {id:'tallboot',n:'長靴',c1:'#2b2b30',c2:'#4a4a50',def:{sh:'tallboot'}},
 {id:'sandal',n:'涼鞋',c1:'#f59a3c',c2:'#8a5a3a',def:{sh:'sandal'}},
 {id:'geta',n:'木屐',c1:'#c68a4a',c2:'#e8505b',def:{sh:'geta'}},
 {id:'rain',n:'雨靴',c1:'#f7d44a',c2:'#9aa0a6',def:{sh:'rain'}},
 {id:'mary',n:'娃娃鞋',c1:'#2b2b30',c2:'#fafafa',def:{sh:'mary'}},
 {id:'slipper',n:'室內拖鞋',c1:'#f48fb1',c2:'#fafafa',def:{sh:'slipper'}},
 {id:'highcut',n:'高筒帆布鞋',c1:'#3f6fd1',c2:'#fafafa',def:{sh:'highcut'}}
];
const HATS=[
 {id:'cap',n:'棒球帽',c1:'#e8505b',c2:'#fafafa',cover:1},
 {id:'beanie',n:'毛線帽',c1:'#3bb3c9',c2:'#fafafa',cover:1},
 {id:'witch',n:'巫師帽',c1:'#8e5bc9',c2:'#f7d44a',cover:1},
 {id:'tophat',n:'紳士禮帽',c1:'#2b2b30',c2:'#e8505b',cover:1},
 {id:'beret',n:'貝雷帽',c1:'#e8505b',c2:'#e8505b',cover:1},
 {id:'straw',n:'草帽',c1:'#f0dcb4',c2:'#e8505b',cover:1},
 {id:'bow',n:'大蝴蝶結',c1:'#f48fb1',c2:'#fafafa'},
 {id:'flowers',n:'花環',c1:'#f48fb1',c2:'#fafafa'},
 {id:'cat',n:'貓耳',c1:'#2b2b30',c2:'#f48fb1'},
 {id:'bunny',n:'兔耳',c1:'#fafafa',c2:'#f48fb1'},
 {id:'crown',n:'皇冠',c1:'#f7d44a',c2:'#e8505b'},
 {id:'chef',n:'廚師帽',c1:'#fafafa',c2:'#e8e8e8',cover:1},
 {id:'sailorcap',n:'水手帽',c1:'#fafafa',c2:'#2a3a78',cover:1},
 {id:'bandana',n:'頭巾',c1:'#e8505b',c2:'#fafafa',cover:1},
 {id:'helmet',n:'安全帽',c1:'#f7d44a',c2:'#f59a3c',cover:1},
 {id:'headband',n:'運動髮帶',c1:'#e8505b',c2:'#fafafa'},
 {id:'bear',n:'熊耳',c1:'#8a5a3a',c2:'#f0dcb4'},
 {id:'horns',n:'小惡魔角',c1:'#e8505b',c2:'#e8505b'},
 {id:'halo',n:'天使光環',c1:'#f7d44a',c2:'#f7d44a'},
 {id:'cowboy',n:'牛仔帽',c1:'#8a5a3a',c2:'#f0dcb4',cover:1},
 {id:'newsboy',n:'報童帽',c1:'#e8dcc8',c2:'#e8dcc8',cover:1},
 {id:'bucket',n:'漁夫帽',c1:'#b9792f',c2:'#8a5a3a',cover:1},
 {id:'slouch',n:'長版毛帽',c1:'#2b2b30',c2:'#2b2b30',cover:1},
 {id:'santa',n:'聖誕帽',c1:'#e8505b',c2:'#fafafa',cover:1}
];
const FACEACC=[
 {id:'round',n:'圓框眼鏡',c1:'#2b2b30'},
 {id:'square',n:'方框眼鏡',c1:'#8a5a3a'},
 {id:'sun',n:'太陽眼鏡',c1:'#2b2b30',c2:'#2b2b30'},
 {id:'heart',n:'愛心眼鏡',c1:'#f48fb1'},
 {id:'patch',n:'海盜眼罩',c1:'#2b2b30'},
 {id:'mask',n:'口罩',c1:'#fafafa'},
 {id:'clown',n:'小丑紅鼻',c1:'#e8505b'},
 {id:'whisker',n:'貓咪鬍鬚',c1:'#2b2b30'},
 {id:'mustache',n:'小鬍子',c1:'#4a2c1c'}
];
const BACKS=[
 {id:'pack',n:'後背包',c1:'#f59a3c',c2:'#8a5a3a'},
 {id:'satchel',n:'斜背包',c1:'#8a5a3a',c2:'#f0dcb4'},
 {id:'cape',n:'披風',c1:'#e8505b',c2:'#f7d44a'},
 {id:'angel',n:'天使翅膀',c1:'#fafafa',c2:'#f1f1f1'},
 {id:'butterfly',n:'蝴蝶翅膀',c1:'#f48fb1',c2:'#8e5bc9'},
 {id:'devil',n:'惡魔翅膀',c1:'#8a2b2b',c2:'#2b2b30'},
 {id:'cattail',n:'貓尾巴',c1:'#2b2b30',c2:'#f48fb1'},
 {id:'foxtail',n:'狐狸尾巴',c1:'#f59a3c',c2:'#fafafa'},
 {id:'shell',n:'烏龜殼',c1:'#3fae6a',c2:'#8a5a3a'}
];
const ITEMS={top:TOPS,bottom:BOTTOMS,dress:DRESSES,socks:SOCKS,shoes:SHOES,hat:HATS,face:FACEACC,back:BACKS};
function findItem(slot,id){const a=ITEMS[slot];for(let i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null;}

/* ===== 套裝 ===== */
const SETS=[
 {n:'水手少女',p:{top:['sailor'],bottom:['pleat'],socks:['knee','#fafafa'],shoes:['mary']}},
 {n:'小廚師',p:{top:['apron'],bottom:['jeans','#9aa0a6'],shoes:['sneaker','#fafafa','#9aa0a6'],hat:['chef']}},
 {n:'魔法使',p:{dress:['gown','#8e5bc9','#f7d44a'],hat:['witch'],shoes:['tallboot'],back:['cape','#2a3a78','#f7d44a']}},
 {n:'公主殿下',p:{dress:['princess'],hat:['crown'],socks:['ankle'],shoes:['mary','#f48fb1','#fafafa']}},
 {n:'小熊睡衣',p:{dress:['pajama','#c68a4a','#f0dcb4'],hat:['bear'],shoes:['slipper','#f0dcb4','#fafafa']}},
 {n:'貓咪少女',p:{top:['hoodie','#2b2b30','#f48fb1'],bottom:['mini','#f48fb1'],socks:['knee','#2b2b30'],shoes:['sneaker','#2b2b30','#fafafa'],hat:['cat'],back:['cattail']}},
 {n:'兔兔派對',p:{top:['hoodie','#fafafa','#f48fb1'],bottom:['shorts','#f48fb1'],socks:['crew','#fafafa'],shoes:['highcut','#f48fb1','#fafafa'],hat:['bunny']}},
 {n:'運動少年',p:{top:['track'],bottom:['sport'],socks:['crew','#fafafa'],shoes:['sneaker','#3f6fd1','#fafafa'],hat:['headband']}},
 {n:'紳士',p:{top:['shirt'],bottom:['jeans','#2b2b30'],shoes:['loafer'],hat:['tophat'],face:['mustache']}},
 {n:'夏日祭典',p:{dress:['yukata'],socks:['ankle'],shoes:['geta'],hat:['flowers']}},
 {n:'小天使',p:{dress:['sundress','#fafafa','#fafafa'],hat:['halo'],shoes:['sandal','#f7d44a','#fafafa'],back:['angel']}},
 {n:'小惡魔',p:{top:['tank','#2b2b30'],bottom:['shorts','#e8505b'],socks:['over','#2b2b30'],shoes:['boot','#2b2b30','#e8505b'],hat:['horns'],back:['devil']}},
 {n:'西部牛仔',p:{top:['plaid'],bottom:['overall'],shoes:['boot'],hat:['cowboy']}},
 {n:'海灘度假',p:{dress:['swim'],hat:['straw'],shoes:['sandal'],face:['sun']}},
 {n:'聖誕快樂',p:{dress:['sundress','#e8505b','#fafafa'],hat:['santa'],socks:['stripeknee','#fafafa','#e8505b'],shoes:['tallboot','#8a5a3a','#4a2c1c']}},
 {n:'花仙子',p:{dress:['strap','#9bd45a','#fafafa'],hat:['flowers'],shoes:['mary','#f48fb1','#fafafa'],back:['butterfly']}},
 {n:'女僕咖啡',p:{dress:['maid'],socks:['over','#fafafa'],shoes:['mary'],hat:['bow','#fafafa','#fafafa']}},
 {n:'小海軍',p:{top:['stripe'],bottom:['capri','#2a3a78'],shoes:['sneaker','#fafafa','#2a3a78'],hat:['sailorcap']}},
 {n:'探險家',p:{top:['shirt','#f0dcb4'],bottom:['capri','#8a5a3a'],socks:['crew','#f0dcb4'],shoes:['boot'],hat:['helmet'],back:['pack']}},
 {n:'小烏龜',p:{top:['tee','#9bd45a'],bottom:['shorts','#3fae6a'],shoes:['sandal'],back:['shell']}}
];
