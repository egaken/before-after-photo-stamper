// 施工前・施工後 かんたん文字入れアプリ (app.js)

const PLATFORM_CONFIGS = {
  ig_post_portrait: {
    name: 'インスタ投稿（縦長）',
    ratioLabel: '4:5',
    aspectRatio: 4 / 5,
    targetWidth: 1440,
    targetHeight: 1800,
    marginRight: 0.055,
    marginBottom: 0.055,
    hint: '💡 インスタ投稿（縦長4:5）：一覧でも見切れず、スマホ画面で一番大きく見やすい標準設定です。'
  },
  ig_post_square: {
    name: 'インスタ投稿（正方形）',
    ratioLabel: '1:1',
    aspectRatio: 1 / 1,
    targetWidth: 1440,
    targetHeight: 1440,
    marginRight: 0.055,
    marginBottom: 0.055,
    hint: '💡 インスタ投稿（正方形1:1）：プロフィール一覧（グリッド表示）でも端が一切切れずにそのまま表示されます。'
  },
  ig_story: {
    name: 'ストーリーズ',
    ratioLabel: '9:16',
    aspectRatio: 9 / 16,
    targetWidth: 1080,
    targetHeight: 1920,
    marginRight: 0.07,
    marginBottom: 0.18,
    hint: '💡 ストーリーズ（9:16）：画面下の「メッセージ送信」欄や右下のハート・紙飛行機ボタンと重ならないよう、下から18%内側に配置します。'
  },
  google_business: {
    name: 'Googleビジネス',
    ratioLabel: '4:3',
    aspectRatio: 4 / 3,
    targetWidth: 1600,
    targetHeight: 1200,
    marginRight: 0.08,
    marginBottom: 0.08,
    hint: '💡 Googleビジネスプロフィール（4:3）：検索やマップの一覧で端が少しトリミングされても文字が切れないよう、8%内側に配置します。'
  }
};

const WORDING_PRESETS = {
  sekou: { before: '施工前', after: '施工後' },
  english: { before: 'Before', after: 'After' }
};

// アプリの状態管理
const state = {
  platform: 'ig_post_portrait',
  cropMode: 'original', // 'original' | 'preset'
  wordingMode: 'sekou', // 'sekou' | 'english' | 'custom'
  customBefore: '施工前',
  customAfter: '施工後',
  textSizeRatio: 0.072,
  showSafeZoneGuide: false,
  photos: [], // { id, type: 'before'|'after', originalName, img, cropOffset: 0, previewDataUrl }
  combine: {
    direction: 'horizontal', // 'horizontal' | 'vertical'
    frame: 'preset', // 'preset' | 'natural'
    border: 'white', // 'white' | 'black' | 'none'
    selectedBeforeId: null,
    selectedAfterId: null,
    beforeOffset: 0,
    afterOffset: 0
  },
  modalPhotoId: null
};

let photoIdCounter = 1;

// DOM要素の参照
const els = {
  platformPresets: document.getElementById('platformPresets'),
  platformHint: document.getElementById('platformHint'),
  cropModeButtons: document.getElementById('cropModeButtons'),
  wordingButtons: document.getElementById('wordingButtons'),
  customTextInputs: document.getElementById('customTextInputs'),
  customBeforeText: document.getElementById('customBeforeText'),
  customAfterText: document.getElementById('customAfterText'),
  textSizeButtons: document.getElementById('textSizeButtons'),
  showSafeZoneGuide: document.getElementById('showSafeZoneGuide'),

  beforeDropZone: document.getElementById('beforeDropZone'),
  afterDropZone: document.getElementById('afterDropZone'),
  beforeFileInput: document.getElementById('beforeFileInput'),
  afterFileInput: document.getElementById('afterFileInput'),
  beforeCountStatus: document.getElementById('beforeCountStatus'),
  afterCountStatus: document.getElementById('afterCountStatus'),

  stepIndicator1: document.getElementById('stepIndicator1'),
  stepIndicator2: document.getElementById('stepIndicator2'),
  stepIndicator3: document.getElementById('stepIndicator3'),
  guideMessage: document.getElementById('guideMessage'),

  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingText: document.getElementById('loadingText'),

  workspaceSection: document.getElementById('workspaceSection'),
  totalPhotoCount: document.getElementById('totalPhotoCount'),
  tabBtnIndividual: document.getElementById('tabBtnIndividual'),
  tabBtnCombine: document.getElementById('tabBtnCombine'),
  individualTab: document.getElementById('individualTab'),
  combineTab: document.getElementById('combineTab'),

  beforeGroupCount: document.getElementById('beforeGroupCount'),
  afterGroupCount: document.getElementById('afterGroupCount'),
  beforePhotoGrid: document.getElementById('beforePhotoGrid'),
  afterPhotoGrid: document.getElementById('afterPhotoGrid'),
  addMoreBeforeBtn: document.getElementById('addMoreBeforeBtn'),
  addMoreAfterBtn: document.getElementById('addMoreAfterBtn'),

  shareAllBtn: document.getElementById('shareAllBtn'),
  downloadAllSeqBtn: document.getElementById('downloadAllSeqBtn'),
  downloadZipBtn: document.getElementById('downloadZipBtn'),
  clearAllBtn: document.getElementById('clearAllBtn'),

  combineDirectionButtons: document.getElementById('combineDirectionButtons'),
  combineFrameButtons: document.getElementById('combineFrameButtons'),
  combineBorderButtons: document.getElementById('combineBorderButtons'),
  currentPresetRatioLabel: document.getElementById('currentPresetRatioLabel'),
  combineBeforeThumbs: document.getElementById('combineBeforeThumbs'),
  combineAfterThumbs: document.getElementById('combineAfterThumbs'),
  combineCanvas: document.getElementById('combineCanvas'),
  combineEmptyMsg: document.getElementById('combineEmptyMsg'),
  combineFineTune: document.getElementById('combineFineTune'),
  combineBeforeOffset: document.getElementById('combineBeforeOffset'),
  combineAfterOffset: document.getElementById('combineAfterOffset'),
  resetBeforeOffset: document.getElementById('resetBeforeOffset'),
  resetAfterOffset: document.getElementById('resetAfterOffset'),
  downloadCombinedBtn: document.getElementById('downloadCombinedBtn'),
  shareCombinedBtn: document.getElementById('shareCombinedBtn'),

  previewModal: document.getElementById('previewModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalImage: document.getElementById('modalImage'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  modalDownloadBtn: document.getElementById('modalDownloadBtn')
};

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font ready check skipped:', e);
    }
  }
  bindEvents();
  updateLabelsInDOM();
  updateGuideBanner();
});

