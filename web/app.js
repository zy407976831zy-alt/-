const stylePresets = {
  forest: {
    name: "明亮森系花园婚礼",
    overall: "高端户外婚礼杂志感人像 / 明亮森系花园婚纱照 / 通透自然光 bridal editorial 风格",
    scene:
      "明亮户外森系婚礼场景，白色花拱、白色花材、羽毛草、柔软绿色草地、远处森林和雪山氛围。整体干净、高级、通透，花艺丰富但不能杂乱，背景必须像真实外景拍摄，不要 AI 贴图感。",
    pose:
      "根据任务表的动作表情选项执行。若动作保持，则保留原片动作和表情，只让场景适配人物。若小幅调整，则只微调手位、头部角度、裙摆和眼神。若重新设计，则做自然、端庄、松弛的婚纱摄影姿态，但必须保留客户脸和身份。",
    wardrobe:
      "根据任务表的服装参考选项执行。可参考白色婚纱、头纱、轻盈布料、自然垂坠和花艺搭配。服装必须真实、端庄、高级，不能破坏身体比例，不能出现不合理布料结构。",
    lighting:
      "通透自然日光，柔和高亮，轻微逆光或侧逆光，面部光线干净柔和，阴影浅而有层次。白色婚纱和花材要有真实高光层次，不能过曝成一片白。人物和背景光线方向必须一致。",
    color:
      "白色、象牙白、浅绿、草地绿、天空蓝和柔和暖阳色。中低饱和，高级干净，不要艳丽，不要 HDR。整体像真实户外婚礼摄影后期。",
    camera:
      "50mm 或 85mm 人像镜头，横构图或竖构图均可。根据原片构图保持自然叙事，景深柔和，背景能看出森林、草地和花艺空间关系。",
    keywords:
      "bright garden bridal editorial, natural daylight wedding photography, white floral arch, airy green foliage, realistic skin texture, high-end bridal retouching, soft film look, elegant outdoor wedding portrait",
  },
  bedroom: {
    name: "复古暖调卧室情绪肖像",
    overall: "高端时尚杂志感情绪肖像 / 复古暖调生活方式人像 / 电影感 editorial portrait 风格",
    scene:
      "复古酒店卧室或暖调室内空间，背景为简洁的木质墙面或木质床头板，人物置于暖棕色、焦糖色或奶咖色床面/软垫之上。环境极简、安静、高级，具有生活方式杂志拍摄氛围。",
    pose:
      "人物呈现侧卧或俯卧趴靠在床面上的姿势，身体自然舒展，头部侧靠在手臂或床面，眼神安静、疏离、带有轻微情绪感。动作不要夸张，整体呈现慵懒、克制、安静、轻复古的高级情绪。",
    wardrobe:
      "根据任务表的服装参考选项执行。若允许参考服装，则把穿搭调整为参考图的高级生活方式杂志感，强调布料质感、垂坠感、褶皱层次和自然遮挡关系。若不允许参考服装，则保留原服装，仅优化质感。",
    lighting:
      "柔和暖色主光，像窗边自然光与室内暖光混合。低对比度，面部高光细腻柔和，阴影轻柔，有层次但不过硬。整体包裹式布光，不要生硬闪光感。",
    color:
      "暖棕、奶咖、焦糖、木质琥珀色影调。中低饱和，轻微胶片感，整体偏复古暖色电影风。色调克制、安静、高级，不鲜艳，不过分通透。",
    camera:
      "50mm 或 85mm 人像镜头，横构图，中近景到半身/全身横向叙事构图。景深柔和，背景轻微虚化但可辨识空间关系。",
    keywords:
      "editorial lifestyle portrait, cinematic warm tone, vintage bedroom aesthetic, soft ambient lighting, moody warm interior, luxury magazine style, realistic skin texture, elegant emotional portrait, film look, high-end retouching",
  },
  analyzed: {
    name: "参考图分析结果",
    sourceReferenceName: "",
    overall: "",
    scene: "",
    pose: "",
    wardrobe: "",
    lighting: "",
    color: "",
    camera: "",
    keywords: "",
  },
};

const $ = (id) => document.getElementById(id);
let analyzedReferenceName = "";
let latestJpgUrl = "";
let latestJobId = "";
let batchItems = [];
let totalGeneratedImages = Number(localStorage.getItem("ylrx_total_generated_images") || "0");
let resultHistory = JSON.parse(localStorage.getItem("ylrx_result_history") || "[]");
let styleGalleryImages = [];
let activeStyleId = "highkey";
let selectedStyleReference = null;

const defaultQaCriteria = [
  "脸部未达到95%以上本人相似度或身份发生变化",
  "AI感、贴图感、一眼假",
  "皮肤塑料、过度磨皮、没有毛孔",
  "人物商业精修不到位，皮肤、肩颈、手臂、服装质感不达标",
  "参考图色调没有还原，冷暖、灰阶、饱和度或对比度明显不一致",
  "画面像相机直出，没有商业调色、灰阶层次和高级色彩关系",
  "光影、色温、阴影不统一",
  "参考图是柔光，但生成结果变成硬光、硬闪或硬广告光",
  "人物胖瘦、头身比例或画面比例失衡",
  "手脚、发丝、服装、婚纱有明显畸变",
  "手部结构错误：手指数量、手腕、手掌比例、关节或遮挡关系不自然",
  "脚部结构错误：左右脚关系、脚踝、鞋尖、脚背、落地点或遮挡关系不自然",
  "发型、服装、动作超出任务允许范围",
  "参考图视觉重点缺失，例如头纱、裙摆、花束、道具或特殊动作没有生成",
  "这张图会损害门店专业度和客户信任",
];

const costConfig = {
  model: "gpt-image-2",
  size: "按所选画幅",
  quality: "high",
  estimatedCnyPerImage: 1,
  estimatedReferenceAnalysisCny: 0.05,
};

let activeStyleCategory = "studio";
const styleLibrary = [
  { id: "highkey", category: "studio", name: "高调白纱幸福感", tags: "柔光白底 / 蕾丝头纱 / 幸福感", images: ["style-032.png", "style-052.png", "style-060.png"] },
  { id: "korean", category: "studio", name: "韩式极简棚拍", tags: "白灰棚拍 / 轻透肤色 / 自然笑容", images: ["style-025.png", "style-039.png", "style-049.png", "style-055.png", "style-079.png", "style-095.png"] },
  { id: "couple-white", category: "studio", name: "白底情侣样片风", tags: "白底情侣 / 干净幸福 / 样片海报", images: ["style-005.png", "style-041.png", "style-085.png"] },
  { id: "veil", category: "studio", name: "头纱特写情绪片", tags: "近景头纱 / 蕾丝细节 / 安静情绪", images: ["style-003.png", "style-004.png", "style-016.png", "style-038.png", "style-046.png", "style-058.png", "style-078.png", "style-082.png", "style-083.png", "style-088.png", "style-096.png"] },
  { id: "xiuhe", category: "studio", name: "中式秀禾喜嫁", tags: "秀禾服 / 红色喜嫁 / 传统仪式感", images: ["style-014.png", "style-026.png", "style-027.png", "style-036.png", "style-070.png", "style-073.png", "style-074.png", "style-075.png", "style-093.png", "style-107.png", "style-108.png"] },
  { id: "red-gold", category: "studio", name: "新中式红金婚纱", tags: "红金色调 / 中式仪式 / 高级喜嫁", images: ["style-009.png", "style-023.png", "style-054.png", "style-100.png", "style-120.png"] },
  { id: "palace", category: "studio", name: "法式宫廷内景", tags: "宫廷空间 / 暖光纱裙 / 花瓣地景", images: ["style-001.png", "style-006.png", "style-007.png", "style-015.png", "style-019.png", "style-021.png", "style-050.png", "style-061.png", "style-087.png", "style-097.png", "style-098.png", "style-099.png", "style-102.png", "style-109.png", "style-110.png", "style-111.png", "style-116.png", "style-117.png"] },
  { id: "garden", category: "outdoor", name: "法式花园轻婚纱", tags: "花园自然光 / 松弛浪漫 / 浅绿色调", images: ["style-002.png", "style-034.png", "style-035.png", "style-042.png", "style-077.png", "style-104.png"] },
  { id: "forest", category: "outdoor", name: "明亮森系外景", tags: "自然草地 / 花艺 / 通透日光", images: ["style-029.png", "style-031.png", "style-045.png", "style-069.png", "style-091.png", "style-114.png"] },
  { id: "city", category: "outdoor", name: "城市街拍婚纱", tags: "街景建筑 / 电影感 / 轻时装", images: [] },
  { id: "lawn", category: "outdoor", name: "草坪仪式感婚纱", tags: "草坪仪式 / 花艺拱门 / 明亮自然", images: [] },
  { id: "chinese-garden", category: "outdoor", name: "中式园林婚纱", tags: "园林窗棂 / 石桥花木 / 东方留白", images: ["style-010.png", "style-017.png", "style-022.png", "style-053.png", "style-066.png", "style-094.png"] },
  { id: "beach", category: "destination", name: "海边夕阳头纱", tags: "海风头纱 / 夕阳逆光 / 浪漫外景", images: [] },
  { id: "night", category: "destination", name: "电影感夜景婚纱", tags: "夜景灯光 / 城市氛围 / 电影反差", images: [] },
  { id: "oil-garden", category: "destination", name: "油画花园婚纱", tags: "浓郁花园 / 油画色彩 / 欧式浪漫", images: ["style-012.png", "style-018.png", "style-033.png", "style-043.png", "style-047.png", "style-051.png", "style-057.png", "style-092.png"] },
  { id: "travel", category: "destination", name: "旅拍目的地婚礼", tags: "异地旅拍 / 建筑风景 / 婚礼叙事", images: [] },
  { id: "church", category: "destination", name: "教堂穹顶婚礼", tags: "穹顶教堂 / 逆光仪式 / 目的地感", images: ["style-028.png", "style-030.png", "style-040.png", "style-044.png", "style-056.png", "style-065.png", "style-067.png", "style-068.png", "style-076.png", "style-080.png", "style-081.png", "style-103.png", "style-112.png", "style-115.png", "style-118.png", "style-119.png"] },
  { id: "vintage", category: "portrait", name: "复古室内电影感", tags: "暖调室内 / 胶片层次 / 情绪肖像", images: [] },
  { id: "editorial", category: "portrait", name: "轻奢杂志大片", tags: "时装构图 / 高级灰阶 / 克制姿态", images: ["style-008.png", "style-011.png", "style-024.png", "style-071.png", "style-072.png", "style-084.png", "style-101.png", "style-105.png", "style-106.png", "style-113.png", "style-121.png"] },
  { id: "bw", category: "portrait", name: "黑白高级纪实", tags: "黑白影调 / 纪实情绪 / 真实瞬间", images: ["style-013.png"] },
  { id: "film", category: "portrait", name: "复古胶片婚纱", tags: "胶片颗粒 / 低饱和 / 真实生活感", images: [] },
  { id: "window", category: "portrait", name: "室内窗光情绪片", tags: "窗边柔光 / 安静情绪 / 肤色层次", images: ["style-037.png", "style-063.png", "style-064.png", "style-090.png"] },
  { id: "mamian", category: "portrait", name: "中式马面裙高级感", tags: "马面裙 / 新中式 / 东方线条", images: [] },
  { id: "republic", category: "portrait", name: "民国复古婚纱", tags: "民国复古 / 旧时光 / 温柔影调", images: [] },
  { id: "gongbi", category: "portrait", name: "工笔画国风婚纱", tags: "国风留白 / 工笔细节 / 东方美学", images: [] },
];

