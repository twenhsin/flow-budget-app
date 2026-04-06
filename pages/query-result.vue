<template>
  <div class="qr-screen">
    <!-- Empty state (no result yet / after refresh) -->
    <template v-if="!hasResult">
      <div class="empty-header">讓 AI 幫你整理每一筆消費</div>
      <div class="empty-headline">輸入條件，<br>算出你想知道<br>的每一個數字</div>
      <div class="empty-spacer" />
    </template>

    <!-- Result state -->
    <template v-else>
      <!-- Header -->
      <div class="qr-header">
        <div class="qr-title" v-html="result.title" />
        <div class="qr-sub">{{ formattedRange }}</div>
      </div>
      <div class="qr-scroll">
      <!-- Summary area -->
      <div v-if="result.queryType !== 'top_n' && result.queryType !== 'analysis_compare' && result.queryType !== 'analysis_category_change' && result.queryType !== 'analysis_ratio' && result.queryType !== 'analysis_full' && result.queryType !== 'analysis_peak'" class="qr-total">
        <span class="qr-total-label">總計</span>
        <span class="qr-total-amount">-{{ formatAmount(result.total) }}</span>
      </div>
      <div v-else-if="result.queryType === 'analysis_compare' || result.queryType === 'analysis_category_change'" class="qr-compare-summary">
        <div class="compare-sum-col">
          <span class="compare-sum-label">{{ result.currentLabel ?? '本期' }}</span>
          <span class="compare-sum-amount">-{{ formatAmount(result.total) }}</span>
        </div>
        <div class="compare-sum-vs">vs</div>
        <div class="compare-sum-col">
          <span class="compare-sum-label">{{ result.previousLabel ?? '上期' }}</span>
          <span class="compare-sum-amount compare-sum-prev">-{{ formatAmount(result.compareTotal ?? 0) }}</span>
        </div>
        <div class="compare-sum-diff" :class="compareDiff >= 0 ? 'change-up' : 'change-down'">
          {{ compareDiff >= 0 ? '▲' : '▼' }} {{ formatAmount(Math.abs(compareDiff)) }}
        </div>
      </div>
      <div v-else-if="result.queryType === 'analysis_ratio'" class="qr-ratio-summary">
        <template v-for="(ri, idx) in (result.ratioItems ?? [])" :key="ri.keyword">
          <div :class="['ratio-keyword-group', idx > 0 ? 'ratio-keyword-gap' : '']">
            <template v-if="ri.keywordTotal === 0">
              <div class="ratio-no-data">{{ ri.keyword }}：本期無此消費</div>
            </template>
            <template v-else>
              <div class="ratio-block">
                <div class="ratio-block-header">
                  <span class="ratio-block-label">{{ ri.keyword }}佔比</span>
                </div>
                <div class="ratio-bar-wrap">
                  <div class="ratio-bar-base"></div>
                  <div
                    v-if="ri.keywordCategory && ri.keywordCategory !== ri.keyword"
                    class="ratio-bar-mid"
                    :style="{
                      width: Math.min(ri.grandTotal > 0 ? ri.categoryTotal / ri.grandTotal * 100 : 0, 100) + '%',
                      background: catColor(ri.keywordCategory)
                    }"
                  ></div>
                  <div
                    class="ratio-bar-front"
                    :style="{ width: Math.min(ri.ratioOfGrand, 100) + '%' }"
                  ></div>
                </div>
                <div class="ratio-stats-row">
                  <span class="ratio-stat">總消費：<span style="font-weight:600">{{ formatAmount(ri.grandTotal) }}</span></span>
                  <span v-if="ri.keywordCategory && ri.keywordCategory !== ri.keyword" class="ratio-stat">
                    <span :style="{ display:'inline-block', width:'6px', height:'6px', borderRadius:'50%', marginRight:'2px', verticalAlign:'middle', background: catColor(ri.keywordCategory) }"></span>{{ ri.keywordCategory }}：<span style="font-weight:600">{{ formatAmount(ri.categoryTotal) }}</span>
                  </span>
                  <span class="ratio-stat">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-right:2px;vertical-align:middle;"></span>{{ ri.keyword }}：<span style="font-weight:600">{{ formatAmount(ri.keywordTotal) }}</span>
                  </span>
                </div>
                <div class="ratio-stats-row">
                  <span class="ratio-stat">總消費佔比：<span style="font-weight:600">{{ ri.ratioOfGrand }}%</span></span>
                  <span v-if="ri.keywordCategory && ri.keywordCategory !== ri.keyword" class="ratio-stat">{{ ri.keywordCategory }}佔比：<span style="font-weight:600">{{ ri.ratioOfCategory }}%</span></span>
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
      <div v-else-if="result.queryType === 'analysis_full'" class="qr-af-summary">
        <!-- Per-keyword ratio blocks：週查詢時隱藏 -->
        <template v-if="result.rangeType !== 'week'">
        <template v-for="fi in (result.fullItems ?? [])" :key="fi.keyword">
          <div v-if="fi.keywordTotal > 0" class="af-block">
            <div class="ratio-block-header">
              <span class="ratio-block-label" style="font-size:16px;font-weight:400">{{ fi.keyword }}佔比</span>
            </div>
            <div class="ratio-bar-wrap">
              <div class="ratio-bar-base"></div>
              <div
                v-if="fi.keywordCategory && fi.keywordCategory !== fi.keyword"
                class="ratio-bar-mid"
                :style="{
                  width: Math.min(fi.grandTotal > 0 ? (fi.categoryTotal / fi.grandTotal) * 100 : 0, 100) + '%',
                  background: catColor(fi.keywordCategory)
                }"
              ></div>
              <div class="ratio-bar-front" :style="{ width: Math.min(fi.ratioOfGrand, 100) + '%' }"></div>
            </div>
            <div class="ratio-stats-row">
              <span class="ratio-stat">總消費：<span style="font-weight:600;color:var(--text)">{{ formatAmount(fi.grandTotal) }}</span></span>
              <span v-if="fi.keywordCategory && fi.keywordCategory !== fi.keyword" class="ratio-stat">
                <span :style="{ display:'inline-block', width:'6px', height:'6px', borderRadius:'50%', marginRight:'2px', verticalAlign:'middle', background: catColor(fi.keywordCategory) }"></span>{{ fi.keywordCategory }}：<span style="font-weight:600;color:var(--text)">{{ formatAmount(fi.categoryTotal) }}</span>
              </span>
              <span class="ratio-stat">
                <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-right:2px;vertical-align:middle;"></span>{{ fi.keyword }}：<span style="font-weight:600;color:var(--text)">{{ formatAmount(fi.keywordTotal) }}</span>
              </span>
            </div>
            <div class="ratio-stats-row">
              <span class="ratio-stat">總消費佔比：<span style="font-weight:600;color:var(--text)">{{ fi.ratioOfGrand }}%</span></span>
              <span v-if="fi.keywordCategory && fi.keywordCategory !== fi.keyword" class="ratio-stat">{{ fi.keywordCategory }}佔比：<span style="font-weight:600;color:var(--text)">{{ fi.ratioOfCategory }}%</span></span>
            </div>
          </div>
          <div v-else class="ratio-no-data">{{ fi.keyword }}：本期無此消費</div>
          <hr class="af-divider">
        </template>
        </template><!-- end v-if rangeType !== week -->
        <!-- Combined trend + compare section -->
        <div v-if="(result.fullItems ?? []).some(fi => (fi.trendData?.length ?? 0) > 0)" class="af-block">
          <div class="af-label" :class="{ 'af-label-accent': result.rangeType === 'week' }">
            {{ result.rangeType === 'week' ? (result.currentLabel ?? '本週') + '支出趨勢' : '支出趨勢' }}
          </div>
          <!-- Legend: only for multi-keyword -->
          <div v-if="(result.fullItems ?? []).filter(fi => fi.keywordTotal > 0).length > 1" class="af-legend">
            <div v-for="fi in (result.fullItems ?? []).filter(fi => fi.keywordTotal > 0)" :key="fi.keyword" class="af-legend-item">
              <span class="af-legend-dot" :style="{ background: afChartColor(fi) }"></span>
              <span>{{ fi.keyword }}</span>
            </div>
          </div>
          <!-- SVG trend chart -->
          <svg :viewBox="`0 0 ${AF_SVG_W} ${AF_SVG_H}`" class="af-trend-svg">
            <line v-for="g in afYGrid" :key="g.chartY" :x1="AF_SVG_L" :y1="g.chartY" :x2="AF_SVG_W - AF_SVG_R" :y2="g.chartY" stroke="rgba(0,0,0,0.07)" stroke-width="0.8" />
            <text v-for="g in afYGrid" :key="'y'+g.chartY" x="0" :y="g.chartY + 3" text-anchor="start" font-size="8" fill="var(--text-soft)">{{ g.label }}</text>
            <template v-for="fi in (result.fullItems ?? []).filter(fi => (fi.trendData?.length ?? 0) > 0)" :key="fi.keyword">
              <polygon :points="afAreaStr(fi.trendData ?? [])" :style="{ fill: afChartColor(fi) }" opacity="0.12" />
              <polyline :points="afLineStr(fi.trendData ?? [])" fill="none" :style="{ stroke: afChartColor(fi) }" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              <circle v-for="(pt, pIdx) in afGetPoints(fi.trendData ?? [])" :key="pIdx" :cx="pt.x" :cy="pt.y" r="2.5" :style="{ fill: afChartColor(fi) }" />
            </template>
            <text v-for="(label, lIdx) in afXLabels" :key="'x'+lIdx" :x="AF_SVG_L + (afXLabels.length > 1 ? (lIdx / (afXLabels.length - 1)) * AF_SVG_CW : AF_SVG_CW / 2)" :y="AF_SVG_H - 3" text-anchor="middle" font-size="8" fill="var(--text-soft)">{{ label }}</text>
          </svg>
          <hr class="af-divider" style="margin: 4px 0">
          <div class="af-label">與{{ result.previousLabel ?? '上期' }}比較</div>
          <!-- Compare text per keyword -->
          <div v-for="fi in (result.fullItems ?? []).filter(fi => fi.keywordTotal > 0)" :key="'cmp'+fi.keyword" class="af-compare-text-row">
            <span v-if="(result.fullItems ?? []).filter(fi => fi.keywordTotal > 0).length > 1" class="af-compare-text-kw">{{ fi.keyword }}</span>
            <span class="af-compare-text-label">
              <template v-if="result.rangeType === 'week'">{{ result.previousLabel ?? '上期' }}：-{{ formatAmount(fi.compareTotal) }}</template>
              <template v-else>與{{ result.previousLabel ?? '上期' }}相比</template>
            </span>
            <span :class="['af-compare-text-diff', (fi.compareChange ?? 0) >= 0 ? 'change-up' : 'change-down']">
              {{ (fi.compareChange ?? 0) >= 0 ? '▲' : '▼' }} {{ formatAmount(Math.abs(fi.compareChange ?? 0)) }}
            </span>
          </div>
        </div>
        <hr class="af-divider">
      </div>
      <div v-else-if="result.queryType === 'analysis_peak'" class="qr-peak-summary">
        <div class="peak-sum-row">
          <span class="peak-sum-label">當月最高消費項目</span>
          <span class="peak-sum-value">{{ peakTopItem ? peakTopItem.name + '　-' + formatAmount(peakTopItem.amount) : '—' }}</span>
        </div>
        <div class="peak-sum-row">
          <span class="peak-sum-label">當月最高消費類別</span>
          <span class="peak-sum-value">{{ peakTopCategory ? peakTopCategory.cat + '　-' + formatAmount(peakTopCategory.total) : '—' }}</span>
        </div>
        <div class="peak-sum-row">
          <span class="peak-sum-label">當月最高消費日</span>
          <span class="peak-sum-value">{{ result.analysisPeakDay ? result.analysisPeakDay.date.replace(/^\d{4}-/, '').replace('-', '/') + '　-' + formatAmount(result.analysisPeakDay.total) : '—' }}</span>
        </div>
      </div>
      <div v-else class="qr-topn-summary">
        <div v-if="result.topItems?.length" class="topn-summary-line">
          <template v-if="isTopN1">最高消費項目：</template>
          <template v-else>前{{ nToChinese(result.n) }}筆最高消費：</template>
          <span
            v-for="item in result.topItems"
            :key="item.id"
            class="topn-summary-kw"
          >{{ item.name }}</span>
        </div>
        <div v-if="result.topCategories?.length" class="topn-summary-line">
          <template v-if="isTopN1">最高消費分類：</template>
          <template v-else>前{{ nToChinese(result.n) }}高消費分類：</template>
          <span
            v-for="cat in result.topCategories"
            :key="cat.cat"
            class="topn-summary-kw"
          >{{ cat.cat }}</span>
        </div>
      </div>

      <!-- analysis_compare: previous period trend chart (outside v-else-if chain) -->
      <div v-if="result.queryType === 'analysis_compare' && (result.compareTrendData?.length ?? 0) > 0" class="qr-compare-trend">
        <div class="af-label">{{ (result.currentLabel ?? '本期') + '支出趨勢' }}</div>
        <svg :viewBox="`0 0 ${AF_SVG_W} ${AF_SVG_H}`" class="af-trend-svg">
          <line v-for="g in cmpTrendYGrid" :key="g.chartY" :x1="AF_SVG_L" :y1="g.chartY" :x2="AF_SVG_W - AF_SVG_R" :y2="g.chartY" stroke="rgba(0,0,0,0.07)" stroke-width="0.8" />
          <text v-for="g in cmpTrendYGrid" :key="'y'+g.chartY" x="0" :y="g.chartY + 3" text-anchor="start" font-size="8" fill="var(--text-soft)">{{ g.label }}</text>
          <polygon :points="cmpTrendArea()" style="fill:#E07A4F" opacity="0.12" />
          <polyline :points="cmpTrendLine()" fill="none" style="stroke:#E07A4F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <circle v-for="(pt, pIdx) in cmpTrendPts()" :key="pIdx" :cx="pt.x" :cy="pt.y" r="2.5" style="fill:#E07A4F" />
          <text v-for="(d, lIdx) in (result.compareTrendData ?? [])" :key="'x'+lIdx" :x="AF_SVG_L + (lIdx / ((result.compareTrendData?.length ?? 1) - 1)) * AF_SVG_CW" :y="AF_SVG_H - 3" text-anchor="middle" font-size="8" fill="var(--text-soft)">{{ d.label }}</text>
        </svg>
      </div>

      <!-- Content -->
      <div class="qr-body">
      <!-- total / list: item list -->
      <template v-if="result.queryType === 'total' || result.queryType === 'list'">
        <div class="item-card">
          <div v-for="item in result.items" :key="item.id" class="item-row">
            <div class="item-icon" :style="{ background: catColor(item.category) }">
              <CatIcon :category="item.category" :size="14" :stroke-width="1.8" />
            </div>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-cat">{{ item.category }}</span>
            </div>
            <span class="item-date">{{ formatDateShort(item.created_at) }}</span>
            <span class="item-amount">-{{ formatAmount(item.amount) }}</span>
          </div>
          <div v-if="result.items.length === 0" class="item-empty">此期間無紀錄</div>
        </div>
      </template>

      <!-- ranking: category list with percentage -->
      <template v-else-if="result.queryType === 'ranking'">
        <div class="item-card">
          <div v-for="r in rankingData" :key="r.cat" class="rank-row">
            <div class="item-icon" :style="{ background: catColor(r.cat) }">
              <CatIcon :category="r.cat" :size="14" :stroke-width="1.8" />
            </div>
            <span class="rank-name">{{ r.cat }}</span>
            <span class="rank-pct">{{ r.pct }}%</span>
            <span class="rank-amount">{{ formatAmount(r.amount) }}</span>
          </div>
          <div v-if="rankingData.length === 0" class="item-empty">此期間無紀錄</div>
        </div>
      </template>

      <!-- grouped: per-keyword sections -->
      <template v-else-if="result.queryType === 'grouped'">
        <div
          v-for="(g, gi) in result.groups.filter(g => g.items.length > 0)"
          :key="g.label"
          class="item-card"
          :class="{ 'group-gap': gi > 0 }"
        >
          <div class="group-header">
            <span class="group-label">{{ groupDisplayLabel(g) }}</span>
            <span class="group-total">-{{ formatAmount(g.total) }}</span>
          </div>
          <div class="group-divider" />
          <div v-for="item in g.items" :key="item.id" class="item-row">
            <div class="item-icon" :style="{ background: catColor(item.category) }">
              <CatIcon :category="item.category" :size="14" :stroke-width="1.8" />
            </div>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-cat">{{ item.category }}</span>
            </div>
            <span class="item-date">{{ formatDateShort(item.created_at) }}</span>
            <span class="item-amount">-{{ formatAmount(item.amount) }}</span>
          </div>
          <div v-if="g.items.length === 0" class="item-empty">無符合紀錄</div>
        </div>
        <div v-if="result.groups.every(g => g.items.length === 0)" class="item-card">
          <div class="item-empty">此期間無紀錄</div>
        </div>
      </template>

      <!-- top_n: top items + top categories -->
      <template v-else-if="result.queryType === 'top_n'">
        <div class="item-card">
          <div class="topn-section-header">
            <span class="topn-section-label">消費項目</span>
            <span class="topn-section-total">-{{ formatAmount(topItemsTotal) }}</span>
          </div>
          <div class="topn-title-divider" />
          <div v-for="item in result.topItems" :key="item.id" class="topn-item-row">
            <div class="item-icon" :style="{ background: catColor(item.category) }">
              <CatIcon :category="item.category" :size="14" :stroke-width="1.8" />
            </div>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-cat">{{ item.category }}</span>
            </div>
            <span class="topn-item-date">{{ formatDateShort(item.created_at) }}</span>
            <span class="item-amount">-{{ formatAmount(item.amount) }}</span>
          </div>
          <div v-if="!result.topItems?.length" class="item-empty">此期間無紀錄</div>
        </div>
        <div v-if="showTopCatSection" class="item-card topn-cat-card">
          <div class="topn-section-header">
            <span class="topn-section-label">{{ topCatSectionLabel }}</span>
            <span class="topn-section-total">-{{ formatAmount(topCategoriesTotal) }}</span>
          </div>
          <div class="topn-title-divider" />
          <!-- n=1: show all items in top category -->
          <template v-if="isTopN1 && result.topCategoryItems?.length">
            <div v-for="item in result.topCategoryItems" :key="item.id" class="topn-item-row">
              <div class="item-icon" :style="{ background: catColor(item.category) }">
                <CatIcon :category="item.category" :size="14" :stroke-width="1.8" />
              </div>
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-cat">{{ item.category }}</span>
              </div>
              <span class="topn-item-date">{{ formatDateShort(item.created_at) }}</span>
              <span class="item-amount">-{{ formatAmount(item.amount) }}</span>
            </div>
          </template>
          <!-- n>1: show category totals ranking -->
          <template v-else>
            <div v-for="cat in result.topCategories" :key="cat.cat" class="topn-cat-row">
              <div class="item-icon" :style="{ background: catColor(cat.cat) }">
                <CatIcon :category="cat.cat" :size="14" :stroke-width="1.8" />
              </div>
              <span class="rank-name">{{ cat.cat }}</span>
              <span class="topn-cat-amount">{{ formatAmount(cat.total) }}</span>
            </div>
          </template>
        </div>
      </template>

      <!-- analysis_ratio: keyword item detail list -->
      <template v-else-if="result.queryType === 'analysis_ratio'">
        <div
          v-for="(ri, idx) in (result.ratioItems ?? [])"
          :key="ri.keyword"
          class="item-card"
          :class="{ 'ratio-list-gap': idx > 0 }"
        >
          <div class="group-header">
            <span class="group-label">{{ ri.keyword }}</span>
            <span class="group-total">{{ ri.keywordTotal > 0 ? '-' + formatAmount(ri.keywordTotal) : '—' }}</span>
          </div>
          <div class="group-divider" />
          <div v-for="item in ri.items" :key="item.id" class="item-row">
            <div class="item-icon" :style="{ background: catColor(item.category) }">
              <CatIcon :category="item.category" :size="14" :stroke-width="1.8" />
            </div>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-cat">{{ item.category }}</span>
            </div>
            <span class="item-date">{{ formatDateShort(item.created_at) }}</span>
            <span class="item-amount">-{{ formatAmount(item.amount) }}</span>
          </div>
          <div v-if="ri.items.length === 0" class="item-empty">本期無此消費</div>
        </div>
      </template>

      <!-- analysis_full: item list per keyword -->
      <template v-else-if="result.queryType === 'analysis_full'">
        <div
          v-for="(fi, fIdx) in (result.fullItems ?? [])"
          :key="fi.keyword"
          class="item-card"
          :class="{ 'group-gap': fIdx > 0 }"
        >
          <div class="group-header">
            <span class="group-label">{{ fi.keyword }}</span>
            <span class="group-total">{{ fi.keywordTotal > 0 ? '-' + formatAmount(fi.keywordTotal) : '—' }}</span>
          </div>
          <div class="group-divider" />
          <div v-for="item in fi.items" :key="item.id" class="item-row">
            <div class="item-icon" :style="{ background: catColor(item.category) }">
              <CatIcon :category="item.category" :size="14" :stroke-width="1.8" />
            </div>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-cat">{{ item.category }}</span>
            </div>
            <span class="item-date">{{ formatDateShort(item.created_at) }}</span>
            <span class="item-amount">-{{ formatAmount(item.amount) }}</span>
          </div>
          <div v-if="fi.items.length === 0" class="item-empty">本期無此消費</div>
        </div>
        <div v-if="!result.fullItems?.length" class="item-card">
          <div class="item-empty">此期間無紀錄</div>
        </div>
      </template>

      <!-- analysis_trend: weekly bar chart + list -->
      <template v-else-if="result.queryType === 'analysis_trend'">
        <div class="item-card chart-card">
          <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="monthly-svg">
            <line v-for="g in trendYGrid" :key="g.chartY" :x1="SVG_L" :y1="g.chartY" :x2="SVG_W - SVG_R" :y2="g.chartY" stroke="rgba(0,0,0,0.07)" stroke-width="0.8" />
            <text v-for="g in trendYGrid" :key="'y'+g.chartY" x="0" :y="g.chartY + 3" text-anchor="start" font-size="8" fill="#B0A090">{{ g.label }}</text>
            <rect v-for="(b, i) in trendBars" :key="i" :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="2" :fill="b.h > 0 ? '#E07A4F' : 'transparent'" opacity="0.85" />
            <text v-for="(b, i) in trendBars" :key="'x'+i" :x="b.x + b.w / 2" :y="SVG_H - 3" text-anchor="middle" font-size="7" fill="#B0A090">{{ b.label }}</text>
          </svg>
        </div>
        <div class="item-card" style="margin-top:10px">
          <div v-for="(week, wi) in (result.analysisWeeks ?? [])" :key="week.from" class="analysis-week-row" :class="{ 'border-top-row': wi > 0 }">
            <span class="analysis-week-label">{{ week.from.slice(5).replace('-', '/') }} 週</span>
            <span class="analysis-week-total">-{{ formatAmount(week.total) }}</span>
          </div>
          <div v-if="!result.analysisWeeks?.length" class="item-empty">此期間無紀錄</div>
        </div>
      </template>

      <!-- analysis_compare / analysis_category_change: category changes -->
      <template v-else-if="result.queryType === 'analysis_compare' || result.queryType === 'analysis_category_change'">
        <div class="item-card">
          <div class="cat-change-header">
            <span />
            <span class="cat-change-header-label">{{ result.previousLabel ?? '上期' }}</span>
            <span />
            <span class="cat-change-header-label">{{ result.currentLabel ?? '本期' }}</span>
          </div>
          <div class="topn-title-divider" />
          <div v-for="(c, ci) in (result.analysisCategoryChanges ?? [])" :key="c.cat" class="cat-change-row" :class="{ 'border-top-row': ci > 0 }">
            <div class="item-icon" :style="{ background: catColor(c.cat) }">
              <CatIcon :category="c.cat" :size="14" :stroke-width="1.8" />
            </div>
            <span class="cat-change-name">{{ c.cat }}</span>
            <span class="cat-change-prev">{{ formatAmount(c.prev) }}</span>
            <span :class="['cat-change-indicator', c.diff > 0 ? 'change-up' : c.diff < 0 ? 'change-down' : 'change-same']">
              {{ c.diff > 0 ? '↑' : c.diff < 0 ? '↓' : '—' }}
            </span>
            <span class="cat-change-curr">{{ formatAmount(c.current) }}</span>
          </div>
          <div v-if="!result.analysisCategoryChanges?.length" class="item-empty">此期間無紀錄</div>
        </div>
      </template>

      <!-- analysis_peak: peak/valley day + daily bar chart -->
      <template v-else-if="result.queryType === 'analysis_peak'">
        <div class="item-card">
          <div v-if="result.analysisPeakDay" class="peak-row">
            <div class="peak-badge peak-badge-high">高峰</div>
            <span class="peak-date">{{ result.analysisPeakDay.date.replace(/-/g, '/') }}</span>
            <span class="peak-amount">-{{ formatAmount(result.analysisPeakDay.total) }}</span>
          </div>
          <div v-if="result.analysisValleyDay" class="peak-row border-top-row">
            <div class="peak-badge peak-badge-low">低谷</div>
            <span class="peak-date">{{ result.analysisValleyDay.date.replace(/-/g, '/') }}</span>
            <span class="peak-amount">-{{ formatAmount(result.analysisValleyDay.total) }}</span>
          </div>
          <div v-if="!result.analysisPeakDay" class="item-empty">此期間無紀錄</div>
        </div>
        <div class="item-card chart-card" style="margin-top:10px">
          <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="monthly-svg">
            <line v-for="g in peakYGrid" :key="g.chartY" :x1="SVG_L" :y1="g.chartY" :x2="SVG_W - SVG_R" :y2="g.chartY" stroke="rgba(0,0,0,0.07)" stroke-width="0.8" />
            <text v-for="g in peakYGrid" :key="'y'+g.chartY" x="0" :y="g.chartY + 3" text-anchor="start" font-size="8" fill="#B0A090">{{ g.label }}</text>
            <rect v-for="(b, i) in peakDayBars" :key="i" :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="2" :fill="b.isPeak ? '#E07A4F' : (b.isValley ? '#90C8A0' : 'rgba(224,122,79,0.35)')" />
            <text v-for="(b, i) in peakDayBars" v-show="b.label" :key="'x'+i" :x="b.x + b.w / 2" :y="SVG_H - 3" text-anchor="middle" font-size="7" fill="#B0A090">{{ b.label }}</text>
          </svg>
        </div>
      </template>

      <!-- monthly: vertical bar chart (SVG) -->
      <template v-else-if="result.queryType === 'monthly'">
        <div class="item-card chart-card">
          <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="monthly-svg">
            <!-- Grid lines + Y labels -->
            <line
              v-for="g in yGrid"
              :key="g.chartY"
              :x1="SVG_L"
              :y1="g.chartY"
              :x2="SVG_W - SVG_R"
              :y2="g.chartY"
              stroke="rgba(0,0,0,0.07)"
              stroke-width="0.8"
            />
            <text
              v-for="g in yGrid"
              :key="'y' + g.chartY"
              x="0"
              :y="g.chartY + 3"
              text-anchor="start"
              font-size="8"
              fill="#B0A090"
            >{{ g.label }}</text>
            <!-- Bars -->
            <rect
              v-for="(b, i) in monthlyBars"
              :key="i"
              :x="b.x"
              :y="b.y"
              :width="b.w"
              :height="b.h"
              rx="2"
              :fill="b.h > 0 ? '#E07A4F' : 'transparent'"
              opacity="0.85"
            />
            <!-- X labels -->
            <text
              v-for="(b, i) in monthlyBars"
              :key="'x' + i"
              :x="b.x + b.w / 2"
              :y="SVG_H - 3"
              text-anchor="middle"
              font-size="7"
              fill="#B0A090"
            >{{ b.label }}</text>
          </svg>
        </div>
      </template>
    </div>
      </div><!-- end qr-scroll -->
    </template><!-- end v-else result -->

    <!-- Bottom input bar -->
    <div class="qr-input-wrap">
      <ListeningIndicator :visible="isListening" :transcript="interimTranscript" />
      <div v-if="quotaRemaining !== null" class="quota-remaining-hint">還剩 {{ quotaRemaining }} 次使用額度</div>
      <div class="qr-input-row">
        <button class="qr-back-btn" @click="navigateTo('/')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div class="qr-input-bar">
        <input
          ref="inputRef"
          v-model="inputValue"
          class="qr-input"
          maxlength="200"
          :placeholder="isLoading ? 'AI 分析中...' : '繼續查詢...'"
          :disabled="isLoading"
          enterkeyhint="done"
          @keydown.enter="handleSubmit"
        >
        <button class="qr-add-btn" :disabled="!inputValue.trim() || isLoading" @click="handleSubmit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div class="qr-icons">
          <button class="qr-icon-btn" :class="{ active: isListening }" :disabled="isLoading" @click="toggleVoice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </svg>
          </button>
        </div>
        </div>
      </div>
      <div v-if="errorMsg" class="qr-error">{{ errorMsg }}</div>
    </div>
    <QuotaModal v-if="quotaModalReason" :reason="quotaModalReason" @close="quotaModalReason = null" />
  </div>