// 現在の「前」「後」ラベル文字列を取得
function getCurrentLabels() {
  if (state.wordingMode === 'custom') {
    return {
      before: state.customBefore.trim() || '施工前',
      after: state.customAfter.trim() || '施工後'
    };
  }
  return WORDING_PRESETS[state.wordingMode] || WORDING_PRESETS.sekou;
}

// 画面内の「施工前」「施工後」表示テキストを一括更新
function updateLabelsInDOM() {
  const labels = getCurrentLabels();
  document.querySelectorAll('.js-before-label').forEach(el => {
    el.textContent = labels.before;
  });
  document.querySelectorAll('.js-after-label').forEach(el => {
    el.textContent = labels.after;
  });
}

// イベント登録
function bindEvents() {
  // 投稿先プリセット切り替え
  els.platformPresets.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;
    const platform = btn.dataset.platform;
    if (!PLATFORM_CONFIGS[platform]) return;

    state.platform = platform;
    els.platformPresets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    els.platformHint.textContent = PLATFORM_CONFIGS[platform].hint;
    els.currentPresetRatioLabel.textContent = PLATFORM_CONFIGS[platform].ratioLabel;

    refreshAllPreviews();
  });

  // 切り抜きモード切り替え
  els.cropModeButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    state.cropMode = btn.dataset.crop;
    els.cropModeButtons.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    refreshAllPreviews();
  });

  // 文字の表記切り替え
  els.wordingButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    state.wordingMode = btn.dataset.wording;
    els.wordingButtons.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (state.wordingMode === 'custom') {
      els.customTextInputs.classList.remove('hidden');
    } else {
      els.customTextInputs.classList.add('hidden');
    }
    updateLabelsInDOM();
    refreshAllPreviews();
  });

  els.customBeforeText.addEventListener('input', (e) => {
    state.customBefore = e.target.value;
    updateLabelsInDOM();
    refreshAllPreviews();
  });

  els.customAfterText.addEventListener('input', (e) => {
    state.customAfter = e.target.value;
    updateLabelsInDOM();
    refreshAllPreviews();
  });

  // 文字サイズ切り替え
  els.textSizeButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    state.textSizeRatio = parseFloat(btn.dataset.size);
    els.textSizeButtons.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    refreshAllPreviews();
  });

  // ガイドライン表示切り替え
  els.showSafeZoneGuide.addEventListener('change', (e) => {
    state.showSafeZoneGuide = e.target.checked;
    refreshAllPreviews();
  });

  // ファイル選択（①施工前 / ②施工後）
  els.beforeFileInput.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFilesUpload(Array.from(e.target.files), 'before');
      e.target.value = '';
    }
  });

  els.afterFileInput.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFilesUpload(Array.from(e.target.files), 'after');
      e.target.value = '';
    }
  });

  // 追加ボタン
  els.addMoreBeforeBtn.addEventListener('click', () => els.beforeFileInput.click());
  els.addMoreAfterBtn.addEventListener('click', () => els.afterFileInput.click());

  // ドラッグ＆ドロップ設定
  setupDropZone(els.beforeDropZone, 'before');
  setupDropZone(els.afterDropZone, 'after');

  // タブ切り替え
  document.querySelectorAll('.mode-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tabBtn.classList.add('active');
      const targetId = tabBtn.dataset.tab;
      document.getElementById(targetId).classList.add('active');
      if (targetId === 'combineTab') {
        renderCombinedCanvas();
      }
    });
  });

  // 一括保存・共有・クリア
  els.shareAllBtn.addEventListener('click', shareAllPhotos);
  els.downloadAllSeqBtn.addEventListener('click', downloadAllSequentially);
  els.downloadZipBtn.addEventListener('click', downloadAllAsZip);
  els.clearAllBtn.addEventListener('click', () => {
    if (confirm('読み込んだ写真をすべてクリアして最初からやり直しますか？')) {
      state.photos = [];
      state.combine.selectedBeforeId = null;
      state.combine.selectedAfterId = null;
      refreshAllPreviews();
    }
  });

  // 2枚合体設定ボタン
  els.combineDirectionButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    state.combine.direction = btn.dataset.dir;
    els.combineDirectionButtons.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCombinedCanvas();
  });

  els.combineFrameButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    state.combine.frame = btn.dataset.frame;
    els.combineFrameButtons.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCombinedCanvas();
  });

  els.combineBorderButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    state.combine.border = btn.dataset.border;
    els.combineBorderButtons.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCombinedCanvas();
  });

  els.combineBeforeOffset.addEventListener('input', (e) => {
    state.combine.beforeOffset = parseInt(e.target.value, 10) || 0;
    renderCombinedCanvas();
  });

  els.combineAfterOffset.addEventListener('input', (e) => {
    state.combine.afterOffset = parseInt(e.target.value, 10) || 0;
    renderCombinedCanvas();
  });

  els.resetBeforeOffset.addEventListener('click', () => {
    state.combine.beforeOffset = 0;
    els.combineBeforeOffset.value = 0;
    renderCombinedCanvas();
  });

  els.resetAfterOffset.addEventListener('click', () => {
    state.combine.afterOffset = 0;
    els.combineAfterOffset.value = 0;
    renderCombinedCanvas();
  });

  els.downloadCombinedBtn.addEventListener('click', downloadCombinedImage);
  els.shareCombinedBtn.addEventListener('click', shareCombinedImage);

  // モーダル操作
  els.closeModalBtn.addEventListener('click', closePreviewModal);
  els.previewModal.addEventListener('click', (e) => {
    if (e.target === els.previewModal) closePreviewModal();
  });
  els.modalDownloadBtn.addEventListener('click', () => {
    if (state.modalPhotoId) {
      downloadSinglePhoto(state.modalPhotoId);
    }
  });
}