const controls = [
  "clientId",
  "jobId",
  "stylePreset",
  "processMode",
  "identityMode",
  "hairOption",
  "backgroundOption",
  "wardrobeOption",
  "poseOption",
  "variants",
  "aspectRatio",
  "bodyRetouchOption",
  "sourceCorrectionOption",
  "retouchOption",
  "colorGradeOption",
  "subjectLock",
  "extraRequirement",
  "referenceFocus",
];

function currentValues() {
  const values = {};
  for (const id of controls) values[id] = $(id).value.trim();
  values.personFile = $("personImage").files[0]?.name || "未上传客户原片";
  values.personCount = $("personImage").files.length;
  values.referenceFile =
    $("referenceImage").files[0]?.name ||
    selectedStyleReference?.name ||
    "未上传参考图";
  values.aspectRatioLabel = $("aspectRatio").selectedOptions[0]?.textContent || values.aspectRatio;
  values.aspectRatioInstruction = getAspectRatioInstruction(values.aspectRatio);
  return values;
}

function getAspectRatioInstruction(value) {
  const instructions = {
    "1536x1024": "横图 3:2，适合常规横构图客片、半身到全身叙事构图。",
    "1536x864": "横屏满屏 16:9，适合电脑屏幕、电视屏幕、横版展示和朋友圈横屏满屏视觉；画面必须横向展开，左右空间要完整，人物不能被挤压或裁掉关键肢体。",
    "1536x658": "电影宽银幕 21:9，适合电影感横向大片、空间叙事和高级广告感构图；必须保留宽阔横向环境、左右留白、空间层次和电影画幅感。",
    "1024x1536": "竖图 2:3，适合常规竖构图婚纱客片、人物全身或半身展示。",
    "864x1536": "竖屏满屏 9:16，适合手机全屏、小红书/朋友圈/短视频封面；画面必须竖向完整，人物头部、裙摆、脚部和视觉重点不能被裁掉。",
    "1024x1024": "方图 1:1，适合头像、封面、九宫格和方形展示。",
  };
  return instructions[value] || instructions["1536x1024"];
}

function setApiStatus(text) {
  $("apiStatus").textContent = text;
}

function money(value) {
  return `¥${value.toFixed(2)}`;
}

function getPlannedImageCount() {
  const fileCount = $("personImage").files.length || 0;
  const variants = Number($("variants").value || "1");
  return fileCount * variants;
}

function updateCostEstimate() {
  const plannedCount = getPlannedImageCount();
  const hasReference = Boolean($("referenceImage").files[0] || selectedStyleReference);
  const estimated = plannedCount * costConfig.estimatedCnyPerImage
    + (hasReference ? costConfig.estimatedReferenceAnalysisCny : 0);
  const total = totalGeneratedImages * costConfig.estimatedCnyPerImage;

  $("estimatedCost").textContent = money(estimated);
  $("totalCost").textContent = money(total);
  $("costDetail").textContent =
    plannedCount > 0
      ? `${plannedCount} 张预计生成，按 ${costConfig.model} / ${costConfig.size} / ${costConfig.quality} 估算，内部记账约 ${money(costConfig.estimatedCnyPerImage)} / 张。`
      : "上传客户原片后自动估算。";
}

function saveResultHistory() {
  localStorage.setItem("ylrx_result_history", JSON.stringify(resultHistory.slice(0, 80)));
}

function getCurrentStyleName() {
  if ($("stylePreset").value === "analyzed") return stylePresets.analyzed.name || "参考图分析结果";
  const selectedLibraryStyle = styleLibrary.find((item) => item.id === activeStyleId);
  return selectedLibraryStyle?.name || stylePresets[$("stylePreset").value]?.name || "自定义风格";
}

function addHistoryItem({ imageUrl, jpgUrl, jobId, sourceName }) {
  if (!imageUrl) return;
  const values = currentValues();
  const record = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    imageUrl,
    jpgUrl,
    downloadName: `${values.clientId}_${jobId}_高质量成片.jpg`,
    clientId: values.clientId,
    jobId,
    sourceName: sourceName || values.personFile,
    referenceName: values.referenceFile,
    styleName: getCurrentStyleName(),
    aspectRatio: values.aspectRatioLabel,
    createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
  };
  resultHistory = [record, ...resultHistory].slice(0, 80);
  saveResultHistory();
  renderHistory();
}

function renderHistory() {
  const list = $("historyList");
  if (!list) return;
  if (!resultHistory.length) {
    list.innerHTML = `<div class="history-empty">生成成功后会显示在这里</div>`;
    $("clearHistoryBtn").disabled = true;
    return;
  }
  $("clearHistoryBtn").disabled = false;
  list.innerHTML = resultHistory
    .map(
      (item) => `
        <article class="history-item" data-history-id="${item.id}">
          <button class="history-preview" type="button" data-history-view="${item.id}">
            <img src="${item.imageUrl}" alt="${item.clientId} ${item.jobId} 历史成片" loading="lazy" />
          </button>
          <div class="history-meta">
            <strong>${item.clientId} / ${item.jobId}</strong>
            <small>${item.styleName} · ${item.aspectRatio}</small>
            <small>${item.createdAt}</small>
          </div>
          <div class="history-actions">
            ${item.jpgUrl ? `<a href="${item.jpgUrl}" download="${item.downloadName}">下载</a>` : ""}
            <button type="button" data-history-delete="${item.id}">删除</button>
          </div>
        </article>
      `
    )
    .join("");
  bindHistoryActions();
}

function bindHistoryActions() {
  for (const button of document.querySelectorAll("[data-history-view]")) {
    button.addEventListener("click", () => {
      const item = resultHistory.find((record) => record.id === button.dataset.historyView);
      if (!item) return;
      showResult(item.imageUrl, item.jpgUrl || "");
      latestJobId = item.jobId;
      setApiStatus("已打开历史成片");
      setDeliveryState("历史成片", item.jobId);
    });
  }
  for (const button of document.querySelectorAll("[data-history-delete]")) {
    button.addEventListener("click", () => {
      resultHistory = resultHistory.filter((record) => record.id !== button.dataset.historyDelete);
      saveResultHistory();
      renderHistory();
      setApiStatus("已删除历史记录");
    });
  }
}

function renderStyleLibrary() {
  const visibleStyles = styleLibrary.filter((item) => item.category === activeStyleCategory);
  if (!visibleStyles.some((item) => item.id === activeStyleId)) {
    activeStyleId = visibleStyles[0]?.id || "";
  }
  $("styleCardRow").innerHTML = visibleStyles
    .map(
      (item) => {
        const imageCount = item.images?.length || 0;
        const cover = imageCount ? `./assets/style-gallery/${item.images[0]}` : "";
        const status = imageCount ? `已绑定 ${imageCount} 张` : "待补图";
        return `
        <button class="style-card ${item.id === activeStyleId ? "is-active" : ""}" type="button" data-style-card="${item.id}">
          ${cover ? `<img class="style-card-cover" src="${cover}" alt="${item.name}" loading="lazy" />` : `<span class="style-card-empty">待补参考图</span>`}
          <span class="style-status">${status}</span>
          <strong>${item.name}</strong>
          <small>${item.tags}</small>
        </button>
      `;
      }
    )
    .join("");
  renderStyleGuide();
}

function getStyleImagePaths(style) {
  return (style?.images || []).map((name) => `./assets/style-gallery/${name}`);
}

function renderStyleGuide() {
  const style = styleLibrary.find((item) => item.id === activeStyleId);
  const images = getStyleImagePaths(style);
  $("stylePreviewTitle").textContent = style ? `${style.name} · 风格指引` : "风格指引";
  $("stylePreviewCount").textContent = images.length ? `此风格已绑定 ${images.length} 张参考样片` : "此风格待补参考样片";
  if (!images.length) {
    $("stylePreviewGrid").innerHTML = `
      <div class="style-guide-empty">
        <strong>这个风格还没有绑定照片</strong>
        <span>后续把对应照片放进风格组图，我会继续帮你归类到这里。</span>
      </div>
    `;
    return;
  }
  $("stylePreviewGrid").innerHTML = images
    .map((src, index) => {
      const name = `${style.name}_参考样片_${String(index + 1).padStart(2, "0")}.png`;
      const active = selectedStyleReference?.src === src ? "is-selected" : "";
      return `
        <button class="style-reference ${active}" type="button" data-style-reference="${src}" data-style-reference-name="${name}">
          <img src="${src}" alt="${style.name} 参考样片 ${index + 1}" loading="lazy" />
          <span>使用这张分析</span>
        </button>
      `;
    })
    .join("");
  bindStyleReferenceImages();
}

async function loadStyleGallery() {
  try {
    const response = await fetch("./assets/style-gallery/manifest.json");
    styleGalleryImages = await response.json();
  } catch {
    styleGalleryImages = [];
  }
  renderStyleGuide();
}

function bindStyleCategoryTabs() {
  for (const tab of document.querySelectorAll(".style-category-tab")) {
    tab.addEventListener("click", () => {
      activeStyleCategory = tab.dataset.styleCategory;
      for (const item of document.querySelectorAll(".style-category-tab")) item.classList.remove("is-active");
      tab.classList.add("is-active");
      renderStyleLibrary();
      bindStyleLibrary();
      const firstStyle = styleLibrary.find((item) => item.category === activeStyleCategory);
      if (firstStyle) {
        activeStyleId = firstStyle.id;
        renderStyleLibrary();
        bindStyleLibrary();
        $("styleLibraryHint").textContent = `当前分类：${tab.textContent.trim()}。请选择具体风格，下面会显示这个风格绑定的参考样片。`;
      }
    });
  }
}

function toggleStyleLibrary(forceOpen = null) {
  const body = $("styleLibraryBody");
  const toggle = $("styleLibraryToggle");
  const shouldOpen = forceOpen === null ? body.classList.contains("is-collapsed") : forceOpen;
  body.classList.toggle("is-collapsed", !shouldOpen);
  toggle.setAttribute("aria-expanded", String(shouldOpen));
  toggle.querySelector("em").textContent = shouldOpen ? "收起风格库" : "展开风格库";
}

