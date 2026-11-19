# 歡樂派對 🎉

動森風格的換裝＋熱血亂鬥網頁遊戲：捏臉創角、百件衣飾換裝、八大場景探索（家、商店街、公園、沙灘），
走進市場就開打——三連擊、戰鬥龍捲風、蓋亞能量炮、十種升級技能、六色屬性球、每五波魔王機器人。
進度自動存在瀏覽器（localStorage），支援手機／平板觸控。

**單一 HTML 檔、完全離線可玩**：下載 `index.html` 直接雙擊開啟即可。

## 操作
- 左下搖桿或 WASD 移動，點地板走過去；拖曳旋轉視角、雙指縮放
- 戰鬥：點 👊 出拳（三連擊）、按住 1 秒放開＝戰鬥龍捲風、⚡集滿放開＝蓋亞能量炮

## 技術與授權
- 引擎：[three.js](https://threejs.org/)（MIT License，已內嵌）
- 字型：[jf open 粉圓 / open-huninn](https://github.com/justfont/open-huninn-font)（SIL Open Font License 1.1，以子集內嵌）
- 其餘程式、音效（WebAudio 即時合成）與所有 3D 造型美術皆為本專案原創（程式生成，無任何外部素材）

## 開發
原始碼在 `src/`，修改後執行 `cd src && node build.js` 重新打包產出 `index.html`。
