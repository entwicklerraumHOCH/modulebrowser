<template lang="pug">
.module
  p Module {{ $route.params.id }} ({{ duration }} seconds long)
  p Here comes the rest
  .inspector
    header
      .col Channel
      .col Content
    .row(v-for="c in channels")
      .col {{ c }}
      .col
        .lane
          .item(
            v-for="i in items[c]",
            :style="{ left: `${(i.start / duration) * 100}%`, width: `${((i.end - i.start) / duration) * 100}%` }"
          )
            span(v-if="['number', 'string'].includes(typeof i.trigger)") {{ i.trigger }}
            .tooltip(style="position: relative; width: 100%; height: 100%")
              span.tooltip-text {{ i.trigger }} ({{ Math.floor((i.end - i.start) * 10) / 10 }}s)
    //.lane
      .item(style="position: absolute; left: 50px")
      .item(style="position: absolute; left: 150px; width: 100px")
      .item(style="position: absolute; left: 500px; width: 800px")
      .item(style="position: absolute; left: 1500px; width: 800px")
</template>

<script lang="ts">
import { content, dur } from "@/modules";
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
    const items = computed(() => {
      let m = mod.value;
      if (m == null) {
        return [];
      }
      return content(m, 0);
    });

    const channels = computed(() => {
      let itemsVal = items.value;
      if (itemsVal == null) return [];
      return Object.keys(itemsVal);
    });

    return {
      mod,
      items,
      channels,
    };
  },
  data: () => ({
    duration: 0,
  }),
  async mounted() {
    let id = this.$route.params.id as string;
    this.duration = (await dur({ id })).seconds!;
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
    flex-grow: 0;
    min-width: 300px;
    max-width: 300px;
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
    width: 120px;
    background-color: black;
    color: white;
    text-align: center;
    padding: 5px 0;
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