function cacheBust(url) {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${Date.now()}`;
}

async function getSelectedReferenceFile() {
  if (!selectedStyleReference) return null;
  if (selectedStyleReference.file) return selectedStyleReference.file;
  const response = await fetch(selectedStyleReference.src);
  if (!response.ok) {
    throw new Error("风格库参考图读取失败，请重新选择参考图。");
  }
  const blob = await response.blob();
  selectedStyleReference.file = new File([blob], selectedStyleReference.name, {
    type: blob.type || "image/png",
  });
  return selectedStyleReference.file;
}

async function appendReferenceImageToFormData(formData) {
  if ($("referenceImage").files[0]) {
    formData.append("referenceImage", $("referenceImage").files[0]);
    return;
  }
  const selectedFile = await getSelectedReferenceFile();
  if (selectedFile) formData.append("referenceImage", selectedFile);
}

function selectStyleReference(src, name) {
  selectedStyleReference = { src, name, file: null };
  const input = $("referenceImage");
  input.value = "";
  const preview = $("referencePreview");
  preview.src = src;
  preview.closest(".upload-box").classList.add("has-image");
  clearAnalyzedStyleForNewReference(name);
  $("styleLibraryHint").textContent = `已选择风格库参考图：${name}。现在点击“分析参考图”，系统会按这张照片走完整参考图分析流程。`;
  renderStyleGuide();
  updateCostEstimate();
  buildPrompt();
}

function bindStyleReferenceImages() {
  for (const button of document.querySelectorAll(".style-reference")) {
    button.addEventListener("click", () => {
      selectStyleReference(button.dataset.styleReference, button.dataset.styleReferenceName);
    });
  }
}

function setControlLocked(id, locked) {
  const element = $(id);
  element.disabled = locked;
  element.closest(".field")?.classList.toggle("is-locked", locked);
}

function applyProcessModeRules() {
  const retouchOnly = $("processMode").value === "只精修原片";
  const identityMode = $("identityMode").value;
  const absoluteIdentity = identityMode === "正式交付｜身份绝对锁定";
  const lightStyle = identityMode === "风格增强｜轻度迁移";
  const creativeRisk = identityMode === "创意重构｜高风险";

  if (retouchOnly) {
    $("hairOption").value = "不参考";
    $("backgroundOption").value = "不参考";
    $("wardrobeOption").value = "不参考";
    $("poseOption").value = "动作保持";
    $("bodyRetouchOption").value = "自然优化";
    $("sourceCorrectionOption").value = "自然修正";
    $("retouchOption").value = "保脸商业精修";
    $("colorGradeOption").value = "强匹配参考";
    $("processModeHint").textContent =
      "只精修原片模式：自动执行保脸商业精修、中性灰皮肤、自然身形优化和参考图强匹配调色。";
    $("identityModeHint").textContent =
      "只精修原片：锁定原片人物、动作、服装、背景和构图，只做商业精修与调色。";
    $("generateBtn").textContent = "导出精修任务包";
  } else {
    $("processModeHint").textContent =
      "参考图会用于场景、光影、色彩、服装氛围和动作情绪迁移。";
    $("generateBtn").textContent = "生成图片";

    if (absoluteIdentity) {
      $("hairOption").value = "不参考";
      $("wardrobeOption").value = "不参考";
      $("poseOption").value = "动作保持";
      if ($("backgroundOption").value === "强匹配参考") $("backgroundOption").value = "参考风格";
      $("sourceCorrectionOption").value = "严格保留";
      $("identityModeHint").textContent =
        "正式交付：只迁移光影、色调、背景氛围和商业后期。发型、服装、动作默认锁定，防止跑脸。";
    } else if (lightStyle) {
      if ($("hairOption").value === "匹配参考") $("hairOption").value = "参考风格";
      if ($("wardrobeOption").value === "匹配参考") $("wardrobeOption").value = "参考风格";
      if ($("poseOption").value === "重新设计") $("poseOption").value = "小幅调整";
      $("identityModeHint").textContent =
        "风格增强：允许轻度参考发型、服装和姿态氛围，但不允许强匹配导致人物不像。";
    } else if (creativeRisk) {
      $("identityModeHint").textContent =
        "创意重构：允许更强风格迁移，但这是高风险模式，不建议作为正式客户交付默认流程。";
    }
  }
  $("retouchWorkflowCard")?.classList.toggle("is-hidden", !retouchOnly);
  const lockedByIdentity = absoluteIdentity && !retouchOnly;
  for (const id of ["hairOption", "wardrobeOption", "poseOption"]) {
    setControlLocked(id, retouchOnly || lockedByIdentity);
  }
  for (const id of ["backgroundOption", "bodyRetouchOption", "sourceCorrectionOption", "retouchOption", "colorGradeOption"]) {
    setControlLocked(id, retouchOnly);
  }
}

function buildPrompt() {
  const values = currentValues();
  const style = stylePresets[values.stylePreset];
  const retouchOnly = values.processMode === "只精修原片";
  const modeInstruction = retouchOnly
    ? `## 处理方式：只精修原片

本任务不是换场景、不是换服装、不是重新生成写真。
参考图只用于分析商业修图质感、光影层次、色彩后期、皮肤处理标准和高级影像氛围。
必须保留客户原片的场景、构图、动作、表情、服装、发型、身体比例和真实身份。
禁止把客户放进参考图场景，禁止复制参考图服装，禁止复制参考图动作，禁止改变原片背景主体结构。
禁止重绘人物结构，禁止重画手部，禁止改变五官和脸型。双手、手指数量、手掌形状、手腕位置、手臂姿态、脸部五官、脸型、表情、眼神方向必须与原图一致。
禁止改变人物动作。原片的头部角度、肩颈方向、身体姿态、手臂位置、手掌朝向、手指弯曲、腿部位置、表情和眼神方向都必须保持，不能为了适配参考图而重新摆姿势。
参考图色调必须强匹配，但只迁移色彩后期方式，不迁移动作和场景。必须逐项匹配参考图的冷暖倾向、白平衡、肤色明度、高光颜色、高光滚降、中间调密度、暗部黑位、背景灰阶、饱和度、整体对比度和胶片感。
必须完成可见的商业精修提升，不能几乎无变化，不能只做轻微滤镜，不能保持原片直出。只允许做：皮肤商业精修、肤色统一、毛孔保留、中性灰修图、Dodge & Burn 明暗塑形、自然身形优化、光影优化、色彩高级化、服装质感清理、背景轻微清理、画面质感提升。精修必须像专业修图师在原照片上做 Photoshop/Capture One 后期，而不是重新生成一张相似人像。皮肤必须采用中性灰修图 / Dodge & Burn 的商业修图逻辑，通过局部明暗塑形保留皮肤光影结构、骨相结构、毛孔和真实肤质，禁止用一键磨皮、全局模糊磨皮、滤镜磨皮、塑料皮和蜡像皮替代中性灰修图。必须保留真实毛孔、细小皮肤纹理、微反差、骨相明暗和面部体积。`
    : `## 处理方式：参考图改风格

参考图用于分析场景、光影、色彩、服装氛围、动作情绪和商业后期方向，再应用到客户原片。`;
  const prompt = `# ${values.clientId}_${values.jobId}_生成提示词

## 使用方式

第一步：参考图只用于分析风格、光影和修图质感，不直接参与最终人物混合。
第二步：最终生成时，只上传客户原片，并粘贴本提示词。

客户原片：${values.personFile}
客户原片数量：${values.personCount || 0}
参考图记录：${values.referenceFile}
风格包：${style.name}
处理方式：${values.processMode}
身份保护：${values.identityMode}
生成张数：${values.variants}
画幅比例：${values.aspectRatioLabel}
画幅说明：${values.aspectRatioInstruction}

${modeInstruction}

## 正向提示词

以上传的人物原始照片为唯一主体依据，${values.subjectLock}

人物身份规则：

- 最高优先级：客户原片中的每一位人物身份必须完全保留。人物身份优先级高于参考图风格、发型匹配、服装匹配、背景匹配、动作设计、身形优化和所谓更好看的审美结果。
- 参考图只能提供风格、光影、色彩、场景氛围、服装语言和构图方向，绝对不能提供人物五官、脸型、表情模板、年龄感、气质模板或任何身份特征。
- 如果发型、服装、动作、背景与人物身份发生冲突，必须牺牲发型/服装/动作/背景匹配，优先保证客户本人相似度。
- 多人合照中，每一个人都必须分别保持本人身份；不能只保留其中一人，不能把男士或女士变成参考图里的模特脸。
- 参考图重点、发型匹配、服装匹配、背景强匹配、动作重新设计都不能高于人物身份。宁可这些元素匹配不够，也不能让脸不像客户原片。
- 生成前必须把客户原片人物当作唯一演员，参考图不是演员来源。参考图里的人脸、气质、表情和年龄感必须全部忽略。
- 不换脸。
- 不改变人物身份。
- 不生成成参考图里的人。
- 不把人物变成 AI 美女模板。
- 不改变客户本人的真实年龄感和面部识别特征。
- 人脸必须达到至少 95% 以上本人相似度。脸型、五官比例、眼型、眼距、鼻型、人中、嘴型、嘴角、下颌线、颧骨、太阳穴、痣点、年龄感和真实气质必须逐项贴近客户原片；只要明显低于 95% 像本人，就必须返工。
- 人脸必须以客户原片为唯一身份来源，重点保留眼型、眼距、眉眼关系、鼻梁鼻头、人中长度、嘴唇厚薄、嘴角形态、脸宽、脸长、下颌线、颧骨、太阳穴、面部痣点和个人气质。
- 允许商业精修和轻微美化，但不能把客户修成更陌生的网红脸、参考图模特脸或通用漂亮脸。
- 如果原片存在手机自拍、广角、仰拍、近距离导致的头部拉长、脸部压缩、肩颈变形或透视变形，只能在保留本人识别特征的前提下自然修正，目标是恢复客户真实自然比例，不是重新设计五官。
${retouchOnly ? "- 当前为 `只精修原片`：脸部只能做商业精修、肤色统一、瑕疵清理和轻微明暗塑形，不能重绘五官、不能改变脸型、不能改变表情、不能改变眼神方向，不能把本人修成另一张脸。\n" : ""}
${retouchOnly ? "- 当前为 `只精修原片`：身份相似度优先级高于好看程度、皮肤光滑程度和参考图风格相似度。必须先像本人，再谈精修效果。\n" : ""}

当前任务选项：

- 身份保护：${values.identityMode}
- 发型参考：${values.hairOption}
- 背景参考：${values.backgroundOption}
- 服装参考：${values.wardrobeOption}
- 动作表情：${values.poseOption}
- 画幅比例：${values.aspectRatioLabel}
- 画幅说明：${values.aspectRatioInstruction}
- 身形精修：${values.bodyRetouchOption}
- 原片缺陷优化：${values.sourceCorrectionOption}
- 精修强度：${values.retouchOption}
- 色彩后期：${values.colorGradeOption}
- 参考图重点：${values.referenceFocus}

参考图重点硬约束：

- ${values.referenceFocus}
- 当前身份保护为：${values.identityMode}。如果是“正式交付｜身份绝对锁定”，参考图重点只能影响风格、光影、背景氛围和服装语言，不能改变客户脸、发型主体、服装主体、动作表情和真实气质。
- 如果参考图里最抢眼的是头纱、长头纱、大面积纱幔、飞纱、蓬松头纱或垂落头纱，生成结果必须出现对应头纱，并让头纱成为画面里清晰可见的视觉重点。
- 头纱必须有真实透明纱质、层次、边缘、垂坠或飘动关系，不能变成普通白布、不能消失、不能被裁掉。
- 如果参考图有花束、裙摆、手部动作、身体朝向、道具或背景构图重点，也必须保留其视觉功能，而不是只生成普通婚纱照。
- 参考图重点优先级只高于通用风格描述，绝对不能高于人物身份锁定；如果参考图重点会导致脸、年龄感、表情气质或本人识别特征变化，必须放弃该参考图重点，优先保留客户本人。

背景控制：

${retouchOnly ? "- 当前为 `只精修原片`：必须保留原片背景，不进行背景替换。\n" : ""}

- 如果背景参考为 \`不参考\`：背景只需要和整体风格协调，不强制复刻参考图空间。
- 如果背景参考为 \`参考风格\`：参考图背景的空间类型、材质、色温、明暗关系和高级感需要接近，但允许根据客户原片动作做自然适配。
- 如果背景参考为 \`强匹配参考\`：这是强约束。必须尽量复刻参考图的背景空间结构、墙面/地面/窗户/家具/道具/门框/床/沙发/窗帘/灯光位置、空间纵深、明暗分区、色彩层次和构图关系；不能只生成一个同色系的普通背景。背景必须像同一个场地、同一组布景或高度相似的实景拍摄，且人物必须真实融入其中，不能贴图。

发型控制：

${retouchOnly ? "- 当前为 `只精修原片`：必须保留原片发型，不参考图中发型，不添加头饰或头纱。\n" : ""}

- 如果发型参考为 \`不参考\`：保留原片发型、发际线、发量、头发走向和脸部包裹关系。
- 如果发型参考为 \`参考风格\`：必须参考参考图的发型氛围、头发蓬松度、分缝方向、贴头/蓬松关系、卷度、发尾走向、脸侧碎发、额前碎发、耳侧发丝、头饰、头纱固定点、松弛感、盘发/披发方向；不能只保留原片发型不变，但也不能照搬参考图模特的脸。
- 如果发型参考为 \`匹配参考\`：这是发型风格强约束，不是人物身份约束。发型应明显接近参考图的分缝、蓬松度、卷直程度、盘发/披发结构、头纱/头饰位置和整体轮廓；但不得照搬参考图人物的脸型、额头比例、发际线形态、年龄感或气质。只要发型匹配会导致客户脸不像本人，就必须降低发型匹配强度，优先保留客户本人。
- 发型匹配失败属于返工问题。如果参考图是中分贴头、侧分低盘、干净盘发、高盘发、披发大波浪、湿发感或带头纱固定点，生成结果必须在结构上可见地接近，不能只换一个普通发型。

服装控制：

${retouchOnly ? "- 当前为 `只精修原片`：必须保留原片服装款式、颜色、结构和遮挡关系，只允许清理皱褶、污点、杂边并增强面料质感。\n" : ""}

- 如果服装参考为 \`不参考\`：保留原片服装结构，仅增强布料质感、垂坠感、褶皱层次和整洁度。
- 如果服装参考为 \`参考风格\`：只参考参考图服装的整体氛围、材质、廓形、袖型、头纱、裙摆和高级感，不要求完全同款，但不能破坏客户身材比例。
- 如果服装参考为 \`匹配参考\`：这是服装风格强约束，不是人物身份约束。必须尽量接近参考图的颜色、材质、领口、袖型、腰线、裙摆、头纱、饰品、褶皱层次和整体穿搭轮廓；如果参考图头纱是视觉重点，应生成明显头纱并保留其透明纱质和视觉存在感；但不得为了匹配服装改变客户脸、年龄感、表情气质、头身比例或身体身份特征。只要服装匹配会导致人物不像本人，就必须降低服装匹配强度，优先保留客户本人。

动作表情控制：

${retouchOnly ? "- 当前为 `只精修原片`：必须保持原片动作、表情、眼神方向、头部角度、手位和身体姿态。双手、手指数量、手掌形状、手腕位置、手臂姿态、遮挡关系必须与原图一致；不能重画手部，不能重新设计姿态，不能因为修图把手变形。手部只允许清理皮肤瑕疵、统一肤色、轻微优化明暗和质感。\n" : ""}
${retouchOnly ? "- 当前为 `只精修原片`：动作变化属于严重失败。不得改变头部角度、肩颈方向、身体重心、手臂位置、手掌朝向、手指弯曲、腿部位置、坐姿/站姿/躺姿、表情和眼神方向。\n" : ""}

- 如果动作表情为 \`动作保持\`：保持原片动作、头部角度、眼神方向和表情，只改变场景、光影、后期与氛围。
- 如果动作表情为 \`小幅调整\`：可轻微调整手位、头部角度、眼神、表情和裙摆，使人物自然融入新场景。
- 如果动作表情为 \`重新设计\`：这是姿态风格强约束，不是表情身份约束。可以参考参考图的人物姿态、身体朝向、手臂位置、头部角度、视线方向和头纱/裙摆/花束动态关系重新设计动作；但不得复制参考图人物的表情模板、脸部情绪、眼神气质或年龄感。重新设计动作时，客户脸、年龄感、面部识别特征和真实气质必须保持；只要动作设计导致脸不像本人，就必须降低动作变化幅度。

画幅与构图要求：

- 输出画幅必须符合当前选择：${values.aspectRatioLabel}。
- ${values.aspectRatioInstruction}
- 如果当前选择是横屏满屏 16:9：必须以横向宽画面构图，人物、背景、道具、头纱、裙摆和脚部都要完整适配横屏显示，不能生成普通 3:2 后随意裁切。
- 如果当前选择是竖屏满屏 9:16：必须以手机全屏竖构图为目标，主体要在竖屏内完整成立，不能裁掉头部、脚部、裙摆、手臂或参考图重点。
- 如果当前选择是电影宽银幕 21:9：必须建立明显电影画幅感，强调横向空间、环境关系、左右留白、景深层次和电影镜头叙事，不能生成成普通横图后裁掉主体。
- 人物主体必须完整适配画幅，不能裁掉关键头纱、裙摆、手臂或脚部。
- 构图需要接近参考图的画面比例、人物占比和视觉重心。
- 如果参考图是全身照或接近全身构图，生成结果必须是全身构图，必须完整显示头部、身体、裙摆、腿部、脚、鞋或脚尖，以及脚下地面/接触阴影；不能生成成半身、七分身、膝盖以上或裁掉脚。
- 如果参考图的脚、鞋、裙摆落地、站姿、坐姿下半身或身体完整轮廓是构图的一部分，必须保留完整下半身和脚部空间。
- 脚部结构是硬性红线。左右脚关系必须清楚，脚踝、脚背、鞋尖、脚掌方向、腿部连接、落地点、接触阴影和遮挡关系必须符合真实人体和真实鞋履结构；左右脚不能混乱、不能脚尖方向不明、不能鞋和脚脱节、不能出现像两只左脚或两只右脚的错觉。
- 只有当参考图本身就是半身、特写或大头照时，才允许裁切脚部或下半身。

身形与画面比例控制：

- 如果身形精修为 \`自然保持\`：保留客户原片的真实胖瘦、肩颈比例、腰臀比例、四肢长度和骨相，不做明显身材重塑。
- 如果身形精修为 \`自然优化\`：只修正拍摄角度或生成造成的臃肿、变胖、拉宽、压缩、头身比例失衡，让人物回到真实且好看的商业客片状态。
- 如果身形精修为 \`适度显瘦\`：在不改变客户真实身份和身材特征的前提下，做轻微商业级显瘦，不能变成另一个人的身材。
- 如果原片缺陷优化为 \`严格保留\`：不主动修正原片的头脸透视、身形透视和构图缺陷，只做精修与风格迁移。
- 如果原片缺陷优化为 \`自然修正\`：可以修正手机自拍、广角、近距离、歪斜机位造成的头部拉长、脸部压缩、肩颈变形、四肢比例不自然，但修正后仍必须像客户本人。
- 如果原片缺陷优化为 \`明显修正\`：可以更积极地修正原片拍摄缺陷和比例问题，但五官识别点、脸型骨相、年龄感和真实身份不能改变。
- 人物在画面里的大小必须符合真实镜头透视和场景空间，不能过大、过小、悬浮、压扁、拉长或像贴到背景上。
- 头、肩、胸、腰、腿、手和脚必须处在同一真实透视系统里，床面、地面、墙面、家具和人物的比例必须相互匹配。
${retouchOnly ? "- 当前为 `只精修原片`：身形必须做自然商业优化。允许修正拍摄造成的臃肿、肩颈厚重、手臂粗壮、腰线不清、头身比例轻微失衡和服装压身问题，但不能改变客户真实身份、动作、姿态和本人身材特征。优化后要明显比原片更适合交付，但不能变成另一个人的身材。\n" : ""}

将整体画面重塑为：

${retouchOnly ? "原片高级商业精修 / 真实摄影质感提升 / 保留原场景原构图的高端客片后期" : style.overall}

场景转换为：

${retouchOnly ? "不进行场景转换。保留原照片场景、背景结构、空间关系和构图，只允许做背景清理、光影统一、色彩优化和质感提升。" : style.scene}

背景匹配补充：

${retouchOnly ? "当前为只精修原片，不替换背景。" : "背景必须执行当前背景参考选项。若选择强匹配参考，背景不能只做到色调相似，必须在空间结构、主要道具、材质、光源位置、明暗分区和构图层级上明显接近参考图。"}

人物与姿态：

${retouchOnly ? "完全保留原片人物动作、表情、姿态、眼神、身体比例和画面位置，不重新设计动作。" : style.pose}

服装与造型：

${retouchOnly ? "完全保留原片服装和造型，只做商业级清理、质感增强、褶皱层次优化和颜色统一。" : style.wardrobe}

光影要求：

${style.lighting}

光源还原硬约束：

- 必须先判断参考图是柔光还是硬光，并严格按参考图还原。
- 如果参考图是柔光、大面积光源、窗光、柔光箱或包裹式布光：生成结果必须使用柔光，阴影边缘柔和，面部高光过渡细腻，鼻影和颈部阴影不能硬，不能出现硬闪光、直射闪光、强烈投影或棚拍硬广感。
- 如果参考图是硬光或强方向性光：才允许出现清晰阴影边缘和强反差。
- 人物脸部、脖颈、手臂、服装和背景必须处在同一种光源逻辑里，不能脸是硬光、背景是柔光，或人物像后期贴上去。
- 禁止把柔光参考图生成成硬广、硬闪、强 HDR、高反差商业海报光。

色彩风格：

${style.color}

${retouchOnly ? "只精修原片色调硬约束：参考图只用于色彩后期和修图质感，但色调必须强匹配参考图分析结果。不能只做自然校色，不能保持原片直出色。必须把参考图的冷暖倾向、白平衡、肤色明度与偏色、高光颜色、高光滚降、中间调密度、暗部黑位、背景灰阶、饱和度、局部对比度、整体对比度、胶片感迁移到原片上，同时保留原片动作、构图和人物身份。" : ""}

参考图色调匹配要求：

- 色彩后期方式：${values.colorGradeOption}。这一步必须像专业修图师完成的商业调色，不允许相机直出感。
- 色调必须严格贴近参考图，不要只套通用高级灰或通用婚纱白，不要只做曝光校正。
- 参考图的冷暖倾向、黑白灰关系、肤色明度、背景灰阶、对比度、饱和度和胶片感必须作为主要调色依据。
- 如果参考图是冷灰、低饱和、柔和对比，结果也必须冷灰、低饱和、柔和对比；如果参考图偏暖、焦糖、复古，结果也必须跟随对应暖调。
- 禁止生成成与参考图明显不同的色调，例如参考图冷灰却生成暖黄，参考图柔和却生成高饱和高 HDR。
- 肤色、婚纱白、背景灰阶和暗部黑位必须与参考图一致，不能出现参考图没有的偏黄、偏青、过曝、死白、脏灰或重 HDR。
- 输出前必须进行整体色彩统一：人物肤色、服装、背景、阴影和高光必须像同一次摄影后期完成。
- 必须建立色彩层次：高光不能死白，白纱要有层次；中间调要有肤色和面料质感；暗部要有黑位但不能糊死；背景要有灰阶过渡，不能平、脏、直出。
- 必须有商业后期的局部调整：面部亮度、肤色、婚纱白、背景灰、暗部黑位、高光滚降、整体对比度都要被处理过。
- 最终画面不能像相机原片直出，必须像经过 Lightroom/Capture One 基础调色、Photoshop 商业精修、统一色彩管理后的成片。

后期要求：

${values.retouchOption}。这是商业精修硬要求，不是简单美颜。皮肤要干净、细腻、通透，但必须保留真实皮肤纹理、毛孔、微细节、骨相和真实肤感。皮肤处理必须以中性灰修图和 Dodge & Burn 为核心：在不破坏毛孔和皮肤纹理的前提下，用局部明暗修饰暗沉、小瑕疵、眼周、泪沟、法令纹、嘴角、鼻翼、脸颊、下颌、脖颈、锁骨、手臂和腿部肤色，让皮肤干净但仍有光影结构。不能过度磨皮，不能假白，不能塑料感。必须有自然的 dodge and burn 明暗塑形，让面部、鼻梁、颧骨、下颌、肩颈、手臂、腰线和腿部有真实体积感。禁止全局磨皮、AI 美颜、一键滤镜、整体糊皮；皮肤必须有高频毛孔纹理、中频肤色过渡、低频明暗体积，不能把皮肤磨成一整片平面。妆面要干净，眼神要有真实高光，唇色和腮红不能变脏。服装需要增强布料质感、垂坠感、褶皱层次和边缘干净度。提升整体空间氛围与高级感。画面必须像真实摄影棚或真实外景拍摄完成的高端客片，不要 AI 感，不要塑料感，不要贴图感。

${retouchOnly ? "保脸商业精修补充：必须在原照片基础上做修图，不允许重新绘制面部和手部。精修效果要体现在中性灰修图后的肤色干净统一、毛孔细节保留、面部明暗塑形、眼周干净、妆面通透、颈部和手臂肤色一致、服装边缘和褶皱干净、整体色彩高级，而不是通过换脸、重塑五官、磨成塑料皮或生成一张更漂亮但不像本人的脸来实现。整体必须有层次：高光有滚降，中间调有肤色和面料细节，暗部有黑位但不死黑，脸部有骨相明暗，背景有灰阶过渡，不能像一键磨皮后的平面照片。" : ""}
${retouchOnly ? "皮肤层次补充：不能只把皮肤磨干净。必须保留毛孔和皮肤方向性纹理；鼻翼、眼下、嘴角、脸颊、下颌、颈部、锁骨、手臂要有真实明暗过渡；高光区不能死白，暗部不能脏灰，中间调不能一片平。皮肤要有商业精修后的干净和立体，而不是磨皮滤镜后的平滑。" : ""}
${retouchOnly ? "通透感与整体层次补充：不能只修皮肤。必须让整张照片明显更通透、更干净、更有光影层次和高级灰阶。面部、肩颈、锁骨、手臂、腰线、婚纱褶皱、黑色西装、花束和背景都要有局部明暗调整；高光要通透但不死白，暗部要有黑位但不糊死，中间调要有肤色密度和布料细节。人物身形必须自然商业优化，改善肩颈厚重、手臂粗壮、腰线不清、服装压身和裙摆臃肿，但不能改变本人身份、动作和真实身材特征。" : ""}

镜头语言：

${style.camera}

机位、构图、焦距硬约束：

- 必须严格按参考图分析里的镜头语言执行，不能只套一个好看的通用构图。
- 必须还原参考图的画幅方向、景别、相机高度、拍摄距离、焦段感、透视压缩、背景虚化程度、人物占画面比例、头顶/脚边/左右留白、裁切位置、视觉重心和空间纵深。
- 如果参考图是近距中景或特写，人物不能被生成成远景全身；如果参考图是全身空间叙事，人物不能被生成成普通半身棚拍。
- 如果参考图是全身空间叙事，脚边留白、脚下地面、裙摆和人物完整高度都是硬约束，不能因为竖图构图或美化脸部而裁掉脚。
- 如果参考图呈现 85mm/100mm 的压缩感，结果不能有手机广角的大头小身、边缘拉伸或透视夸张；如果参考图呈现 35mm/50mm 的空间感，结果也不能变成过度压缩的纯头像。
- 人物脸部变换角度时，必须保持客户本人五官结构，不得因为侧脸、低头、仰头或重新设计动作而换成另一张脸。

真实感要求：

人物必须真实存在于场景中。人物与背景的光线方向、色温、阴影、透视、景深、清晰度、噪点和锐度必须统一。必须有真实接触阴影、环境反光、边缘光和空间遮挡关系。不能像把人贴到背景上。

补充要求：

${values.extraRequirement}

真实融合返工要求：

如果上一版出现 AI 感、贴图感、人物未精修、胖瘦失真、光影不融合或画面比例失衡，请把这些问题作为本次返工重点。人物必须像在真实场景中被相机拍到，而不是后期贴到背景上。加强人物身体、脚下、手臂、头发、裙摆和床面/地面/家具之间的接触阴影；统一人物与背景的光线方向、色温、对比度、锐度、颗粒和景深；人物边缘不能有抠图白边、黑边或光晕；人物身体大小必须与床、门、墙面、沙发、花艺、家具等真实比例匹配；肩颈、腰臀、四肢不能因为换场景而变粗、变短、变长或变形；皮肤必须有商业精修后的干净质感，同时保留毛孔和真实肌理；皮肤、婚纱、背景不能清晰度割裂；降低过度通透、过度梦幻、过度 AI 的高亮效果；保留真实镜头噪点和空间空气感。

脸部与脚部返工红线：

如果上一版女士或男士脸部发生走形、未达到 95% 以上本人相似度，必须严格恢复客户原片脸型、五官比例、眼型、眼距、鼻型、人中、嘴型、下颌线、颧骨、年龄感和真实气质。脚部左右关系不清、脚踝鞋尖不自然、脚和腿连接错误、落地点不真实、像两只左脚或两只右脚，都必须返工。保留上一版可用的整体光影、色调和氛围时，也必须优先修正身份相似度和脚部结构。

${retouchOnly ? "只精修原片返工要求：如果结果改变了场景、服装、发型、动作、表情、构图、人物身份、脸部五官、脸型、眼神方向、双手结构、手指数量、手掌形状、手腕位置或手臂姿态，则直接判定失败。若色调与参考图明显不一致，或皮肤层次像一键磨皮、缺少毛孔、微反差、骨相明暗和灰阶层次，也必须返工。必须回到原照片基础上做真实商业精修。" : ""}

质感关键词：

${style.keywords}

## 反向提示词

no AI face, no plastic skin, no over smoothing, no doll face, no cartoon style, no exaggerated pose, no distorted body, no extra limbs, no messy background, no harsh flash, no heavy HDR, no oversaturated color, no fake fashion look, no identity change, no face change, no copied reference face, no copied reference identity, no pasted subject, no cutout halo, no floating body, no mismatched shadows, no fake background, no watermark, no logo, no text`;

  $("promptOutput").value = prompt;
  updateCostEstimate();
}

