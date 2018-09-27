# EADME

    comic-walker decode / download

此模組核心代碼由 Chris Liu 移植 [ComicWalkerWalker](https://github.com/YunzheZJU/ComicWalkerWalker) 至 node.js

## 安裝需求

- [node.js](https://nodejs.org/zh-cn/)

## 安裝

安裝 node.js 後

輸入以下指令

```bash
npm install -g comic-walker
```

### 不知道如何開啟輸入指令視窗的人

可以將以下內容用記事本儲存為 `xxx.bat` (請記得將附檔名改為 `.bat`)
然後點兩下就可以開啟指令視窗

```batch
cmd -k
```

## 使用方法

複製 comic-walker 上漫畫網址

例如 [黒の魔王](https://comic-walker.com/contents/detail/KDCW_MF00000087010000_68/)

https://comic-walker.com/viewer/?tw=2&dlcl=ja&cid=KDCW_MF00000087010001_68

### 以下方法 選一個使用即可

1. 貼上整個網址(前後請加上 `"` )
```bash
npx comic-walker "https://comic-walker.com/viewer/?tw=2&dlcl=ja&cid=KDCW_MF00000087010001_68"
```

2. 貼上 cid 的部份
```bash
npx comic-walker KDCW_MF00000087010001_68
```

### 接著等待下載完成

檔案會下載在目前資料夾底下
