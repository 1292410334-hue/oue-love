# 崇新 & 艺萌的小网站——发布说明

## 一、在电脑上打开（先看效果）
直接双击 `index.html`。如果双击后样式或图片不正常，在本文件夹按住 Shift + 右键 → “在此处打开 PowerShell 窗口”，运行：

```powershell
python -m http.server 8000
```

然后浏览器打开 http://localhost:8000

## 二、发布到 GitHub Pages（生成可以发给别人的网址）

### 方式 A：网页拖拽上传（最省事，推荐）

1. 打开 https://github.com/new
2. Repository name 填：`our-love`（也可以换成你喜欢的名字，比如 `cx-ym`）
3. 选择 **Public**，不要勾选 “Add a README file”
4. 点 **Create repository**
5. 在仓库页面点 **uploading an existing file**（或 “Add file” → “Upload files”）
6. 把本文件夹里的全部内容（4 个文件 + `images` 文件夹）拖进去，点 **Commit changes**
7. 点仓库顶部的 **Settings** → 左侧 **Pages**
8. Build and deployment 里：Source 选 **Deploy from a branch**，Branch 选 **main**，文件夹选 **/(root)**，点 Save
9. 等 1-2 分钟，刷新 Pages 页面，会显示一个网址：
   `https://你的GitHub用户名.github.io/our-love/`
10. 把这个网址发给女朋友即可。

### 方式 B：命令行上传（如果你愿意装 GitHub CLI）

在 PowerShell 里运行（把 `你的用户名` 换成自己的）：

```powershell
winget install --id GitHub.cli
gh auth login
cd C:\Users\lv\workspace\codex_work\our-love
git init
git add .
git commit -m "our love site"
gh repo create our-love --public --source=. --remote=origin --push
gh api -X PUT repos/你的用户名/our-love/pages -F 'source[branch]=main' -F 'source[path]=/'
```

网址：`https://你的用户名.github.io/our-love/`

## 三、以后怎么改内容
只改 `config.js`：名字、纪念日、情话、时间轴、照片文件名都在里面。
改完重新上传覆盖对应文件即可，网址不变，网页 1-2 分钟后自动更新。

## 四、换照片
把照片放进 `images` 文件夹（建议 jpg/png），然后在 `config.js` 的 `photos` 里改文件名，例如：

```js
{ src: "images/我的照片.jpg", caption: "第一次一起看海" }
```

注意：文件名和路径要和文件夹里的完全一致（大小写也要一致）。
