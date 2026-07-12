<script setup lang="ts">
// Visual comparison bars for the landing — the measured numbers as CSS bars,
// no charting dependency. Lower is better on every metric; Continuum is
// highlighted. Numbers match the overview table (bench / bench:mem / size).
interface Row {
  label: string;
  value: number;
  display: string;
  best?: boolean;
}
interface Chart {
  title: string;
  unit: string;
  rows: Row[];
}

const props = withDefaults(defineProps<{ lang?: "en" | "ru" }>(), {
  lang: "en",
});
const ru = props.lang === "ru";

const charts: Chart[] = [
  {
    title: ru
      ? "Размер бандла — счётчик целиком"
      : "Bundle size — full counter app",
    unit: ru ? "кБ gzip · меньше — лучше" : "kB gzip · lower is better",
    rows: [
      {
        label: "Continuum",
        value: 5.6,
        display: ru ? "5.6 кБ" : "5.6 kB",
        best: true,
      },
      { label: "Solid", value: 7, display: ru ? "~7 кБ" : "~7 kB" },
      {
        label: "React + ReactDOM",
        value: 45,
        display: ru ? "~45 кБ" : "~45 kB",
      },
    ],
  },
  {
    title: ru
      ? "Память — 10 000 строк, heap после GC"
      : "Memory — 10,000 rows, heap after GC",
    unit: ru ? "МБ · меньше — лучше" : "MB · lower is better",
    rows: [
      {
        label: "Continuum",
        value: 9.7,
        display: ru ? "9.7 МБ" : "9.7 MB",
        best: true,
      },
      { label: "Solid", value: 14.1, display: ru ? "14.1 МБ" : "14.1 MB" },
    ],
  },
  {
    title: ru
      ? "Мусор GC — создание 10 000 строк"
      : "GC garbage — create 10,000 rows",
    unit: ru
      ? "МБ выделено · меньше — лучше"
      : "MB allocated · lower is better",
    rows: [
      {
        label: "Continuum",
        value: 8.4,
        display: ru ? "8.4 МБ" : "8.4 MB",
        best: true,
      },
      { label: "Solid", value: 13.8, display: ru ? "13.8 МБ" : "13.8 MB" },
    ],
  },
];

function pct(chart: Chart, row: Row): number {
  const max = Math.max(...chart.rows.map((r) => r.value));
  return Math.max(4, Math.round((row.value / max) * 100));
}
</script>

<template>
  <div class="cn-bench">
    <div v-for="chart in charts" :key="chart.title" class="cn-bench__chart">
      <div class="cn-bench__head">
        <span class="cn-bench__title">{{ chart.title }}</span>
        <span class="cn-bench__unit">{{ chart.unit }}</span>
      </div>
      <div v-for="row in chart.rows" :key="row.label" class="cn-bench__row">
        <span class="cn-bench__label">{{ row.label }}</span>
        <span class="cn-bench__track">
          <span
            class="cn-bench__fill"
            :class="{ 'cn-bench__fill--best': row.best }"
            :style="{ width: pct(chart, row) + '%' }"
          ></span>
        </span>
        <span
          class="cn-bench__value"
          :class="{ 'cn-bench__value--best': row.best }"
          >{{ row.display }}</span
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.cn-bench {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 24px 0;
}
.cn-bench__chart {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 16px 18px;
  background: var(--vp-c-bg-alt);
}
.cn-bench__head {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
}
.cn-bench__title {
  font-weight: 700;
  font-size: 14px;
}
.cn-bench__unit {
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.cn-bench__row {
  display: grid;
  grid-template-columns: 110px 1fr auto;
  align-items: center;
  gap: 10px;
  margin: 7px 0;
}
.cn-bench__label {
  font-size: 12px;
  color: var(--vp-c-text-2);
  text-align: right;
}
.cn-bench__track {
  height: 14px;
  background: var(--vp-c-default-soft);
  border-radius: 7px;
  overflow: hidden;
}
.cn-bench__fill {
  display: block;
  height: 100%;
  border-radius: 7px;
  background: var(--vp-c-text-3);
  transition: width 0.6s ease;
}
.cn-bench__fill--best {
  background: linear-gradient(90deg, var(--vp-c-brand-1), #8b5cf6);
}
.cn-bench__value {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-2);
  min-width: 56px;
  text-align: right;
}
.cn-bench__value--best {
  color: var(--vp-c-brand-1);
  font-weight: 700;
}
</style>