</template>

<script setup lang="ts">
import { getGuestExpenses } from '~/composables/useGuestExpenses'

definePageMeta({ layout: 'bare' })

// ── State ─────────────────────────────────────────────────────────────────────
interface GroupEntry {
  label: string
  total: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
}

interface QueryResult {
  title: string
  queryType: 'total' | 'list' | 'ranking' | 'monthly' | 'grouped' | 'top_n'
    | 'analysis_trend' | 'analysis_compare' | 'analysis_peak' | 'analysis_category_change' | 'analysis_ratio' | 'analysis_full'
  total: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
  groups: GroupEntry[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topItems?: any[]
  topCategories?: { cat: string; total: number }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topCategoryItems?: any[]
  n?: number
  dateFrom: string
  dateTo: string
  compareFrom?: string
  compareTo?: string
  currentLabel?: string
  previousLabel?: string
  compareTotal?: number
  analysisWeeks?: { label: string; total: number; from: string; to: string }[]
  analysisDays?: { date: string; total: number }[]
  analysisPeakDay?: { date: string; total: number } | null
  analysisValleyDay?: { date: string; total: number } | null
  analysisCategoryChanges?: { cat: string; current: number; prev: number; diff: number }[]
  keyword?: string
  keywordTotal?: number
  keywordCategory?: string
  categoryTotal?: number
  grandTotal?: number
  ratioOfGrand?: number
  ratioOfCategory?: number
  ratioItems?: {
    keyword: string
    keywordTotal: number
    keywordCategory: string
    categoryTotal: number
    grandTotal: number
    ratioOfGrand: number
    ratioOfCategory: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[]
  }[]
  fullItems?: {
    keyword: string
    keywordTotal: number
    keywordCategory: string
    categoryTotal: number
    grandTotal: number
    ratioOfGrand: number
    ratioOfCategory: number
    compareTotal: number
    trendData?: { label: string; value: number }[]
    compareChange?: number
    compareTrend?: 'up' | 'down' | 'same'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[]
  }[]
  rangeType?: 'week' | 'month' | 'year'
  compareTrendData?: { label: string; value: number }[]
}

const result = useState<QueryResult>('queryResult', () => ({
  title: '',
  queryType: 'total',
  total: 0,
  items: [],
  groups: [],
  dateFrom: '',
  dateTo: '',
}))

const hasResult = computed(() => result.value.dateFrom !== '')

const inputValue = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const { isListening, interimTranscript, stopVoice, toggleVoice } = useVoiceInput({
  onFinal: (text) => { inputValue.value = text },
  onInterim: (text) => { inputValue.value = text },
})

// ── Formatters ────────────────────────────────────────────────────────────────
function formatAmount(n: number) { return n.toLocaleString('zh-TW') }

function formatDate(d: string) {
  return d ? d.replace(/-/g, '/') : ''
}

function formatDateShort(d: string) {
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function nToChinese(n: number | undefined): string {
  const map: Record<number, string> = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九', 10: '十' }
  return map[n ?? 3] ?? String(n ?? 3)
}

const formattedRange = computed(() =>
  `${formatDate(result.value.dateFrom)} ～ ${formatDate(result.value.dateTo)}`,
)

// ── Query ─────────────────────────────────────────────────────────────────────
import { catColor as catColorBuiltin } from '~/constants/categories'
const user = useSupabaseUser()
const { categories, getCatColor, load: loadCategories } = useUserCategories()
const catColor = (name: string) => getCatColor(name) ?? catColorBuiltin(name)
const { checkQuota, incrementQuota } = useQuota()
const quotaModalReason = ref<'quota' | 'expired' | null>(null)
const quotaRemaining = ref<number | null>(null)

const refreshRemaining = async () => {
  const q = await checkQuota()
  quotaRemaining.value = (q.remaining !== null && q.remaining <= 3) ? q.remaining : null
}

const handleSubmit = async () => {
  const q = inputValue.value.trim()
  if (!q || isLoading.value) return
  stopVoice()

  const quota = await checkQuota()
  if (!quota.allowed) {
    quotaModalReason.value = quota.reason
    return
  }

  inputValue.value = ''
  isLoading.value = true
  errorMsg.value = ''

  try {
    const body: Record<string, unknown> = {
      question: q,
      userCategories: categories.value.map(c => c.name),
    }
    if (!user.value) body.guestExpenses = getGuestExpenses()
    const data = await $fetch<QueryResult>('/api/query-expenses', {
      method: 'POST',
      body,
    })
    result.value = data
    await incrementQuota()
    await refreshRemaining()
  }
  catch (e: unknown) {
    const apiMsg = (e as { data?: { message?: string } })?.data?.message
    errorMsg.value = apiMsg === 'off_topic'
      ? '請輸入消費相關查詢，例如：本月餐費多少'
      : (apiMsg ?? '查詢失敗，請再試一次')
    setTimeout(() => { errorMsg.value = '' }, 4000)
  }
  finally {
    isLoading.value = false
  }
}

// grouped 分組標題：優先顯示紀錄的實際 category 名稱
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupDisplayLabel(g: GroupEntry): string {
  if (g.items.length === 0) return g.label
  const cats = [...new Set(g.items.map((item: any) => item.category as string))]
  return cats.length === 1 ? cats[0] : g.label
}

onMounted(async () => {
  await loadCategories()
  await refreshRemaining()
})

// ── Top N ──────────────────────────────────────────────────────────────────────
const topItemsTotal = computed(() =>
  (result.value.topItems ?? []).reduce((s: number, i: { amount: number }) => s + i.amount, 0),
)
const topCategoriesTotal = computed(() =>
  (result.value.topCategories ?? []).reduce((s: number, c: { total: number }) => s + c.total, 0),
)

const showTopCatSection = computed(() => {
  const items = result.value.topItems ?? []
  const cats = result.value.topCategories ?? []
  if (!cats.length) return false
  if (items.length === 1 && cats.length === 1 && items[0].category === cats[0].cat) return false
  return true
})

const isTopN1 = computed(() => (result.value.n ?? 3) === 1)
const topCatSectionLabel = computed(() =>
  isTopN1.value && result.value.topCategories?.[0]
    ? result.value.topCategories[0].cat
    : '分類項目',
)

// ── Analysis ───────────────────────────────────────────────────────────────────
const compareDiff = computed(() => result.value.total - (result.value.compareTotal ?? 0))
const afCompareDiff = computed(() => result.value.total - (result.value.compareTotal ?? 0))

function afChartColor(fi: { keywordCategory: string; keyword: string }): string {
  return result.value.rangeType === 'week' ? 'var(--accent)' : catColor(fi.keywordCategory || fi.keyword)
}

// ── Analysis Peak summary ───────────────────────────────────────────────────────
const peakTopItem = computed(() => {
  const items = result.value.items ?? []
  if (!items.length) return null
  return items.reduce((a: any, b: any) => b.amount > a.amount ? b : a)
})
const peakTopCategory = computed(() => {
  const items = result.value.items ?? []
  if (!items.length) return null
  const totals: Record<string, number> = {}
  for (const r of items) totals[r.category] = (totals[r.category] ?? 0) + r.amount
  const [cat, total] = Object.entries(totals).reduce((a, b) => b[1] > a[1] ? b : a)
  return { cat, total }
})

// ── Analysis Full trend chart ───────────────────────────────────────────────────
const AF_SVG_W = 300
const AF_SVG_H = 120
const AF_SVG_L = 30
const AF_SVG_R = 6
const AF_SVG_T = 10
const AF_SVG_B = 22
const AF_SVG_CW = AF_SVG_W - AF_SVG_L - AF_SVG_R
const AF_SVG_CH = AF_SVG_H - AF_SVG_T - AF_SVG_B

const afNiceMax = computed(() => {
  const allVals = (result.value.fullItems ?? []).flatMap(fi => (fi.trendData ?? []).map(d => d.value))
  const max = Math.max(...allVals, 1)
  if (max < 1000) return Math.ceil(max / 200) * 200
  if (max < 10000) return Math.ceil(max / 1000) * 1000
  return Math.ceil(max / 10000) * 10000
})

const afYGrid = computed(() => {
  const max = afNiceMax.value
  return [0, 1, 2, 3, 4].map((i) => {
    const ratio = i / 4
    const val = Math.round(max * (1 - ratio))
    const chartY = AF_SVG_T + ratio * AF_SVG_CH
    return { chartY, label: formatYLabel(val) }
  })
})

const afXLabels = computed(() =>
  result.value.fullItems?.[0]?.trendData?.map(d => d.label) ?? [],
)

function afGetPoints(trendData: { label: string; value: number }[]) {
  const n = trendData.length
  const max = afNiceMax.value
  return trendData.map((d, i) => ({
    x: AF_SVG_L + (n > 1 ? (i / (n - 1)) * AF_SVG_CW : AF_SVG_CW / 2),
    y: AF_SVG_T + (max > 0 ? (1 - d.value / max) : 1) * AF_SVG_CH,
  }))
}

function afLineStr(trendData: { label: string; value: number }[]) {
  return afGetPoints(trendData).map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

function afAreaStr(trendData: { label: string; value: number }[]) {
  const pts = afGetPoints(trendData)
  if (pts.length === 0) return ''
  const bottom = AF_SVG_T + AF_SVG_CH
  const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return `${pts[0].x.toFixed(1)},${bottom} ${line} ${pts[pts.length - 1].x.toFixed(1)},${bottom}`
}

// ── Compare trend chart (analysis_compare, weekly) ─────────────────────────────
const cmpTrendNiceMax = computed(() => {
  const max = Math.max(...(result.value.compareTrendData ?? []).map(d => d.value), 1)
  if (max < 1000) return Math.ceil(max / 200) * 200
  if (max < 10000) return Math.ceil(max / 1000) * 1000
  return Math.ceil(max / 10000) * 10000
})

const cmpTrendYGrid = computed(() => {
  const max = cmpTrendNiceMax.value
  return [0, 1, 2, 3, 4].map((i) => {
    const ratio = i / 4
    const val = Math.round(max * (1 - ratio))
    const chartY = AF_SVG_T + ratio * AF_SVG_CH
    return { chartY, label: formatYLabel(val) }
  })
})

function cmpTrendPts() {
  const data = result.value.compareTrendData ?? []
  const n = data.length
  const max = cmpTrendNiceMax.value
  return data.map((d, i) => ({
    x: AF_SVG_L + (n > 1 ? (i / (n - 1)) * AF_SVG_CW : AF_SVG_CW / 2),
    y: AF_SVG_T + (max > 0 ? (1 - d.value / max) : 1) * AF_SVG_CH,
  }))
}

function cmpTrendLine() {
  return cmpTrendPts().map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

function cmpTrendArea() {
  const pts = cmpTrendPts()
  if (pts.length === 0) return ''
  const bottom = AF_SVG_T + AF_SVG_CH
  const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return `${pts[0].x.toFixed(1)},${bottom} ${line} ${pts[pts.length - 1].x.toFixed(1)},${bottom}`
}

// Trend chart
const trendNiceMax = computed(() => {
  const max = Math.max(...(result.value.analysisWeeks ?? []).map(w => w.total), 1)
  if (max < 1000) return Math.ceil(max / 200) * 200
  if (max < 10000) return Math.ceil(max / 1000) * 1000
  return Math.ceil(max / 10000) * 10000
})
const trendYGrid = computed(() => {
  const max = trendNiceMax.value
  return [0, 1, 2, 3, 4].map((i) => {
    const ratio = i / 4
    const val = Math.round(max * (1 - ratio))
    const chartY = SVG_T + ratio * SVG_CH
    return { chartY, label: formatYLabel(val) }
  })
})
const trendBars = computed(() => {
  const data = result.value.analysisWeeks ?? []
  const n = data.length
  if (n === 0) return []
  const max = trendNiceMax.value
  const chartW = SVG_W - SVG_L - SVG_R
  const barW = Math.min((chartW / n) * 0.6, 28)
  const gap = chartW / n
  return data.map((w, i) => {
    const barH = max > 0 ? (w.total / max) * SVG_CH : 0
    const x = SVG_L + gap * i + (gap - barW) / 2
    const y = SVG_T + SVG_CH - barH
    return { x, y, w: barW, h: barH, label: w.label.replace('-', '/') }
  })
})

// Peak chart
const peakNiceMax = computed(() => {
  const max = Math.max(...(result.value.analysisDays ?? []).map(d => d.total), 1)
  if (max < 1000) return Math.ceil(max / 200) * 200
  if (max < 10000) return Math.ceil(max / 1000) * 1000
  return Math.ceil(max / 10000) * 10000
})
const peakYGrid = computed(() => {
  const max = peakNiceMax.value
  return [0, 1, 2, 3, 4].map((i) => {
    const ratio = i / 4
    const val = Math.round(max * (1 - ratio))
    const chartY = SVG_T + ratio * SVG_CH
    return { chartY, label: formatYLabel(val) }
  })
})
const peakDayBars = computed(() => {
  const data = result.value.analysisDays ?? []
  const n = data.length
  if (n === 0) return []
  const peakDate = result.value.analysisPeakDay?.date ?? ''
  const valleyDate = result.value.analysisValleyDay?.date ?? ''
  const max = peakNiceMax.value
  const chartW = SVG_W - SVG_L - SVG_R
  const barW = Math.min((chartW / n) * 0.8, 16)
  const gap = chartW / n
  return data.map((d, i) => {
    const barH = max > 0 ? (d.total / max) * SVG_CH : 0
    const x = SVG_L + gap * i + (gap - barW) / 2
    const y = SVG_T + SVG_CH - barH
    const isPeak = d.date === peakDate
    const isValley = d.date === valleyDate && valleyDate !== peakDate
    const label = isPeak || isValley ? d.date.slice(8) : ''
    return { x, y, w: barW, h: barH, label, isPeak, isValley }
  })
})

// ── Ranking data ───────────────────────────────────────────────────────────────
const rankingData = computed(() => {
  const totals: Record<string, number> = {}
  for (const r of result.value.items) {
    totals[r.category] = (totals[r.category] ?? 0) + r.amount
  }
  const total = Object.values(totals).reduce((a, b) => a + b, 0) || 1
  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({ cat, amount, pct: Math.round((amount / total) * 100) }))
})

// ── Monthly chart ──────────────────────────────────────────────────────────────
const SVG_W = 300
const SVG_H = 130
const SVG_L = 30
const SVG_R = 6
const SVG_T = 10
const SVG_B = 24
const SVG_CH = SVG_H - SVG_T - SVG_B

const monthlyTotals = computed(() => {
  const map: Record<string, number> = {}
  for (const r of result.value.items) {
    const key = r.created_at.slice(0, 7) // YYYY-MM
    map[key] = (map[key] ?? 0) + r.amount
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
})

const niceMax = computed(() => {
  const max = Math.max(...monthlyTotals.value.map(([, v]) => v), 1)
  if (max < 1000) return Math.ceil(max / 200) * 200
  if (max < 10000) return Math.ceil(max / 1000) * 1000
  if (max < 100000) return Math.ceil(max / 10000) * 10000
  return Math.ceil(max / 50000) * 50000
})

function formatYLabel(n: number) {
  if (n === 0) return '0'
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return `${n}`
}

const yGrid = computed(() => {
  const max = niceMax.value
  return [0, 1, 2, 3, 4].map((i) => {
    const ratio = i / 4
    const val = Math.round(max * (1 - ratio))
    const chartY = SVG_T + ratio * SVG_CH
    return { chartY, label: formatYLabel(val) }
  })
})

const monthlyBars = computed(() => {
  const data = monthlyTotals.value
  const n = data.length
  if (n === 0) return []
  const max = niceMax.value
  const chartW = SVG_W - SVG_L - SVG_R
  const barW = Math.min((chartW / n) * 0.6, 24)
  const gap = chartW / n
  return data.map(([key, val], i) => {
    const barH = max > 0 ? (val / max) * SVG_CH : 0
    const x = SVG_L + gap * i + (gap - barW) / 2
    const y = SVG_T + SVG_CH - barH
    return { x, y, w: barW, h: barH, label: key.slice(2).replace('-', '/') }
  })
})
</script>

<style scoped>
.quota-remaining-hint {
  font-size: 12px;
  color: var(--accent);
  text-align: center;
  padding: 4px 0;
}

.qr-screen {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  position: relative;
  background-color: #fffaf0;
  background-image:
    radial-gradient(at 10% 20%, rgba(255,245,220,0.8) 0px, transparent 50%),
    radial-gradient(at 90% 10%, rgba(255,230,180,0.7) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(255,190,140,0.6) 0px, transparent 60%),
    radial-gradient(at 20% 80%, rgba(255,210,190,0.5) 0px, transparent 50%),
    radial-gradient(at 80% 90%, rgba(255,160,140,0.4) 0px, transparent 50%),
    linear-gradient(135deg, #fffcf5 0%, #ffe4cc 40%, #ffd1b3 70%, #ffc0a0 100%);
}

/* Empty state text */
.empty-header {
  position: relative;
  z-index: 1;
  padding: 52px 24px 0;
  font-size: 16px;
  color: var(--text-soft);
  letter-spacing: 0.05em;
}

.empty-headline {
  position: relative;
  z-index: 1;
  font-family: 'Chivo Mono', monospace;
  font-size: 42px;
  font-weight: 300;
  line-height: 1.6;
  color: var(--text);
  padding: 0 24px;
  margin-top: 48px;
}

.empty-spacer {
  flex: 1;
}

/* Scroll container */
.qr-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Header */
.qr-header {
  flex-shrink: 0;
  padding: 24px 24px 0;
  position: relative;
  z-index: 1;
  background: transparent;
}

.qr-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 22px;
  font-weight: 300;
  color: var(--text);
  margin-bottom: 4px;
}

.qr-title :deep(.title-keyword) {
  color: var(--accent);
  font-weight: 400;
}

.qr-sub {
  font-size: 12px;
  color: var(--text-soft);
  letter-spacing: 0.04em;
}

/* Total */
.qr-total {
  flex-shrink: 0;
  padding: 24px 24px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

/* Top N summary */
.qr-topn-summary {
  flex-shrink: 0;
  padding: 24px 24px 24px;
  position: relative;
  z-index: 1;
}

.qr-total-label {
  font-size: 14px;
  color: var(--text-soft);
}

.qr-total-amount {
  font-family: 'Chivo Mono', monospace;
  font-size: 40px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

/* Body */
.qr-body {
  padding: 0 24px 24px;
  position: relative;
  z-index: 1;
}

/* Card */
.item-card {
  background: var(--surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  padding: 4px 0;
}

.chart-card {
  padding: 12px 8px 8px;
}

/* Item list (total / list) */
.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
}

.item-row + .item-row {
  border-top: 1px solid var(--border);
}

.item-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}


.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item-name {
  font-size: 14px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-cat {
  font-size: 12px;
  color: var(--text-soft);
}

.item-amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}

.item-empty {
  padding: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--text-soft);
}

/* Top N summary */
.topn-summary-line {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-soft);
  line-height: 1.6;
}

.topn-summary-kw {
  color: var(--accent);
  margin-left: 4px;
}

/* Top N cards */
.topn-cat-card {
  margin-top: 10px;
}

.topn-section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 14px 16px 12px;
}

.topn-section-label {
  font-size: 12px;
  color: var(--text-soft);
}

.topn-section-total {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.topn-title-divider {
  height: 1px;
  background: var(--border);
  margin: 0 14px;
}

.topn-item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
}

.topn-item-row + .topn-item-row {
  border-top: 1px solid var(--border);
}

.topn-item-date {
  font-size: 12px;
  color: var(--text-soft);
  flex-shrink: 0;
}

.item-date {
  font-size: 12px;
  color: var(--text-soft);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.topn-cat-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
}

.topn-cat-row + .topn-cat-row {
  border-top: 1px solid var(--border);
}

.topn-cat-amount {
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Ranking rows */
.rank-row {
  display: grid;
  grid-template-columns: 30px 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
}

.rank-row + .rank-row {
  border-top: 1px solid var(--border);
}

.rank-name {
  font-size: 12px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-pct {
  font-size: 12px;
  color: var(--text-soft);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.rank-amount {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-align: right;
}

/* Grouped sections */
.group-gap {
  margin-top: 10px;
}

.group-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 14px 16px 12px;
}

.group-label {
  font-size: 12px;
  color: var(--text-soft);
}

.group-total {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.group-divider {
  height: 1px;
  background: var(--border);
  margin: 0;
}

/* Monthly chart */
.monthly-svg {
  display: block;
  width: 100%;
  height: auto;
}

/* Ratio summary */
.qr-ratio-summary {
  flex-shrink: 0;
  padding: 24px 24px 24px;
  position: relative;
  z-index: 1;
}

.ratio-keyword-gap {
  margin-top: 24px;
}

.ratio-no-data {
  font-size: 12px;
  color: var(--text-soft);
  padding: 4px 0;
}

.ratio-block {
  /* spacing handled by children */
}

.ratio-block-gap {
  margin-top: 16px;
}

.ratio-block-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 4px;
}

.ratio-block-label {
  font-size: 12px;
  color: var(--text-soft);
}

.ratio-block-pct {
  font-size: 16px;
  font-weight: 600;
  color: var(--accent);
}

.ratio-bar-bg {
  background: #E8E0D8;
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
}

.ratio-bar-fill {
  background: var(--accent);
  border-radius: 4px;
  height: 8px;
  transition: width 0.4s ease;
  min-width: 2px;
}

.ratio-bar-wrap {
  position: relative;
  height: 8px;
  border-radius: 99px;
  overflow: hidden;
}

.ratio-bar-base {
  position: absolute;
  inset: 0;
  background: #e0ccba;
  border-radius: 99px;
}

.ratio-bar-mid {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 99px;
  transition: width 0.4s ease;
}

.ratio-bar-front {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 99px;
  background: var(--accent);
  transition: width 0.4s ease;
}

.ratio-stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.ratio-list-gap {
  margin-top: 10px;
}

.ratio-stat {
  font-size: 12px;
  color: var(--text-soft);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Compare summary */
.qr-compare-summary {
  flex-shrink: 0;
  padding: 24px 24px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.compare-sum-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.compare-sum-label {
  font-size: 12px;
  color: var(--text-soft);
}

.compare-sum-amount {
  font-family: 'Chivo Mono', monospace;
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.compare-sum-prev {
  color: var(--text);
}

.compare-sum-vs {
  font-size: 12px;
  color: var(--text-soft);
  flex-shrink: 0;
}

.compare-sum-diff {
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
}

/* Change indicators */
.change-up {
  color: #E05050;
}
.change-down {
  color: #50A070;
}
.change-same {
  color: var(--text-soft);
}

/* border helper */
.border-top-row {
  border-top: 1px solid var(--border);
}

/* Analysis week list */
.analysis-week-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
}

.analysis-week-label {
  font-size: 12px;
  color: var(--text-soft);
}

.analysis-week-total {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

/* Category changes */
.cat-change-header {
  display: grid;
  grid-template-columns: 30px 1fr auto auto auto;
  align-items: center;
  gap: 8px;
  padding: 10px 14px 8px;
}

.cat-change-header-label {
  font-size: 12px;
  color: var(--text-soft);
  text-align: right;
}

.cat-change-row {
  display: grid;
  grid-template-columns: 30px 1fr auto auto auto;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
}

.cat-change-name {
  font-size: 12px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-change-prev {
  font-size: 12px;
  color: var(--text-soft);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.cat-change-indicator {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  flex-shrink: 0;
}

.cat-change-curr {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

/* Peak rows */
.peak-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}

.peak-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.peak-badge-high {
  background: rgba(224, 122, 79, 0.15);
  color: var(--accent);
}

.peak-badge-low {
  background: rgba(80, 160, 112, 0.12);
  color: #50A070;
}

.peak-date {
  flex: 1;
  font-size: 12px;
  color: var(--text);
}

.peak-amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

/* Compare trend chart */
.qr-compare-trend {
  flex-shrink: 0;
  padding: 0 24px 16px;
  position: relative;
  z-index: 1;
}

/* Analysis peak summary */
.qr-peak-summary {
  flex-shrink: 0;
  padding: 16px 24px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.peak-sum-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.peak-sum-label {
  font-size: 12px;
  color: var(--text-soft);
  flex-shrink: 0;
}

.peak-sum-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* Analysis full summary */
.qr-af-summary {
  flex-shrink: 0;
  padding: 16px 24px 16px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.af-divider {
  border: none;
  border-top: 1px solid rgba(196, 168, 130, 0.25);
  margin: 0;
}

.af-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.af-label {
  font-size: 16px;
  font-weight: 400;
  color: var(--text-soft);
  margin-bottom: 2px;
}

.af-label-accent {
  color: var(--accent);
}

.af-amount {
  line-height: 1;
}

.af-compare-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.af-compare-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.af-trend-svg {
  display: block;
  width: 100%;
  height: auto;
  margin: 4px 0 8px;
}

.af-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 6px;
}

.af-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-soft);
}

.af-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.af-compare-text-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
}

.af-compare-text-kw {
  color: var(--accent);
  font-weight: 500;
  flex-shrink: 0;
}

.af-compare-text-label {
  color: var(--text-soft);
  flex: 1;
}

.af-compare-text-diff {
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

/* Bottom input */
.qr-input-wrap {
  flex-shrink: 0;
  padding: 8px 16px calc(24px + env(safe-area-inset-bottom));
  position: relative;
  z-index: 1;
  max-width: 430px;
  width: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.qr-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qr-back-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(224, 122, 79, 0.4);
  background: var(--surface);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.18s;
}

.qr-back-btn:active { transform: scale(0.88); }

.qr-back-btn svg {
  width: 18px;
  height: 18px;
}

.qr-input-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--surface);
  border-radius: var(--radius-pill);
  padding: 4px 4px 4px 20px;
  box-shadow: var(--shadow-card);
}

.qr-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 300;
  color: var(--text);
  outline: none;
}

.qr-input::placeholder {
  color: var(--text-soft);
}

.qr-input:disabled {
  opacity: 0.6;
}

.qr-add-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.18s;
}

.qr-add-btn:active { transform: scale(0.88); }

.qr-add-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.qr-add-btn svg {
  width: 20px;
  height: 20px;
}

.qr-icons {
  display: flex;
  align-items: center;
  border: 1px solid rgba(224, 122, 79, 0.4);
  border-radius: var(--radius-pill);
  padding: 2px;
  flex-shrink: 0;
}

.qr-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.18s;
  flex-shrink: 0;
}

.qr-icon-btn:active { transform: scale(0.88); }

.qr-icon-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.qr-icon-btn.active {
  color: var(--text);
  animation: mic-pulse 1.5s ease infinite;
}

.qr-icon-btn svg {
  width: 20px;
  height: 20px;
}

.qr-error {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: var(--text-error);
}
</style>