// ドラッグ＆ドロップ設定
function setupDropZone(zoneEl, type) {
  ['dragenter', 'dragover'].forEach(evtName => {
    zoneEl.addEventListener(evtName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zoneEl.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(evtName => {
    zoneEl.addEventListener(evtName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zoneEl.classList.remove('drag-over');
    });
  });

  zoneEl.addEventListener('drop', async (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await handleFilesUpload(Array.from(files), type);
    }
  });
}

// ファイルがHEICかどうか判定
function isHeicFile(file) {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif') || type.includes('heic') || type.includes('heif');
}

// BlobまたはFileからHTMLImageElementを生成
function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

// HEIC対応の画像読み込み関数
async function loadFileAsImage(file) {
  // HEICファイルの場合、まずheic2anyでJPEG変換を試みる（Safari等でネイティブ対応している場合のフォールバック付き）
  if (isHeicFile(file)) {
    if (typeof window.heic2any === 'function') {
      try {
        const converted = await window.heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.94
        });
        const targetBlob = Array.isArray(converted) ? converted[0] : converted;
        return await loadImageFromBlob(targetBlob);
      } catch (heicErr) {
        console.warn('heic2any変換スキップ、ブラウザ標準デコードを試みます:', heicErr);
        return await loadImageFromBlob(file);
      }
    } else {
      return await loadImageFromBlob(file);
    }
  }

  // 通常画像（万が一拡張子偽装のHEICだった場合はheic2anyへフォールバック）
  try {
    return await loadImageFromBlob(file);
  } catch (err) {
    if (typeof window.heic2any === 'function') {
      const converted = await window.heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.94
      });
      const targetBlob = Array.isArray(converted) ? converted[0] : converted;
      return await loadImageFromBlob(targetBlob);
    }
    throw err;
  }
}

// 複数ファイルのアップロード＆変換処理
async function handleFilesUpload(files, type) {
  if (!files || files.length === 0) return;

  els.loadingOverlay.classList.remove('hidden');
  const labels = getCurrentLabels();
  const typeLabel = type === 'before' ? labels.before : labels.after;

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      els.loadingText.textContent = `【${typeLabel}】の写真を読み込み中... (${i + 1} / ${files.length}枚目)`;
      try {
        const img = await loadFileAsImage(file);
        const cleanName = (file.name || `photo_${photoIdCounter}`).replace(/\.[^/.]+$/, '');
        const newPhoto = {
          id: `photo_${photoIdCounter++}`,
          type,
          originalName: cleanName,
          img,
          cropOffset: 0,
          previewDataUrl: ''
        };
        state.photos.push(newPhoto);
      } catch (fileErr) {
        console.error('写真の読み込みに失敗:', file.name, fileErr);
        alert(`「${file.name}」の読み込みに失敗しました。対応している画像形式かご確認ください。`);
      }
    }

    ensureCombineSelection();
    refreshAllPreviews();
  } finally {
    els.loadingOverlay.classList.add('hidden');
  }
}