function applyAnalyzedStyle(style) {
  if (!style) {
    throw new Error("参考图分析没有返回可用风格，请检查接口结果后重试。");
  }

  stylePresets.analyzed = {
    name: style.name || "参考图分析结果",
    sourceReferenceName: currentValues().referenceFile || "",
    overall: style.overall || "",
    scene: style.scene || "",
    pose: style.pose || "",
    wardrobe: style.wardrobe || "",
    lighting: style.lighting || "",
    color: style.color || "",
    camera: style.camera || "",
    keywords: style.keywords || "",
  };

  const select = $("stylePreset");
  let option = [...select.options].find((item) => item.value === "analyzed");
  if (!option) {
    option = document.createElement("option");
    option.value = "analyzed";
    select.appendChild(option);
  }
  option.textContent = stylePresets.analyzed.name;
  select.value = "analyzed";
  analyzedReferenceName = stylePresets.analyzed.sourceReferenceName;
  $("styleAnalysis").value = formatStyleAnalysis(stylePresets.analyzed);
  buildPrompt();
}

function formatStyleAnalysis(style) {
  const retouchOnly = $("processMode").value === "只精修原片";
  const modeNotice = retouchOnly
    ? `分析用途：只精修原片

本次参考图只用于提取皮肤处理方式、中性灰修图方式、Dodge & Burn 明暗塑形、毛孔保留程度、商业精修强度、光影层次、色彩后期、灰阶关系和整体质感。
不参考参考图的人脸、身份、场景、服装、发型、动作和构图，不把客户照片改成参考图内容。
客户原片必须保留原场景、原服装、原发型、原动作、原表情和原构图，只做商业级精修与调色。
双手、手指数量、手掌形状、手腕位置、手臂姿态、脸部五官、脸型、表情和眼神方向必须与客户原图一致；禁止重绘手部，禁止重绘五官。
精修标准必须避免一键磨皮感：保留高频毛孔纹理、中频肤色过渡、低频明暗体积、骨相光影、面部微反差和真实皮肤质感。

`
    : "";
  return `风格名称：${style.name}

${modeNotice}

整体风格：
${style.overall}

场景转换：
${retouchOnly ? "不进行场景转换。保留客户原片背景、空间结构和构图，只参考修图质感、光影层次和色彩后期。" : style.scene}

人物与姿态：
${retouchOnly ? "不改变动作、表情、眼神、头部角度、手位和身体姿态。参考图动作不迁移。双手、手指数量、手掌形状、手腕位置、手臂姿态和遮挡关系必须与原图一致，只允许做肤色、瑕疵和明暗质感精修。" : style.pose}

服装与造型：
${retouchOnly ? "不改变服装、发型、头饰和造型。只清理瑕疵、增强面料质感、统一肤色与服装色彩关系。" : style.wardrobe}

光影要求：
${style.lighting}

色彩风格：
${style.color}

镜头语言：
${style.camera}

质感关键词：
${style.keywords}`;
}

