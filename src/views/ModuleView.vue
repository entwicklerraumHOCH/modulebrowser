<template lang="pug">
.module
  p Module {{ $route.params.id }} ({{ Math.floor(summary.duration * 10)/10 }} seconds long)
  .inspector
    header
      .col Channel
      .col
        p Content
        .ruler
          template(v-for="i in Math.floor(summary.duration / 10)")
            .mark(:style="{left: `${i*10/summary.duration * zoom *100}%`, display: 'flex', 'justify-content': 'center', 'align-items': 'flex-end', 'margin-top': i%30==0?'20px':null, height: i%30==0?'20px':null}" :class="{major: i%6 == 0}")
              span(v-if="i%30 == 0" style="margin-bottom: 20px; white-space: nowrap;") {{ (i/6) }} min
    .row(v-for="c in channels")
      .col {{ c }}
      .col
        .lane(:style="{width: `${scale*100}%`}")
          .item(
            v-for="i in items[c]",
            :style="{ left: `${(i.start / summary.duration) * zoom * 100}%`, width: `${((i.end - i.start) / summary.duration) * zoom * 100}%` }"
          )
            .tooltip(style="position: relative; width: 100%; height: 100%;")
              span.tooltip-text {{ i.trigger }} ({{ Math.floor((i.end - i.start) * 10) / 10 }}s)
              span(v-if="['number', 'string'].includes(typeof i.trigger) && (i.end-i.start)/summary.duration >= 0.05" style="pointer-events: none; overflow: hidden; width: 100%; display: block")
                span {{ i.trigger }}
</template>

<script lang="ts">
import { content, ContentSummary, dur } from "@/modules";
import { AppStore } from "@/store";
import { computed, defineComponent } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";

export default defineComponent({
  setup() {
    const store = useStore<AppStore>();
    const route = useRoute();
    const mod = computed(() =>
      store.state.modules.find((m) => m.id == route.params.id)
    );
    const summary = computed(() => {
      let m = mod.value;
      if (m == null) {
        return {duration: 0, blocks: {}};
      }
      return content(m, 0);
    });

    const items = computed(()=> summary.value?.blocks);

    const channels = computed(() => {
      let itemsVal = items.value;
      if (itemsVal == null) return [];
      return Object.keys(itemsVal);
    });

    return {
      mod,
      summary,
      items,
      channels,
    };
  },
  data: () => ({
    // duration: 0,
    zoom: 5,
  }),
  async mounted() {
    let id = this.$route.params.id as string;
    // this.duration = (await dur({ id })).seconds!;
  },
});
</script>

<style lang="scss" scoped>
.inspector {
  margin: 0 20px;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: visible;
}

header,
.row {
  display: flex;
}

.col {
  flex: 1;

  &:first-of-type {
    max-width: 15%;
  }
}

.ruler {
  position: relative;
  height: 40px;

  .mark {
    position: absolute;
    height: 40px;
    width: 2px;
    background-color: rgba(black, 0.3);

    &.major {
      background-color: black;
      width: 5px;
    }
  }
}

.lane {
  height: 50px;
  margin-bottom: 5px;
  background-color: #e0f2e9;
  position: relative;
  overflow-y: visible;
}

.item {
  box-sizing: border-box;
  position: absolute;
  height: 40px;
  width: 40px;
  background-color: #5b7b7a;
  border-left: solid rgba(black, 0.3) 2px;
  overflow-y: visible;
}

.tooltip {
  position: relative;
  display: inline-block;
  overflow-y: visible;

  .tooltip-text {
    visibility: hidden;
    width: fit-content;
    background-color: black;
    color: white;
    text-align: center;
    padding: 5px;
    position: absolute;
    z-index: 1;

    bottom: 100%;
    left: 50%;
    margin-left: -60px;
  }
}

.tooltip:hover .tooltip-text {
  visibility: visible;
}
</style>