// 合体タブ用の初期選択を自動でセット（1枚ずつの場合も選び直し不要にする）
function ensureCombineSelection() {
  const beforePhotos = state.photos.filter(p => p.type === 'before');
  const afterPhotos = state.photos.filter(p => p.type === 'after');

  if (beforePhotos.length > 0) {
    const exists = beforePhotos.some(p => p.id === state.combine.selectedBeforeId);
    if (!exists) state.combine.selectedBeforeId = beforePhotos[0].id;
  } else {
    state.combine.selectedBeforeId = null;
  }

  if (afterPhotos.length > 0) {
    const exists = afterPhotos.some(p => p.id === state.combine.selectedAfterId);
    if (!exists) state.combine.selectedAfterId = afterPhotos[0].id;
  } else {
    state.combine.selectedAfterId = null;
  }
}

// ステップガイドバナーと枚数表示の更新
function updateGuideBanner() {
  const beforeCount = state.photos.filter(p => p.type === 'before').length;
  const afterCount = state.photos.filter(p => p.type === 'after').length;
  const totalCount = state.photos.length;
  const labels = getCurrentLabels();

  els.beforeCountStatus.textContent = `現在 ${beforeCount} 枚`;
  els.afterCountStatus.textContent = `現在 ${afterCount} 枚`;
  els.totalPhotoCount.textContent = totalCount;
  els.beforeGroupCount.textContent = beforeCount;
  els.afterGroupCount.textContent = afterCount;

  els.stepIndicator1.className = 'guide-step';
  els.stepIndicator2.className = 'guide-step';
  els.stepIndicator3.className = 'guide-step';

  if (beforeCount === 0 && afterCount === 0) {
    els.stepIndicator1.classList.add('active');
    els.guideMessage.innerHTML = `まずは下の<strong>「① ${labels.before}の写真を追加」</strong>から写真をアップしてください（1枚だけでも、3〜4枚まとめてでもOKです！）`;
  } else if (beforeCount > 0 && afterCount === 0) {
    els.stepIndicator1.classList.add('done');
    els.stepIndicator2.classList.add('active');
    els.guideMessage.innerHTML = `👍 <strong>${labels.before}の写真（${beforeCount}枚）</strong>に文字が入りました！続けて<strong>「② ${labels.after}の写真を追加」</strong>をアップしてください（${labels.before}だけでよければすぐ下から保存できます）`;
  } else if (beforeCount === 0 && afterCount > 0) {
    els.stepIndicator2.classList.add('done');
    els.stepIndicator1.classList.add('active');
    els.guideMessage.innerHTML = `👍 <strong>${labels.after}の写真（${afterCount}枚）</strong>に文字が入りました！必要であれば<strong>「① ${labels.before}の写真」</strong>も追加できます。`;
  } else {
    els.stepIndicator1.classList.add('done');
    els.stepIndicator2.classList.add('done');
    els.stepIndicator3.classList.add('active');
    els.guideMessage.innerHTML = `🎉 <strong>${labels.before}（${beforeCount}枚）・${labels.after}（${afterCount}枚）</strong>の準備ができました！下の一覧から保存するか、<strong>「🆚 2枚を1枚に合体」</strong>タブで比較画像を作れます。`;
  }

  if (totalCount > 0) {
    els.workspaceSection.classList.remove('hidden');
  } else {
    els.workspaceSection.classList.add('hidden');
  }
}

// 1枚の写真をCanvasに描画して返す（exportMode=trueのときはガイド枠を描画しない）
function renderSinglePhotoToCanvas(photo, exportMode = false) {
  const preset = PLATFORM_CONFIGS[state.platform];
  const labels = getCurrentLabels();
  const text = photo.type === 'before' ? labels.before : labels.after;
  const img = photo.img;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let targetW, targetH;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (state.cropMode === 'preset') {
    // 投稿先のアスペクト比に合わせて切り抜く
    const targetRatio = preset.aspectRatio;
    const imgRatio = sw / sh;

    if (imgRatio > targetRatio) {
      // 元画像の方が横長 → 左右をトリミング（cropOffsetで左右シフト可能）
      const newSw = Math.round(sh * targetRatio);
      const maxShift = (sw - newSw) / 2;
      const shift = (photo.cropOffset / 50) * maxShift;
      sx = Math.round((sw - newSw) / 2 + shift);
      sw = newSw;
    } else if (imgRatio < targetRatio) {
      // 元画像の方が縦長 → 上下をトリミング（cropOffsetで上下シフト可能）
      const newSh = Math.round(sw / targetRatio);
      const maxShift = (sh - newSh) / 2;
      const shift = (photo.cropOffset / 50) * maxShift;
      sy = Math.round((sh - newSh) / 2 + shift);
      sh = newSh;
    }

    // 出力解像度は元画像の解像度感を保ちつつ高画質に
    targetW = preset.targetWidth;
    targetH = preset.targetHeight;
  } else {
    // 元の写真の縦横比のまま（最大長辺2400pxに抑えて高画質かつ軽快に処理）
    const maxDim = 2400;
    if (sw > maxDim || sh > maxDim) {
      if (sw >= sh) {
        targetW = maxDim;
        targetH = Math.round((sh / sw) * maxDim);
      } else {
        targetH = maxDim;
        targetW = Math.round((sw / sh) * maxDim);
      }
    } else {
      targetW = sw;
      targetH = sh;
    }
  }

  canvas.width = targetW;
  canvas.height = targetH;

  // 高品質補間
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 背景写真をを描画
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

  // プレビュー用ガイド枠（保存用画像には描かない）
  if (!exportMode && state.showSafeZoneGuide) {
    drawSafeZoneOverlay(ctx, targetW, targetH, preset.marginRight, preset.marginBottom);
  }

  // 右下の安全領域に「白文字＋黒縁取り」を描画
  drawOutlinedLabel(
    ctx,
    text,
    targetW,
    targetH,
    preset.marginRight,
    preset.marginBottom,
    state.textSizeRatio
  );

  return canvas;
}