function clearAnalyzedStyleForNewReference(fileName) {
  const select = $("stylePreset");
  if (select.value === "analyzed") select.value = "forest";

  stylePresets.analyzed = {
    name: "参考图分析结果",
    sourceReferenceName: "",
    overall: "",
    scene: "",
    pose: "",
    wardrobe: "",
    lighting: "",
    color: "",
    camera: "",
    keywords: "",
  };
  analyzedReferenceName = "";
  $("styleAnalysis").value = `已更换参考图：${fileName}\n\n旧的参考图分析已清空。请重新点击“分析参考图”，再生成图片。`;
  setApiStatus("参考图已更换");
}

function renderBatchQueue() {
  const list = $("batchList");
  const count = batchItems.length;
  $("batchCount").textContent = `${count} 张`;

  if (!count) {
    list.innerHTML = `<div class="batch-empty">上传多张客户原片后会显示在这里</div>`;
    return;
  }

  list.innerHTML = batchItems
    .map((item, index) => {
      const download = item.jpgUrl
        ? `<a class="batch-download" href="${item.jpgUrl}" download="${item.downloadName}">下载 JPG</a>`
        : "";
      const thumb = item.imageUrl ? `<img src="${item.imageUrl}" alt="" />` : "";
      return `
        <div class="batch-item ${item.statusClass || ""}">
          <div class="batch-index">${String(index + 1).padStart(2, "0")}</div>
          <div class="batch-meta">
            <strong>${item.file.name}</strong>
            <small>${item.status}</small>
          </div>
          <div class="batch-thumb">${thumb}</div>
          ${download}
        </div>
      `;
    })
    .join("");
}