// 白文字＋黒の縁取り文字を右下の指定余白位置に描画する共通関数
function drawOutlinedLabel(ctx, text, areaWidth, areaHeight, marginRightRatio, marginBottomRatio, fontSizeRatio, offsetX = 0, offsetY = 0) {
  if (!text) return;

  const shortSide = Math.min(areaWidth, areaHeight);
  const fontSize = Math.max(18, Math.round(shortSide * fontSizeRatio));

  ctx.save();
  ctx.font = `900 ${fontSize}px "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';

  const padRight = Math.round(areaWidth * marginRightRatio);
  const padBottom = Math.round(areaHeight * marginBottomRatio);

  const x = offsetX + areaWidth - padRight;
  // alphabeticベースラインなので文字の下端がほぼpadBottomに来るよう微調整
  const y = offsetY + areaHeight - padBottom - Math.round(fontSize * 0.08);

  // 1. どんな背景でも浮き上がるよう、外側に控えめな黒シャドウ＋しっかりした黒縁取りを描画
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.miterLimit = 2;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.max(4, Math.round(fontSize * 0.1));
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.max(2, Math.round(fontSize * 0.03));

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(4, Math.round(fontSize * 0.22));
  ctx.strokeText(text, x, y);

  // 2. シャドウを切って、もう1回くっきりした黒縁を重ねる（角のシャープさと視認性向上）
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeText(text, x, y);

  // 3. 純白の塗りつぶしを描画
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, x, y);

  ctx.restore();
}

// セーフゾーン（見切れ防止ライン）のガイド描画（プレビュー専用）
function drawSafeZoneOverlay(ctx, w, h, marginRightRatio, marginBottomRatio) {
  ctx.save();
  const mr = Math.round(w * marginRightRatio);
  const mb = Math.round(h * marginBottomRatio);

  // 下部・右部の危険領域をうっすら赤みのある半透明で示す
  ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
  ctx.fillRect(0, h - mb, w, mb);
  ctx.fillRect(w - mr, 0, mr, h - mb);

  // 安全境界の点線
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.003));
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(mr, mr, w - mr * 2, h - mr - mb);
  ctx.restore();
}

// 全写真のプレビューと一覧カードを更新
function refreshAllPreviews() {
  ensureCombineSelection();
  updateGuideBanner();

  // 各写真のプレビューURL生成
  state.photos.forEach(photo => {
    const canvas = renderSinglePhotoToCanvas(photo, false);
    photo.previewDataUrl = canvas.toDataURL('image/jpeg', 0.88);
  });

  renderPhotoGroup('before', els.beforePhotoGrid);
  renderPhotoGroup('after', els.afterPhotoGrid);
  renderCombineThumbnails();
  renderCombinedCanvas();
}

// グループごとのカード一覧描画
function renderPhotoGroup(type, containerEl) {
  const groupPhotos = state.photos.filter(p => p.type === type);
  const labels = getCurrentLabels();
  const groupLabel = type === 'before' ? labels.before : labels.after;
  const oppositeLabel = type === 'before' ? labels.after : labels.before;

  containerEl.innerHTML = '';

  if (groupPhotos.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-group-msg';
    emptyDiv.textContent = `まだ【${groupLabel}】の写真がありません。上のボタンから追加できます。`;
    containerEl.appendChild(emptyDiv);
    return;
  }

  groupPhotos.forEach((photo, idx) => {
    const card = document.createElement('div');
    card.className = 'photo-card';

    const cropControlHtml = state.cropMode === 'preset' ? `
      <div class="crop-offset-control">
        <span>切り抜き位置:</span>
        <input type="range" class="js-crop-slider" min="-50" max="50" value="${photo.cropOffset}">
      </div>
    ` : '';

    card.innerHTML = `
      <div class="photo-preview-wrap" title="クリックで拡大確認">
        <img src="${photo.previewDataUrl}" alt="${groupLabel}_${idx + 1}">
        <span class="zoom-badge">🔍 タップで拡大</span>
        <button type="button" class="delete-photo-btn" title="この写真を削除">✕</button>
      </div>
      <div class="photo-card-body">
        <div class="photo-meta">
          <span class="photo-filename">${idx + 1}. ${escapeHtml(photo.originalName)}</span>
          <span>【${groupLabel}】</span>
        </div>
        ${cropControlHtml}
        <div class="photo-card-actions">
          <button type="button" class="card-save-btn">💾 この写真を保存</button>
          <button type="button" class="card-switch-btn" title="前/後を入れ替える">⇄ ${oppositeLabel}へ移動</button>
        </div>
      </div>
    `;

    // 拡大プレビュー
    const previewWrap = card.querySelector('.photo-preview-wrap');
    previewWrap.addEventListener('click', (e) => {
      if (e.target.closest('.delete-photo-btn')) return;
      openPreviewModal(photo.id);
    });

    // 削除ボタン
    card.querySelector('.delete-photo-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      state.photos = state.photos.filter(p => p.id !== photo.id);
      refreshAllPreviews();
    });

    // 切り抜き位置スライダー
    const cropSlider = card.querySelector('.js-crop-slider');
    if (cropSlider) {
      cropSlider.addEventListener('input', (e) => {
        photo.cropOffset = parseInt(e.target.value, 10) || 0;
        const updatedCanvas = renderSinglePhotoToCanvas(photo, false);
        photo.previewDataUrl = updatedCanvas.toDataURL('image/jpeg', 0.88);
        card.querySelector('.photo-preview-wrap img').src = photo.previewDataUrl;
      });
    }

    // 保存ボタン
    card.querySelector('.card-save-btn').addEventListener('click', () => {
      downloadSinglePhoto(photo.id);
    });

    // 前/後の入れ替えボタン
    card.querySelector('.card-switch-btn').addEventListener('click', () => {
      photo.type = photo.type === 'before' ? 'after' : 'before';
      refreshAllPreviews();
    });

    containerEl.appendChild(card);
  });
}

// 拡大モーダルを開く
function openPreviewModal(photoId) {
  const photo = state.photos.find(p => p.id === photoId);
  if (!photo) return;
  const labels = getCurrentLabels();
  const typeLabel = photo.type === 'before' ? labels.before : labels.after;

  // 保存用と同じクリーンな高画質画像を生成して表示
  const cleanCanvas = renderSinglePhotoToCanvas(photo, true);
  els.modalTitle.textContent = `【${typeLabel}】 ${photo.originalName}`;
  els.modalImage.src = cleanCanvas.toDataURL('image/jpeg', 0.95);
  state.modalPhotoId = photoId;
  els.previewModal.classList.remove('hidden');
}

function closePreviewModal() {
  els.previewModal.classList.add('hidden');
  state.modalPhotoId = null;
}

// CanvasからBlobを生成するヘルパー
function canvasToBlob(canvas, quality = 0.95) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

// 保存用ファイル名を作成
function getOutputFilename(photo, indexInGroup) {
  const labels = getCurrentLabels();
  const prefix = photo.type === 'before' ? labels.before : labels.after;
  const numStr = indexInGroup !== undefined ? `_${indexInGroup + 1}` : '';
  return `${prefix}${numStr}_${photo.originalName}.jpg`;
}

// 単一写真のダウンロード
async function downloadSinglePhoto(photoId) {
  const photo = state.photos.find(p => p.id === photoId);
  if (!photo) return;

  const groupPhotos = state.photos.filter(p => p.type === photo.type);
  const idx = groupPhotos.findIndex(p => p.id === photo.id);
  const filename = getOutputFilename(photo, idx);

  const canvas = renderSinglePhotoToCanvas(photo, true);
  const blob = await canvasToBlob(canvas, 0.95);
  triggerBlobDownload(blob, filename);
}

// ブラウザのダウンロードを発火
function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// 全写真を1枚ずつ連続ダウンロード
async function downloadAllSequentially() {
  if (state.photos.length === 0) return;
  const beforePhotos = state.photos.filter(p => p.type === 'before');
  const afterPhotos = state.photos.filter(p => p.type === 'after');
  const ordered = [
    ...beforePhotos.map((p, i) => ({ photo: p, idx: i })),
    ...afterPhotos.map((p, i) => ({ photo: p, idx: i }))
  ];

  for (let i = 0; i < ordered.length; i++) {
    const { photo, idx } = ordered[i];
    const canvas = renderSinglePhotoToCanvas(photo, true);
    const blob = await canvasToBlob(canvas, 0.95);
    triggerBlobDownload(blob, getOutputFilename(photo, idx));
    await new Promise(r => setTimeout(r, 350));
  }
}

// スマホの共有シート（写真フォルダへ一括保存）
async function shareAllPhotos() {
  if (state.photos.length === 0) return;

  const beforePhotos = state.photos.filter(p => p.type === 'before');
  const afterPhotos = state.photos.filter(p => p.type === 'after');
  const ordered = [
    ...beforePhotos.map((p, i) => ({ photo: p, idx: i })),
    ...afterPhotos.map((p, i) => ({ photo: p, idx: i }))
  ];

  const files = [];
  for (const { photo, idx } of ordered) {
    const canvas = renderSinglePhotoToCanvas(photo, true);
    const blob = await canvasToBlob(canvas, 0.95);
    const filename = getOutputFilename(photo, idx);
    files.push(new File([blob], filename, { type: 'image/jpeg' }));
  }

  if (navigator.canShare && navigator.canShare({ files })) {
    try {
      await navigator.share({
        files,
        title: '施工前・施工後 写真'
      });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Web Share API failed, falling back to sequential download:', err);
    }
  }

  // Web Share非対応ブラウザ（PC等）の場合は連続ダウンロードを実行
  await downloadAllSequentially();
}

// ZIPで一括保存
async function downloadAllAsZip() {
  if (state.photos.length === 0) return;
  if (typeof window.JSZip !== 'function') {
    await downloadAllSequentially();
    return;
  }

  const zip = new window.JSZip();
  const beforePhotos = state.photos.filter(p => p.type === 'before');
  const afterPhotos = state.photos.filter(p => p.type === 'after');

  for (let i = 0; i < beforePhotos.length; i++) {
    const p = beforePhotos[i];
    const canvas = renderSinglePhotoToCanvas(p, true);
    const blob = await canvasToBlob(canvas, 0.95);
    zip.file(getOutputFilename(p, i), blob);
  }

  for (let i = 0; i < afterPhotos.length; i++) {
    const p = afterPhotos[i];
    const canvas = renderSinglePhotoToCanvas(p, true);
    const blob = await canvasToBlob(canvas, 0.95);
    zip.file(getOutputFilename(p, i), blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  triggerBlobDownload(zipBlob, `施工前後写真_${dateStr}.zip`);
}

// ==========================================================
// タブ2：2枚を1枚に合体（左右・上下の比較画像）
// ==========================================================

function renderCombineThumbnails() {
  const beforePhotos = state.photos.filter(p => p.type === 'before');
  const afterPhotos = state.photos.filter(p => p.type === 'after');

  els.combineBeforeThumbs.innerHTML = '';
  els.combineAfterThumbs.innerHTML = '';

  if (beforePhotos.length === 0) {
    els.combineBeforeThumbs.innerHTML = '<span style="font-size:0.82rem;color:#64748b;">まだ写真がありません</span>';
  } else {
    beforePhotos.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = `thumb-item ${p.id === state.combine.selectedBeforeId ? 'selected' : ''}`;
      div.innerHTML = `
        <img src="${p.previewDataUrl}" alt="前${i + 1}">
        <span class="thumb-badge">#${i + 1}</span>
      `;
      div.addEventListener('click', () => {
        state.combine.selectedBeforeId = p.id;
        renderCombineThumbnails();
        renderCombinedCanvas();
      });
      els.combineBeforeThumbs.appendChild(div);
    });
  }

  if (afterPhotos.length === 0) {
    els.combineAfterThumbs.innerHTML = '<span style="font-size:0.82rem;color:#64748b;">まだ写真がありません</span>';
  } else {
    afterPhotos.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = `thumb-item ${p.id === state.combine.selectedAfterId ? 'selected' : ''}`;
      div.innerHTML = `
        <img src="${p.previewDataUrl}" alt="後${i + 1}">
        <span class="thumb-badge">#${i + 1}</span>
      `;
      div.addEventListener('click', () => {
        state.combine.selectedAfterId = p.id;
        renderCombineThumbnails();
        renderCombinedCanvas();
      });
      els.combineAfterThumbs.appendChild(div);
    });
  }
}

// 指定した枠(destW x destH)に画像を中央トリミング（offset対応）で描画するヘルパー
function drawImageCoverWithOffset(ctx, img, dx, dy, dw, dh, offsetPercent = 0) {
  const swOrig = img.naturalWidth;
  const shOrig = img.naturalHeight;
  const targetRatio = dw / dh;
  const imgRatio = swOrig / shOrig;

  let sx = 0, sy = 0, sw = swOrig, sh = shOrig;

  if (imgRatio > targetRatio) {
    const newSw = Math.round(shOrig * targetRatio);
    const maxShift = (swOrig - newSw) / 2;
    const shift = (offsetPercent / 50) * maxShift;
    sx = Math.round((swOrig - newSw) / 2 + shift);
    sw = newSw;
  } else if (imgRatio < targetRatio) {
    const newSh = Math.round(swOrig / targetRatio);
    const maxShift = (shOrig - newSh) / 2;
    const shift = (offsetPercent / 50) * maxShift;
    sy = Math.round((shOrig - newSh) / 2 + shift);
    sh = newSh;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// 2枚合体Canvasの描画
function renderCombinedCanvas() {
  const beforePhoto = state.photos.find(p => p.id === state.combine.selectedBeforeId);
  const afterPhoto = state.photos.find(p => p.id === state.combine.selectedAfterId);

  if (!beforePhoto || !afterPhoto) {
    els.combineCanvas.classList.add('hidden');
    els.combineEmptyMsg.classList.remove('hidden');
    els.combineFineTune.classList.add('hidden');
    els.downloadCombinedBtn.disabled = true;
    els.shareCombinedBtn.disabled = true;
    return;
  }

  els.combineCanvas.classList.remove('hidden');
  els.combineEmptyMsg.classList.add('hidden');
  els.combineFineTune.classList.remove('hidden');
  els.downloadCombinedBtn.disabled = false;
  els.shareCombinedBtn.disabled = false;

  const preset = PLATFORM_CONFIGS[state.platform];
  const labels = getCurrentLabels();
  const canvas = els.combineCanvas;
  const ctx = canvas.getContext('2d');

  let totalW, totalH;
  const isHoriz = state.combine.direction === 'horizontal';

  if (state.combine.frame === 'preset') {
    totalW = preset.targetWidth;
    totalH = preset.targetHeight;
  } else {
    // 2枚をそのまま連結（1枚目の比率を基準に揃えて並べる）
    const baseRatio = beforePhoto.img.naturalWidth / beforePhoto.img.naturalHeight;
    if (isHoriz) {
      const halfW = 1080;
      const halfH = Math.round(halfW / baseRatio);
      totalW = halfW * 2;
      totalH = halfH;
    } else {
      const halfW = 1200;
      const halfH = Math.round(halfW / baseRatio);
      totalW = halfW;
      totalH = halfH * 2;
    }
  }

  canvas.width = totalW;
  canvas.height = totalH;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (isHoriz) {
    // 左右に並べる（左：施工前 ／ 右：施工後）
    const halfW = Math.floor(totalW / 2);
    const rightW = totalW - halfW;

    drawImageCoverWithOffset(ctx, beforePhoto.img, 0, 0, halfW, totalH, state.combine.beforeOffset);
    drawImageCoverWithOffset(ctx, afterPhoto.img, halfW, 0, rightW, totalH, state.combine.afterOffset);

    // 境界線
    if (state.combine.border !== 'none') {
      ctx.save();
      ctx.fillStyle = state.combine.border === 'white' ? '#FFFFFF' : '#000000';
      const lineW = Math.max(4, Math.round(totalW * 0.005));
      ctx.fillRect(halfW - Math.floor(lineW / 2), 0, lineW, totalH);
      ctx.restore();
    }

    // それぞれの右下安全位置に文字入れ
    drawOutlinedLabel(
      ctx,
      labels.before,
      halfW,
      totalH,
      Math.max(0.06, preset.marginRight),
      preset.marginBottom,
      state.textSizeRatio,
      0,
      0
    );
    drawOutlinedLabel(
      ctx,
      labels.after,
      rightW,
      totalH,
      Math.max(0.06, preset.marginRight),
      preset.marginBottom,
      state.textSizeRatio,
      halfW,
      0
    );
  } else {
    // 上下に並べる（上：施工前 ／ 下：施工後）
    const halfH = Math.floor(totalH / 2);
    const bottomH = totalH - halfH;

    drawImageCoverWithOffset(ctx, beforePhoto.img, 0, 0, totalW, halfH, state.combine.beforeOffset);
    drawImageCoverWithOffset(ctx, afterPhoto.img, 0, halfH, totalW, bottomH, state.combine.afterOffset);

    // 境界線
    if (state.combine.border !== 'none') {
      ctx.save();
      ctx.fillStyle = state.combine.border === 'white' ? '#FFFFFF' : '#000000';
      const lineH = Math.max(4, Math.round(totalH * 0.005));
      ctx.fillRect(0, halfH - Math.floor(lineH / 2), totalW, lineH);
      ctx.restore();
    }

    // 上段の施工前は境界線より少し上（6%内側）、下段の施工後は媒体の安全マージン（ストーリーズなら18%内側など）に配置
    drawOutlinedLabel(
      ctx,
      labels.before,
      totalW,
      halfH,
      preset.marginRight,
      0.07,
      state.textSizeRatio,
      0,
      0
    );
    drawOutlinedLabel(
      ctx,
      labels.after,
      totalW,
      bottomH,
      preset.marginRight,
       Math.max(0.07, preset.marginBottom),
      state.textSizeRatio,
      0,
      halfH
    );
  }
}

// 合体画像の保存
async function downloadCombinedImage() {
  if (els.combineCanvas.classList.contains('hidden')) return;
  const labels = getCurrentLabels();
  const blob = await canvasToBlob(els.combineCanvas, 0.95);
  triggerBlobDownload(blob, `${labels.before}_${labels.after}_比較画像.jpg`);
}

// 合体画像のスマホ共有・保存
async function shareCombinedImage() {
  if (els.combineCanvas.classList.contains('hidden')) return;
  const labels = getCurrentLabels();
  const filename = `${labels.before}_${labels.after}_比較画像.jpg`;
  const blob = await canvasToBlob(els.combineCanvas, 0.95);
  const file = new File([blob], filename, { type: 'image/jpeg' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `${labels.before}・${labels.after} 比較画像`
      });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }
  triggerBlobDownload(blob, filename);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