function bindImageInput(inputId, previewId) {
  const input = $(inputId);
  const preview = $(previewId);
  input.addEventListener("change", () => {
    const file = input.files[0];
    const box = input.closest(".upload-box");
    if (!file) return;
    preview.src = URL.createObjectURL(file);
    box.classList.add("has-image");
    if (inputId === "personImage") {
      batchItems = [...input.files].map((item) => ({
        file: item,
        status: "待生成",
        statusClass: "",
        imageUrl: "",
        jpgUrl: "",
        downloadName: "",
      }));
      latestJpgUrl = "";
      $("downloadJpgBtn").disabled = true;
      renderBatchQueue();
      updateCostEstimate();
    }
    if (inputId === "referenceImage") {
      selectedStyleReference = null;
      clearAnalyzedStyleForNewReference(file.name);
      renderStyleGuide();
    }
    updateCostEstimate();
    buildPrompt();
  });
}

for (const id of controls) {
  $(id).addEventListener("input", buildPrompt);
  $(id).addEventListener("change", buildPrompt);
}

$("processMode").addEventListener("change", () => {
  applyProcessModeRules();
  buildPrompt();
});

$("identityMode").addEventListener("change", () => {
  applyProcessModeRules();
  buildPrompt();
});

$("copyBtn").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("promptOutput").value);
  $("copyBtn").textContent = "已复制";
  setTimeout(() => {
    $("copyBtn").textContent = "复制";
  }, 1200);
});

$("togglePromptBtn").addEventListener("click", () => {
  const prompt = $("promptOutput");
  const hidden = prompt.classList.toggle("is-hidden");
  $("togglePromptBtn").textContent = hidden ? "显示提示词" : "隐藏提示词";
});

$("downloadBtn").addEventListener("click", () => {
  const values = currentValues();
  const blob = new Blob([$("promptOutput").value], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${values.jobId}_${values.clientId}_prompt.md`;
  link.click();
  URL.revokeObjectURL(link.href);
});

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 800);
}

function downloadFile(file, filenamePrefix = "") {
  if (!file) return false;
  const name = filenamePrefix ? `${filenamePrefix}_${file.name}` : file.name;
  downloadBlob(file, name);
  return true;
}

function buildRetouchBrief() {
  const values = currentValues();
  return `# ${values.clientId}_${values.jobId}_第三方精修任务包

## 任务类型
只精修原片，不换场景，不换服装，不换发型，不改动作，不换脸。

## 文件
- 客户原片：${values.personFile}
- 参考图：${values.referenceFile}
- 客户编号：${values.clientId}
- 任务编号：${values.jobId}

## 第三方工具建议
可使用：像素蛋糕、Retouch4me、Evoto、Photoshop/Camera Raw。

## 精修目标
1. 人物身份、脸型、五官、表情、眼神、手部、动作、服装、背景和构图必须保持原片。
2. 必须做可见商业精修，不能只是轻微滤镜或几乎无变化。
3. 皮肤采用中性灰修图 / Dodge & Burn 逻辑，保留毛孔、真实肤质、皮肤方向性纹理、骨相明暗和面部体积。
4. 身形自然商业优化：改善肩颈厚重、手臂粗壮、腰线不清、服装压身、裙摆臃肿和轻微比例问题，但不能变成另一个人的身材。
5. 色调强匹配参考图：冷暖、白平衡、肤色、高光滚降、中间调密度、暗部黑位、灰阶、饱和度、胶片感都要贴近参考图。
6. 整体要更通透、更干净、更有光影层次；高光不能死白，暗部不能糊死，中间调要有肤色和面料细节。
7. 婚纱、黑西装、花束、背景都要进入统一调色和局部明暗关系，不能只修皮肤。

## 不合格直接返工
- 脸不像本人
- 手部或动作变化
- 皮肤像一键磨皮、塑料皮、没有毛孔
- 人物胖瘦、肩颈、手臂、腰线没有优化
- 色调不像参考图
- 画面不通透、没光影层次、像相机直出

## 参考图分析
${$("styleAnalysis").value.trim() || "未分析参考图，请先点击“分析参考图”。"}
`;
}

function exportRetouchPackage() {
  const values = currentValues();
  if (!$("personImage").files.length) {
    setApiStatus("请先上传客户原片");
    return;
  }
  const brief = buildRetouchBrief();
  downloadBlob(
    new Blob([brief], { type: "text/markdown;charset=utf-8" }),
    `${values.clientId}_${values.jobId}_第三方精修说明.md`
  );
  downloadRetouchImages();
  setApiStatus("已导出精修任务包");
  renderQaResult({
    status: "rework",
    title: "已导出第三方精修任务包",
    body: "请使用像素蛋糕、Retouch4me、Evoto 或 Photoshop 完成精修，修完后在页面上传成片回传归档。",
  });
  setDeliveryState("待第三方精修", values.jobId);
}

async function downloadRetouchImages() {
  const values = currentValues();
  [...$("personImage").files].forEach((file, index) => {
    downloadFile(file, `${values.clientId}_${values.jobId}_客户原片_${String(index + 1).padStart(2, "0")}`);
  });
  const referenceFile = $("referenceImage").files[0] || (await getSelectedReferenceFile().catch(() => null));
  if (referenceFile) downloadFile(referenceFile, `${values.clientId}_${values.jobId}_参考图`);
}

function handleRetouchedUpload(file) {
  if (!file) return;
  const values = currentValues();
  const src = URL.createObjectURL(file);
  showResult(src, src);
  latestJobId = values.jobId;
  addHistoryItem({
    imageUrl: src,
    jpgUrl: src,
    jobId: values.jobId,
    sourceName: file.name,
  });
  setApiStatus("第三方成片已回传");
  setDeliveryState("第三方成片", values.jobId);
  renderQaResult({
    status: "rework",
    title: "第三方精修成片已上传",
    body: "请进行最终人工质检：脸、手、动作、皮肤中性灰层次、身形线条、色调参考匹配和整体通透感。",
  });
}

function bindStyleLibrary() {
  for (const card of document.querySelectorAll(".style-card")) {
    card.addEventListener("click", () => {
      for (const item of document.querySelectorAll(".style-card")) item.classList.remove("is-active");
      card.classList.add("is-active");
      const style = styleLibrary.find((item) => item.id === card.dataset.styleCard);
      activeStyleId = style?.id || activeStyleId;
      const name = style?.name || "当前风格";
      const imageCount = style?.images?.length || 0;
      $("styleLibraryHint").textContent =
        imageCount
          ? `当前选中：${name}。下方是这个风格自己的参考样片，后续会继续接入“一键按此风格生成”。`
          : `当前选中：${name}。这个风格还没有绑定照片，先不要让员工用它生成。`;
      renderStyleGuide();
      buildPrompt();
    });
  }
}

$("resetBtn").addEventListener("click", () => {
  $("processMode").value = "参考图改风格";
  $("identityMode").value = "正式交付｜身份绝对锁定";
  $("hairOption").value = "不参考";
  $("backgroundOption").value = "参考风格";
  $("wardrobeOption").value = "参考风格";
  $("poseOption").value = "动作保持";
  $("variants").value = "1";
  $("aspectRatio").value = "1536x1024";
  $("bodyRetouchOption").value = "自然优化";
  $("sourceCorrectionOption").value = "自然修正";
  $("retouchOption").value = "保脸商业精修";
  $("colorGradeOption").value = "高端调色";
  $("stylePreset").value = "forest";
  $("subjectLock").value =
    "以上传的人物原始照片为唯一主体依据，严格保留人物五官、脸型、年龄感、肤色、真实身份、身材比例与骨相特征。";
  $("extraRequirement").value =
    "皮肤要精修但保留真实毛孔，不要 AI 感，不要塑料感，不要贴图感。";
  $("referenceFocus").value =
    "如果参考图中头纱、裙摆、花束、道具或特殊动作是视觉重点，必须在生成结果中保留并突出。";
  applyProcessModeRules();
  buildPrompt();
});

bindImageInput("personImage", "personPreview");
bindImageInput("referenceImage", "referencePreview");
renderStyleLibrary();
bindStyleLibrary();
bindStyleCategoryTabs();
loadStyleGallery();
$("styleLibraryToggle").addEventListener("click", () => toggleStyleLibrary());
renderBatchQueue();
renderHistory();
applyProcessModeRules();
updateCostEstimate();
buildPrompt();

async function callAnalyzeApi() {
  const values = currentValues();
  const retouchOnly = values.processMode === "只精修原片";
  const formData = new FormData();
  await appendReferenceImageToFormData(formData);
  const analysisPrompt = retouchOnly
    ? `请根据当前上传的参考图本身进行独立视觉分析，但本次任务模式是“只精修原片”。

重要边界：
参考图只用于分析修图方式，不用于换场景、不用于换服装、不用于换发型、不用于换动作、不用于改变构图，不迁移参考图人物身份。
后续客户照片必须保留原场景、原构图、原动作、原表情、原服装、原发型、原身体比例和真实身份。
后续客户照片的双手、手指数量、手掌形状、手腕位置、手臂姿态、遮挡关系、脸部五官、脸型、表情和眼神方向必须与原图一致；禁止重绘手部，禁止重绘五官，禁止把本人修成另一张脸。
后续客户照片必须强匹配参考图色调，但不能改变动作。请把色彩分析写得足够具体，让它能直接迁移到原片调色。

请像专业商业修图师、摄影指导、灯光师和调色师一样，只提取参考图的后期修图标准：
1. 皮肤处理方式：是否采用中性灰修图 / Dodge & Burn，磨皮程度、毛孔保留、皮肤高频纹理、中频肤色过渡、低频明暗体积、瑕疵处理、眼周/法令纹/嘴角/脖颈/手臂肤色统一、妆面干净度。必须明确要求后续用中性灰修图逻辑保留皮肤光影结构，而不是一键磨皮。
2. 光影层次：柔光或硬光、主光方向、光源面积、阴影边缘软硬、面部高光、眼神光、颈部阴影、环境光、反差、光比。
3. 色彩后期：冷暖倾向、白平衡、肤色明度与偏色、高光颜色、高光滚降、白色层次、中间调密度、暗部黑位、背景灰阶、饱和度、局部对比度、整体对比度、胶片感、是否相机直出或已商业调色。必须写出后续原片应该如何调到接近参考图，不能只写高级、干净、自然。
4. 质感标准：真实摄影感、清晰度、锐化、颗粒、空气感、商业客片完成度。
5. 层次标准：高光滚降、中间调肤色密度、暗部黑位、脸部骨相明暗、背景灰阶、服装纹理、皮肤微反差，明确避免一键磨皮、全局模糊磨皮、滤镜感和平面无层次。
6. 镜头与构图只做“保留原片构图”的提醒：不要要求后续改成参考图构图，只描述参考图质感对原片后期的启发。

输出必须是一个合法 JSON 对象，不要 Markdown，不要代码块，不要额外解释。
JSON 字段必须包含：
name, overall, scene, pose, wardrobe, lighting, color, camera, keywords。

字段写法要求：
- name：命名为“参考图修图方式分析”或更具体的修图风格名。
- overall：写参考图的商业修图质感和后期方向。
- scene：明确写“不迁移场景，只保留客户原片背景并做背景清理、光影统一和色彩高级化”。
- pose：明确写“不迁移动作表情，只保留客户原片动作、表情、眼神、手位和身体姿态”。
- wardrobe：明确写“不迁移服装发型，只保留客户原片服装发型，做质感清理和肤色/服装色彩统一”。
- lighting：具体写参考图光影如何应用到原片精修。
- color：具体写参考图调色如何应用到原片。
- camera：明确写“保留原片构图与镜头关系，只修正轻微透视缺陷和画面比例问题”。
- keywords：英文质感关键词，强调 retouching, skin texture, color grading, realistic photography。`
    : "请根据当前上传的参考图本身进行独立视觉分析，不要套用固定风格模板。请像专业商业修图师、摄影指导、灯光师和调色师一样观察这张参考图，分析它的整体风格、场景空间、人物动作表情、服装造型、光影、色彩、后期、镜头语言和质感关键词，并把分析结果整理成可应用到客户原片的风格提示词。必须先找出参考图最抢眼的视觉重点是什么，例如大面积头纱、飞纱、垂落头纱、裙摆、花束、手部动作、特殊姿态或道具；如果头纱是重点，必须详细分析头纱类型、面积、位置、透明纱质、垂坠/飘动方向、和动作构图的关系，并要求后续生成保留。必须具体分析发型结构：分缝位置、贴头或蓬松程度、盘发/披发、发尾方向、脸侧碎发、额前碎发、耳侧发丝、头纱或头饰固定点。重点必须准确判断：参考图是柔光还是硬光、主光方向、光源面积、阴影边缘软硬、面部高光、眼神光、反差、色温、肤色明度、背景灰阶、饱和度、对比度、胶片感、皮肤精修方式和毛孔保留程度。色彩分析必须具体到高光、中间调、暗部、肤色、白纱层次、背景灰阶、黑位、对比度、饱和度和是否已有商业调色，不能只写高级干净，不能生成相机直出感。镜头语言必须具体到画幅方向、景别、机位高度、拍摄距离、焦段感、透视压缩、人物占画面比例、头顶和边缘留白、脚边留白、是否全身、是否露脚、裁切位置、视觉重心、背景虚化和空间纵深，不能只写 50mm 或 85mm。若参考图是全身，必须明确要求后续生成完整到脚和脚下空间。目标是让客户照片按参考图的风格、场景、光影、构图、焦距和后期方向生成，同时保留客户本人身份、真实毛孔和商业级质感。";
  formData.append(
    "analysisPrompt",
    analysisPrompt
  );

  const response = await fetch("/api/analyze-reference", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`参考图分析接口异常：${response.status}`);
  }

  return response.json();
}

function buildPromptForFile(file, jobId) {
  const values = currentValues();
  return $("promptOutput")
    .value.replace(`# ${values.clientId}_${values.jobId}_生成提示词`, `# ${values.clientId}_${jobId}_生成提示词`)
    .replace(`客户原片：${values.personFile}`, `客户原片：${file.name}`)
    .replace(`客户原片数量：${values.personCount || 0}`, "客户原片数量：1");
}

async function callImageApi(personFile = $("personImage").files[0], jobIdOverride = "") {
  const values = currentValues();
  if (
    values.stylePreset === "analyzed" &&
    $("promptOutput").value.includes("这里应由视觉模型")
  ) {
    throw new Error("参考图分析目前还是占位结果，请先选择已有风格包，或接入真实参考图分析接口后再用分析结果生成。");
  }
  if (
    values.stylePreset === "analyzed" &&
    analyzedReferenceName &&
    values.referenceFile !== analyzedReferenceName
  ) {
    throw new Error("你已经更换了参考图，请先重新点击“分析参考图”，不能沿用旧参考图分析结果。");
  }

  const formData = new FormData();
  const jobId = jobIdOverride || values.jobId;
  formData.append("clientId", values.clientId);
  formData.append("jobId", jobId);
  formData.append("stylePreset", values.stylePreset);
  formData.append("processMode", values.processMode);
  formData.append("identityMode", values.identityMode);
  formData.append("hairOption", values.hairOption);
  formData.append("backgroundOption", values.backgroundOption);
  formData.append("wardrobeOption", values.wardrobeOption);
  formData.append("poseOption", values.poseOption);
  formData.append("variants", values.variants);
  formData.append("aspectRatio", values.aspectRatio);
  formData.append("bodyRetouchOption", values.bodyRetouchOption);
  formData.append("sourceCorrectionOption", values.sourceCorrectionOption);
  formData.append("retouchOption", values.retouchOption);
  formData.append("colorGradeOption", values.colorGradeOption);
  formData.append("referenceFocus", values.referenceFocus);
  formData.append("prompt", buildPromptForFile(personFile, jobId));
  if (personFile) formData.append("personImage", personFile);
  await appendReferenceImageToFormData(formData);

  const response = await fetch("/api/generate-image", {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.message || `生成接口异常：${response.status}`;
    const warning = data?.warnings?.length ? `（${data.warnings.join("，")}）` : "";
    throw new Error(`${message}${warning}`);
  }

  return data;
}

async function generateBatch() {
  if (!batchItems.length) {
    throw new Error("请先上传客户原片。");
  }

  const values = currentValues();
  const variants = Math.max(1, Number(values.variants || "1"));
  let completedCount = 0;
  for (let index = 0; index < batchItems.length; index += 1) {
    const item = batchItems[index];

    for (let variantIndex = 0; variantIndex < variants; variantIndex += 1) {
      const fileSuffix = batchItems.length > 1 ? `_${String(index + 1).padStart(2, "0")}` : "";
      const variantSuffix = variants > 1 ? `_v${String(variantIndex + 1).padStart(2, "0")}` : "";
      const batchJobId = `${values.jobId}${fileSuffix}${variantSuffix}`;

      item.status = `生成中 ${variantIndex + 1}/${variants}`;
      item.statusClass = "running";
      renderBatchQueue();
      setApiStatus(`生成中 ${completedCount + 1}/${batchItems.length * variants}`);

      try {
        const data = await callImageApi(item.file, batchJobId);
        if (!data.imageUrl) throw new Error("接口没有返回 imageUrl");
        const imageUrl = cacheBust(data.imageUrl);
        const jpgUrl = cacheBust(data.jpgUrl || "");
        item.status = variants > 1 ? `已生成 ${variantIndex + 1}/${variants}` : "已生成";
        item.statusClass = "done";
        item.imageUrl = imageUrl;
        item.jpgUrl = jpgUrl;
        item.downloadName = `${values.clientId}_${batchJobId}_高质量成片.jpg`;
        showResult(imageUrl, jpgUrl);
        addHistoryItem({
          imageUrl,
          jpgUrl,
          jobId: batchJobId,
          sourceName: item.file.name,
        });
        latestJobId = batchJobId;
        completedCount += 1;
      } catch (error) {
        item.status = `失败：${error.message}`;
        item.statusClass = "failed";
        renderBatchQueue();
        throw error;
      }

      renderBatchQueue();
    }

    item.status = variants > 1 ? `已生成 ${variants} 张` : "已生成";
    item.statusClass = "done";
    renderBatchQueue();
  }
  totalGeneratedImages += completedCount;
  localStorage.setItem("ylrx_total_generated_images", String(totalGeneratedImages));
  updateCostEstimate();
}

function showResult(src, jpgUrl = "") {
  $("resultPreview").src = src;
  $("resultPreview").closest(".result-viewer").classList.add("has-result");
  latestJpgUrl = jpgUrl;
  $("downloadJpgBtn").disabled = !latestJpgUrl;
  $("deliveryDownloadBtn").disabled = !latestJpgUrl;
}

function setDeliveryState(status, version = "") {
  $("deliveryStatus").textContent = status;
  if (version) $("deliveryVersion").textContent = version;
}

function selectedQaIssues() {
  return [];
}

function renderQaResult({ status, title, body, issues = [] }) {
  const result = $("qaResult");
  result.className = `qa-result ${status}`;
  if (status === "pass") setDeliveryState("可交付");
  if (status === "rework") setDeliveryState("需重做");
  if (status === "reject") setDeliveryState("废片");
  const issueList = issues.length
    ? `<ul>${issues.map((issue) => `<li>${issue}</li>`).join("")}</ul>`
    : "";
  result.innerHTML = `
    <h3>${title}</h3>
    <p>${body}</p>
    ${issueList}
  `;
}

function resetQaIssues() {
  // 质检标准已改为后台默认全部启用，页面不再需要手动勾选。
}

async function callQualityApi() {
  const values = currentValues();
  const response = await fetch("/api/quality-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: values.clientId,
      jobId: latestJobId || values.jobId,
      options: values,
      criteria: defaultQaCriteria,
      prompt: $("promptOutput").value,
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `质检接口异常：${response.status}`);
  }
  return data;
}

function renderVisionQa(data, manualIssues = []) {
  const findings = Array.isArray(data.findings) ? data.findings : [];
  const issues = [
    ...manualIssues,
    ...findings.map((item) => `${item.item || "问题"}：${item.message || ""}`),
  ].filter(Boolean);
  const status = data.status === "pass" ? "pass" : data.status === "reject" ? "reject" : "rework";
  renderQaResult({
    status,
    title: data.nextAction || (status === "pass" ? "通过" : "需返工"),
    body: `${data.summary || "视觉质检完成。"}${data.score !== null && data.score !== undefined ? ` 评分：${data.score}/100。` : ""}`,
    issues,
  });
}

async function runLocalQa() {
  const hasResult = $("resultPreview").src;
  const values = currentValues();
  const warnings = [];
  const issues = selectedQaIssues();

  if (!hasResult) warnings.push("还没有生成结果，不能做最终质检。");
  if (["匹配参考", "参考风格"].includes(values.hairOption) || ["匹配参考", "参考风格"].includes(values.wardrobeOption) || values.backgroundOption === "强匹配参考") {
    warnings.push("当前启用了参考图迁移类选项，必须先逐一核对每个人的身份相似度；如果脸像参考图模特或通用 AI 脸，直接判定失败。");
  }
  if (values.hairOption !== "不参考") warnings.push("发型参考已开启，需重点检查是否改变脸型、发际线和年龄感。");
  if (values.poseOption === "重新设计") warnings.push("动作表情为重新设计，需重点检查身份、人体比例和表情是否像本人。");
  if (values.wardrobeOption === "匹配参考") warnings.push("服装匹配参考已开启，需重点检查是否破坏身体比例、遮挡关系和真实布料结构。");
  if (values.processMode === "只精修原片") warnings.push("当前为只精修原片，任何换场景、换服装、改动作、改表情都必须返工。");
  if (values.processMode === "只精修原片") warnings.push("只精修原片必须重点检查：脸部五官、脸型、眼神、双手结构、手指数量、手掌形状、手腕位置和手臂姿态是否与原图一致。");
  if (values.processMode === "只精修原片") warnings.push("只精修原片的精修效果必须达到商业修图标准：肤色统一、毛孔保留、明暗塑形、眼周干净、妆面通透、手臂颈部肤色一致，不能只是滤镜或磨皮。");
  if (values.processMode === "只精修原片") warnings.push("如果皮肤像一键磨皮、全局模糊、塑料皮，或整体没有高光滚降、中间调密度、暗部黑位、骨相明暗和灰阶层次，必须返工。");
  if (values.processMode === "只精修原片") warnings.push("皮肤必须符合中性灰修图和 Dodge & Burn 逻辑：保留毛孔、高频纹理、中频肤色过渡和低频明暗体积；如果像磨皮滤镜而不是中性灰精修，必须返工。");
  if (values.processMode === "只精修原片") warnings.push("如果人物动作、手臂位置、手掌朝向、头部角度、表情或眼神方向与原图不一致，必须返工。");
  if (values.processMode === "只精修原片") warnings.push("如果整体色调没有强匹配参考图的冷暖、白平衡、肤色、高光滚降、中间调、暗部黑位、灰阶、饱和度和胶片感，必须返工。");
  if (values.processMode === "只精修原片") warnings.push("如果生成结果几乎无变化，人物胖瘦、皮肤质感、光影层次、整体色调没有明显达到商业精修成片标准，必须返工。");
  if (!$("personImage").files[0]) warnings.push("未上传客户原片，无法做身份对比。");

  if (!hasResult) {
    renderQaResult({
      status: "rework",
      title: "待生成",
      body: `${warnings.join(" ")} 建议：先调用生成接口，再进行助手质检。`,
    });
    setDeliveryState("待生成", "未生成");
    return;
  }

  if (issues.length) {
    const hasSevereIssue = issues.some((issue) =>
      issue.includes("脸不像") || issue.includes("损害门店")
    );
    renderQaResult({
      status: hasSevereIssue ? "reject" : "rework",
      title: hasSevereIssue ? "废片，不可给客户看" : "需返工，不可给客户看",
      body: "已命中严格质检红线。脸像本人只是基础条件，以下问题未解决前不能交付。",
      issues,
    });
    return;
  }

  renderQaResult({
    status: "rework",
    title: "视觉质检中",
    body: "正在读取生成图进行严格质检，重点检查手部、脸、皮肤、光影、比例和参考重点。",
  });
  try {
    const data = await callQualityApi();
    renderVisionQa(data, warnings);
  } catch (error) {
    renderQaResult({
      status: "rework",
      title: "视觉质检失败，必须人工复核",
      body: `${error.message} 请人工逐项确认手、脸、皮肤、光影、比例、贴图感、服装和动作后，再决定返工或通过。`,
    });
  }
}

$("generateBtn").addEventListener("click", async () => {
  if (currentValues().processMode === "只精修原片") {
    exportRetouchPackage();
    return;
  }
  setApiStatus("生成中");
  $("generateBtn").disabled = true;
  $("generateBtn").textContent = "生成中";
  $("qaResult").className = "qa-result";
  $("qaResult").innerHTML = `
    <h3>正在生成</h3>
    <p>已提交到图像接口。高清图片可能需要等待几十秒，请不要重复点击。</p>
  `;
  setDeliveryState("生成中", "处理中");
  resetQaIssues();
  try {
    await generateBatch();
    setApiStatus(batchItems.length > 1 ? "批量完成" : "已生成");
    setDeliveryState("待审核", latestJobId || currentValues().jobId);
    renderQaResult({
      status: "rework",
      title: "已生成，等待严格质检",
      body: `${batchItems.length} 张图片已按队列生成，并已保存高质量 JPG。当前不能直接判定通过，请逐张查看后点击“质检”，系统会自动按全部红线检查。`,
    });
  } catch (error) {
    setApiStatus("生成失败");
    $("qaResult").className = "qa-result rework";
    $("qaResult").innerHTML = `
      <h3>生成失败</h3>
      <p>${error.message}</p>
      <p>请检查账单额度、模型权限、上传图片和提示词后再重试。</p>
    `;
  } finally {
    $("generateBtn").disabled = false;
    applyProcessModeRules();
  }
});

$("exportRetouchPackageBtn").addEventListener("click", exportRetouchPackage);
$("downloadRetouchBriefBtn").addEventListener("click", () => {
  const values = currentValues();
  downloadBlob(
    new Blob([buildRetouchBrief()], { type: "text/markdown;charset=utf-8" }),
    `${values.clientId}_${values.jobId}_第三方精修说明.md`
  );
  setApiStatus("已下载修图说明");
});
$("downloadRetouchImagesBtn").addEventListener("click", async () => {
  await downloadRetouchImages();
  setApiStatus("已下载原片和参考图");
});
$("retouchedImage").addEventListener("change", () => {
  handleRetouchedUpload($("retouchedImage").files[0]);
});

$("analyzeBtn").addEventListener("click", async () => {
  $("analyzeBtn").disabled = true;
  $("analyzeBtn").textContent = "分析中";
  try {
    const data = await callAnalyzeApi();
    if (data.status !== "completed" || !data.style) {
      throw new Error(data.message || "参考图分析没有成功返回风格结果。");
    }
    applyAnalyzedStyle(data.style);
    setApiStatus("已分析参考图");
  } catch (error) {
    $("styleAnalysis").value = `参考图分析失败：${error.message}`;
    setApiStatus("分析失败");
  } finally {
    $("analyzeBtn").disabled = false;
    $("analyzeBtn").textContent = "分析参考图";
  }
});

$("mockResultBtn").addEventListener("click", () => {
  const src = $("personPreview").src || $("referencePreview").src;
  if (src) {
    showResult(src, "");
    setApiStatus("模拟结果");
  } else {
    setApiStatus("请先上传图片");
  }
});

$("downloadJpgBtn").addEventListener("click", () => {
  if (!latestJpgUrl) {
    setApiStatus("暂无 JPG");
    return;
  }
  const values = currentValues();
  const link = document.createElement("a");
  link.href = latestJpgUrl;
  link.download = `${values.clientId}_${values.jobId}_高质量成片.jpg`;
  link.click();
});

$("deliveryDownloadBtn").addEventListener("click", () => {
  $("downloadJpgBtn").click();
});

$("clearHistoryBtn").addEventListener("click", () => {
  resultHistory = [];
  saveResultHistory();
  renderHistory();
  setApiStatus("历史已清空");
});

$("qaBtn").addEventListener("click", runLocalQa);

$("passBtn").addEventListener("click", () => {
  if (!$("resultPreview").src) {
    renderQaResult({
      status: "rework",
      title: "不能通过",
      body: "还没有生成结果，不能标记通过。",
    });
    return;
  }
  renderQaResult({
    status: "pass",
    title: "已标记通过",
    body: "该结果已标记为可交付，可下载高质量 JPG 并进入客户选片或交付准备。",
  });
});

$("reworkBtn").addEventListener("click", () => {
  renderQaResult({
    status: "rework",
    title: "已标记返工",
    body: "请记录返工原因：脸不像、贴图感、光影不统一、皮肤塑料、手脚畸形、比例失衡、服装穿帮、背景不匹配或发型未匹配。",
  });
});

for (const chip of document.querySelectorAll(".reason-chip")) {
  chip.addEventListener("click", () => {
    chip.classList.toggle("is-selected");
    const selected = [...document.querySelectorAll(".reason-chip.is-selected")]
      .map((item) => item.textContent.trim());
    $("deliveryNote").value = selected.length
      ? `重做原因：${selected.join("、")}。`
      : "";
    setDeliveryState(selected.length ? "需重做" : "待审核");
  });
}

$("copyNoteBtn").addEventListener("click", async () => {
  const note = $("deliveryNote").value.trim() || $("qaResult").innerText.trim();
  await navigator.clipboard.writeText(note);
  $("copyNoteBtn").textContent = "已复制";
  setTimeout(() => {
    $("copyNoteBtn").textContent = "复制备注";
  }, 1200);
});

$("deliveryDownloadBtn").disabled = true;
